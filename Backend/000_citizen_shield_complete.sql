-- ============================================================
-- CITIZEN SHIELD – Vollständiges DB-Setup (ein Datei)
-- Version:  combined (000 + 001)
-- Datenbank: PostgreSQL 15+
-- ------------------------------------------------------------
-- Erstellt in EINEM Durchlauf als PostgreSQL-Superuser:
--   1. Rolle  citizen_shield_admin        (idempotent)
--   2. Datenbank citizen_shield            (idempotent)
--   3. Alle Rechte für citizen_shield_admin auf DB- und Schema-Ebene
--   4. Default-Rechte für zukünftig erstellte Objekte
--   5. Extensions pgcrypto und earthdistance (benötigen Superuser)
--   6. Alle Tabellen, ENUMs, Indexes, Trigger und Seed-Daten
--
-- Voraussetzungen: nur psql + ein Superuser-Zugang (typisch "postgres").
--
-- Ausführung:
--   psql -h localhost -U postgres -v admin_password=DeinSicheresPasswort -f 000_citizen_shield_complete.sql
--
-- Wenn  -v admin_password=...  fehlt, wird ein Platzhalter benutzt.
-- UNBEDINGT vor Produktions-Einsatz ein eigenes Passwort übergeben!
-- ============================================================

\set ON_ERROR_STOP on


-- ------------------------------------------------------------
-- Passwort-Variable (Default falls nicht per -v gesetzt)
-- ------------------------------------------------------------
\if :{?admin_password}
\else
  \set admin_password CHANGE_ME_STRONG_PASSWORD
  \echo ''
  \echo '*** WARNUNG: kein Passwort uebergeben – Platzhalter wird benutzt.         ***'
  \echo '*** Mit  -v admin_password=<pw>  ein eigenes Passwort setzen.             ***'
  \echo ''
\endif


-- ============================================================
-- 1. ROLLE ANLEGEN / AKTUALISIEREN (idempotent)
-- ============================================================
SET citizen_shield.setup_password = :'admin_password';

DO $$
DECLARE
  pw TEXT := current_setting('citizen_shield.setup_password');
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'citizen_shield_admin') THEN
    EXECUTE format(
      'CREATE ROLE citizen_shield_admin
         WITH LOGIN CREATEDB CREATEROLE NOSUPERUSER INHERIT NOREPLICATION
              CONNECTION LIMIT -1 PASSWORD %L', pw);
    RAISE NOTICE 'Rolle citizen_shield_admin angelegt.';
  ELSE
    EXECUTE format(
      'ALTER ROLE citizen_shield_admin
         WITH LOGIN CREATEDB CREATEROLE NOSUPERUSER INHERIT NOREPLICATION
              PASSWORD %L', pw);
    RAISE NOTICE 'Rolle citizen_shield_admin aktualisiert.';
  END IF;
END
$$;


-- ============================================================
-- 2. DATENBANK ANLEGEN (idempotent)
-- ============================================================
SELECT 'CREATE DATABASE citizen_shield OWNER citizen_shield_admin'
 WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'citizen_shield')
\gexec

ALTER DATABASE citizen_shield OWNER TO citizen_shield_admin;


-- ============================================================
-- 3. DATENBANK-RECHTE
-- ============================================================
GRANT ALL PRIVILEGES ON DATABASE citizen_shield TO citizen_shield_admin;


-- ============================================================
-- 4. VERBINDUNG ZUR ZIEL-DATENBANK WECHSELN
-- ============================================================
\connect citizen_shield


-- ============================================================
-- 5. EXTENSIONS (Superuser erforderlich)
-- ============================================================
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "earthdistance" CASCADE;


-- ============================================================
-- 6. SCHEMA-RECHTE (public)
-- ============================================================
ALTER SCHEMA public OWNER TO citizen_shield_admin;
GRANT  ALL PRIVILEGES ON SCHEMA public TO citizen_shield_admin;


-- ============================================================
-- 7. RECHTE AUF BEREITS VORHANDENE OBJEKTE
-- ============================================================
GRANT ALL PRIVILEGES ON ALL TABLES    IN SCHEMA public TO citizen_shield_admin;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO citizen_shield_admin;
GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public TO citizen_shield_admin;
GRANT ALL PRIVILEGES ON ALL ROUTINES  IN SCHEMA public TO citizen_shield_admin;


-- ============================================================
-- 8. DEFAULT-RECHTE FÜR ZUKÜNFTIG ERSTELLTE OBJEKTE
-- ============================================================
ALTER DEFAULT PRIVILEGES IN SCHEMA public
    GRANT ALL PRIVILEGES ON TABLES    TO citizen_shield_admin;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
    GRANT ALL PRIVILEGES ON SEQUENCES TO citizen_shield_admin;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
    GRANT ALL PRIVILEGES ON FUNCTIONS TO citizen_shield_admin;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
    GRANT ALL PRIVILEGES ON ROUTINES  TO citizen_shield_admin;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
    GRANT ALL PRIVILEGES ON TYPES     TO citizen_shield_admin;


-- ============================================================
-- 9. ENUMS
-- Typsichere Werte für Status-Felder
-- ============================================================

CREATE TYPE region_intensity      AS ENUM ('CRITICAL', 'HIGH', 'ALERT', 'STABLE');
CREATE TYPE user_role_in_region   AS ENUM ('member', 'moderator', 'hub_coordinator');
CREATE TYPE post_type             AS ENUM ('critical', 'info', 'broadcast');
CREATE TYPE post_status           AS ENUM ('live', 'pending_review', 'rejected');
CREATE TYPE location_status       AS ENUM ('verified', 'unverified', 'none', 'pending_review');
CREATE TYPE location_source       AS ENUM ('exif', 'manual', 'geocoded');
CREATE TYPE vote_type             AS ENUM ('upvote', 'downvote');
CREATE TYPE moderation_reason     AS ENUM ('distance_exceeded', 'flagged', 'manual');
CREATE TYPE moderation_status     AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE verification_action   AS ENUM ('granted', 'revoked');


-- ============================================================
-- 10. TABELLE: users
-- Zentrale Identitätstabelle – verknüpft mit Google Auth
-- ============================================================

CREATE TABLE users (
  id                      UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  google_uid              TEXT          NOT NULL UNIQUE,        -- Firebase Auth UID
  email                   TEXT          NOT NULL UNIQUE,
  display_name            TEXT          NOT NULL,
  avatar_url              TEXT,

  -- Verifikations-Badge
  is_verified             BOOLEAN       NOT NULL DEFAULT FALSE,
  verified_at             TIMESTAMPTZ,
  verified_revoked_at     TIMESTAMPTZ,
  verified_revoke_reason  TEXT,

  created_at              TIMESTAMPTZ   NOT NULL DEFAULT now(),
  last_active_at          TIMESTAMPTZ   NOT NULL DEFAULT now()
);

COMMENT ON TABLE  users                        IS 'Alle registrierten User. Authentifizierung via Google OAuth / Firebase.';
COMMENT ON COLUMN users.google_uid             IS 'Firebase Auth UID – wird beim Login zur Identifikation verwendet.';
COMMENT ON COLUMN users.is_verified            IS 'Blaues Häkchen: einmalig vergeben, kann nur durch Admin entzogen werden.';
COMMENT ON COLUMN users.verified_revoke_reason IS 'Pflichtfeld wenn is_verified auf FALSE gesetzt wird.';


-- ============================================================
-- 11. TABELLE: user_verification_stats
-- Cached Stats für Badge-Berechnung – 1:1 zu users
-- ============================================================

CREATE TABLE user_verification_stats (
  user_id                   UUID    PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  total_posts               INT     NOT NULL DEFAULT 0,
  qualifying_posts          INT     NOT NULL DEFAULT 0,   -- Posts mit ≥90% Upvotes bei ≥50 Stimmen
  total_upvotes_received    INT     NOT NULL DEFAULT 0,
  total_downvotes_received  INT     NOT NULL DEFAULT 0,
  last_calculated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE  user_verification_stats                  IS 'Aggregierte Stats pro User für Badge-Berechnung. Wird asynchron aktualisiert.';
COMMENT ON COLUMN user_verification_stats.qualifying_posts IS 'Anzahl Posts die die Schwelle erfüllen: ≥90% Upvotes bei ≥50 Gesamtstimmen. Badge wird vergeben ab qualifying_posts >= 10.';


-- ============================================================
-- 12. TABELLE: verification_log
-- Audit Trail für jeden Badge-Entzug oder -Vergabe durch Admin
-- ============================================================

CREATE TABLE verification_log (
  id          UUID                PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID                NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  admin_id    UUID                NOT NULL REFERENCES users(id),
  action      verification_action NOT NULL,
  reason      TEXT,
  created_at  TIMESTAMPTZ         NOT NULL DEFAULT now()
);

COMMENT ON TABLE verification_log IS 'Vollständige History aller Badge-Vergaben und Entziehungen durch Admins.';


-- ============================================================
-- 13. TABELLE: regions
-- Krisenregionen – dynamische Status-Felder werden vom Backend aktualisiert
-- ============================================================

CREATE TABLE regions (
  id                UUID              PRIMARY KEY DEFAULT gen_random_uuid(),
  slug              TEXT              NOT NULL UNIQUE,
  name              TEXT              NOT NULL,
  intensity         region_intensity  NOT NULL DEFAULT 'STABLE',
  active_hubs       INT               NOT NULL DEFAULT 0,
  connectivity      INT               NOT NULL DEFAULT 0 CHECK (connectivity BETWEEN 0 AND 100),
  description       TEXT,
  image_url         TEXT,
  map_image_url     TEXT,
  emergency_contact TEXT,
  updated_at        TIMESTAMPTZ       NOT NULL DEFAULT now()
);

COMMENT ON TABLE  regions              IS 'Aktive Krisenregionen. intensity, active_hubs und connectivity werden vom Backend laufend aktualisiert.';
COMMENT ON COLUMN regions.slug         IS 'URL-freundlicher Identifier – wird als Firestore Collection-Key für region_status verwendet.';
COMMENT ON COLUMN regions.connectivity IS 'Prozentsatz 0–100. Wird auch in Firestore region_status gespiegelt für Live-Updates.';


-- ============================================================
-- 14. TABELLE: region_safe_zones
-- Verifizierte sichere Treffpunkte pro Region
-- ============================================================

CREATE TABLE region_safe_zones (
  id          UUID  PRIMARY KEY DEFAULT gen_random_uuid(),
  region_id   UUID  NOT NULL REFERENCES regions(id) ON DELETE CASCADE,
  name        TEXT  NOT NULL,
  description TEXT
);

COMMENT ON TABLE region_safe_zones IS 'Verifizierte Safe Zones pro Region. Erweiterbar mit GPS-Koordinaten für Kartenansicht.';


-- ============================================================
-- 15. TABELLE: region_resources
-- Lokale Ressourcen (Medizin, Rechtsberatung, etc.)
-- ============================================================

CREATE TABLE region_resources (
  id          UUID  PRIMARY KEY DEFAULT gen_random_uuid(),
  region_id   UUID  NOT NULL REFERENCES regions(id) ON DELETE CASCADE,
  title       TEXT  NOT NULL,
  category    TEXT  NOT NULL,   -- z.B. 'Medical', 'Legal', 'Comms'
  location    TEXT
);

COMMENT ON TABLE region_resources IS 'Lokale Ressourcen pro Region. category ermöglicht Filterung im Safety Hub.';


-- ============================================================
-- 16. TABELLE: user_regions
-- M:N Verbindung User ↔ Region mit Rolle
-- ============================================================

CREATE TABLE user_regions (
  id          UUID                PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID                NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  region_id   UUID                NOT NULL REFERENCES regions(id) ON DELETE CASCADE,
  role        user_role_in_region NOT NULL DEFAULT 'member',
  joined_at   TIMESTAMPTZ         NOT NULL DEFAULT now(),

  UNIQUE (user_id, region_id)
);

COMMENT ON TABLE  user_regions      IS 'Zugehörigkeit eines Users zu einer Region. Ein User kann mehreren Regionen angehören.';
COMMENT ON COLUMN user_regions.role IS 'member = normaler User, moderator = kann Posts reviewen, hub_coordinator = kann Region-Status aktualisieren.';


-- ============================================================
-- 17. TABELLE: posts
-- Community-Reports – werden sofort gepostet (außer bei Distanz-Anomalie)
-- ============================================================

CREATE TABLE posts (
  id                    UUID              PRIMARY KEY DEFAULT gen_random_uuid(),
  region_id             UUID              NOT NULL REFERENCES regions(id) ON DELETE CASCADE,
  author_id             UUID              NOT NULL REFERENCES users(id),

  -- Inhalt
  title                 TEXT              NOT NULL CHECK (char_length(title) BETWEEN 5 AND 200),
  description           TEXT              NOT NULL CHECK (char_length(description) BETWEEN 10 AND 2000),
  type                  post_type         NOT NULL DEFAULT 'info',
  image_url             TEXT,

  -- Voting (denormalisiert für Performance)
  upvote_count          INT               NOT NULL DEFAULT 0,
  downvote_count        INT               NOT NULL DEFAULT 0,

  -- Status
  post_status           post_status       NOT NULL DEFAULT 'live',
  moderation_note       TEXT,

  -- Location – intern (niemals an Client übergeben)
  location_lat          DOUBLE PRECISION,
  location_lng          DOUBLE PRECISION,
  location_source       location_source,
  location_distance_m   INT,

  -- Location – öffentlich (~1km gerundet)
  location_public_lat   DOUBLE PRECISION,
  location_public_lng   DOUBLE PRECISION,
  location_label        TEXT,
  location_status       location_status   NOT NULL DEFAULT 'none',

  created_at            TIMESTAMPTZ       NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ       NOT NULL DEFAULT now()
);

COMMENT ON TABLE  posts                     IS 'Community-Reports. Werden sofort veröffentlicht außer bei Distanz-Anomalie (>5km).';
COMMENT ON COLUMN posts.image_url           IS 'Azure Blob URL. EXIF wurde serverseitig gestrippt bevor Upload. Original-Bild wird sofort gelöscht.';
COMMENT ON COLUMN posts.upvote_count        IS 'Denormalisierter Zähler – wird bei jedem Vote inkrementiert. Echte Daten in post_votes.';
COMMENT ON COLUMN posts.location_lat        IS 'Exakte Koordinaten – NIEMALS in API-Responses an Client übergeben.';
COMMENT ON COLUMN posts.location_public_lat IS 'Auf 2 Dezimalstellen gerundet (~1.1km Unschärfe) – safe für öffentliche Kartenanzeige.';
COMMENT ON COLUMN posts.location_distance_m IS 'Berechnete Distanz beim Upload. >5000m → pending_review.';


-- ============================================================
-- 18. TABELLE: post_tags
-- Tags als eigene Tabelle für Querybarkeit
-- ============================================================

CREATE TABLE post_tags (
  id        UUID  PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id   UUID  NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  tag       TEXT  NOT NULL CHECK (char_length(tag) BETWEEN 1 AND 50),

  UNIQUE (post_id, tag)
);

COMMENT ON TABLE post_tags IS 'Tags als separate Zeilen – ermöglicht Filterung wie "alle Posts mit Tag MeshNet in Myanmar".';


-- ============================================================
-- 19. TABELLE: post_votes
-- Öffentliche Votes – jeder sieht wer wie gevoted hat
-- ============================================================

CREATE TABLE post_votes (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id     UUID        NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  voter_id    UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  vote_type   vote_type   NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE (post_id, voter_id)
);

COMMENT ON TABLE  post_votes           IS 'Vollständig öffentliche Votes. UNIQUE auf (post_id, voter_id) verhindert Mehrfachvoting.';
COMMENT ON COLUMN post_votes.vote_type IS 'upvote oder downvote. Ändern via UPDATE (nicht DELETE + INSERT) um created_at zu erhalten.';


-- ============================================================
-- 20. TABELLE: moderation_queue
-- Posts die >5km vom angegebenen Ort entfernt erstellt wurden
-- ============================================================

CREATE TABLE moderation_queue (
  id              UUID                  PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id         UUID                  NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  moderator_id    UUID                  REFERENCES users(id),
  reason          moderation_reason     NOT NULL DEFAULT 'distance_exceeded',
  distance_m      INT,
  status          moderation_status     NOT NULL DEFAULT 'pending',
  moderator_note  TEXT,
  created_at      TIMESTAMPTZ           NOT NULL DEFAULT now(),
  reviewed_at     TIMESTAMPTZ
);

COMMENT ON TABLE  moderation_queue              IS 'Review-Queue für Posts mit Distanz-Anomalie oder manuell geflaggten Posts.';
COMMENT ON COLUMN moderation_queue.moderator_id IS 'NULL = noch nicht zugewiesen. Wird gesetzt wenn ein Moderator den Case übernimmt.';
COMMENT ON COLUMN moderation_queue.distance_m   IS 'Distanz in Metern zwischen User-GPS und angegebenem Ort beim Upload.';


-- ============================================================
-- 21. INDEXES
-- ============================================================

CREATE INDEX idx_posts_region_created ON posts (region_id, created_at DESC);
CREATE INDEX idx_posts_status         ON posts (post_status);
CREATE INDEX idx_posts_location       ON posts (location_status) WHERE location_status = 'verified';
CREATE INDEX idx_modqueue_pending     ON moderation_queue (status, created_at) WHERE status = 'pending';
CREATE INDEX idx_votes_post_voter     ON post_votes (post_id, voter_id);
CREATE INDEX idx_tags_tag             ON post_tags (tag);
CREATE INDEX idx_users_google_uid     ON users (google_uid);
CREATE INDEX idx_regions_slug         ON regions (slug);


-- ============================================================
-- 22. TRIGGER: updated_at automatisch aktualisieren
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_posts_updated_at
  BEFORE UPDATE ON posts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();


-- ============================================================
-- 23. TRIGGER: upvote_count / downvote_count automatisch aktualisieren
-- ============================================================

CREATE OR REPLACE FUNCTION sync_vote_counts()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE posts
  SET
    upvote_count   = (SELECT COUNT(*) FROM post_votes WHERE post_id = COALESCE(NEW.post_id, OLD.post_id) AND vote_type = 'upvote'),
    downvote_count = (SELECT COUNT(*) FROM post_votes WHERE post_id = COALESCE(NEW.post_id, OLD.post_id) AND vote_type = 'downvote')
  WHERE id = COALESCE(NEW.post_id, OLD.post_id);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_sync_vote_counts
  AFTER INSERT OR UPDATE OR DELETE ON post_votes
  FOR EACH ROW EXECUTE FUNCTION sync_vote_counts();


-- ============================================================
-- 24. TRIGGER: user_verification_stats automatisch anlegen
-- ============================================================

CREATE OR REPLACE FUNCTION create_verification_stats()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_verification_stats (user_id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_create_verification_stats
  AFTER INSERT ON users
  FOR EACH ROW EXECUTE FUNCTION create_verification_stats();


-- ============================================================
-- 25. SEED DATA: Initiale Regionen
-- ============================================================

INSERT INTO regions (slug, name, intensity, active_hubs, connectivity, description, emergency_contact) VALUES
  ('nepal',   'NEPAL',   'CRITICAL', 14, 62, 'Community-led support networks are active across the Kathmandu Valley.',       '+977 1-4200105'),
  ('myanmar', 'MYANMAR', 'HIGH',     28, 45, 'Civil Disobedience Movement nodes are coordinating essential services.',        'Signal: @MyanmarAid_Bot'),
  ('sudan',   'SUDAN',   'CRITICAL', 12, 38, 'Resistance Committees are managing neighborhood-level aid distribution.',       'WhatsApp: +249 912 345 678'),
  ('iran',    'IRAN',    'HIGH',     42, 55, 'Decentralized networks are providing critical updates on internet blackouts.',   'Telegram: @IranFreedom_Support'),
  ('georgia', 'GEORGIA', 'ALERT',    18, 88, 'Monitoring legislative developments and coordinating peaceful assemblies.',     '+995 32 2 123 456');


-- ============================================================
-- 26. VERIFIKATION
-- ============================================================
\echo ''
\echo '=== Setup abgeschlossen ==='

SELECT rolname, rolcanlogin, rolcreatedb, rolcreaterole, rolsuper
FROM   pg_roles
WHERE  rolname = 'citizen_shield_admin';

SELECT datname AS database,
       pg_catalog.pg_get_userbyid(datdba) AS owner
FROM   pg_database
WHERE  datname = 'citizen_shield';

SELECT extname, extversion
FROM   pg_extension
WHERE  extname IN ('pgcrypto', 'earthdistance', 'cube');

SELECT table_name
FROM   information_schema.tables
WHERE  table_schema = 'public'
ORDER  BY table_name;

\echo ''
\echo 'Datenbank, Schema und Seed-Daten erfolgreich eingerichtet.'
\echo ''
