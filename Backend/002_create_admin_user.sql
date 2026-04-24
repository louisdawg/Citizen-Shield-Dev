-- ============================================================
-- CITIZEN SHIELD – Administrator-Benutzer anlegen
-- Version:  002
-- Datenbank: PostgreSQL 15+
--
-- Ausführen als Superuser (z. B. "postgres"):
--   psql -h <host> -U postgres -d postgres -f 002_create_admin_user.sql
--
-- Der Benutzer "citizen_shield_admin" erhält volle Rechte auf
-- der Datenbank "citizen_shield": CREATE, DROP, ALTER, SELECT,
-- INSERT, UPDATE, DELETE, TRUNCATE auf alle Objekte – inklusive
-- Objekten, die in Zukunft erstellt werden.
-- ============================================================


-- ============================================================
-- PASSWORT
-- WICHTIG: Vor Ausführung ein sicheres Passwort eintragen!
-- ============================================================

\set admin_password '\'CHANGE_ME_STRONG_PASSWORD\''


-- ============================================================
-- ROLLE ERSTELLEN
-- ============================================================

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'citizen_shield_admin') THEN
        CREATE ROLE citizen_shield_admin
            WITH LOGIN
                 CREATEDB
                 CREATEROLE
                 NOSUPERUSER
                 INHERIT
                 NOREPLICATION
                 CONNECTION LIMIT -1
                 PASSWORD :admin_password;
    ELSE
        ALTER ROLE citizen_shield_admin
            WITH LOGIN
                 CREATEDB
                 CREATEROLE
                 NOSUPERUSER
                 INHERIT
                 NOREPLICATION
                 PASSWORD :admin_password;
    END IF;
END
$$;


-- ============================================================
-- DATENBANK-BESITZ
-- Besitzer darf alles innerhalb der DB (DDL + DML)
-- ============================================================

ALTER DATABASE citizen_shield OWNER TO citizen_shield_admin;


-- ============================================================
-- VERBINDUNG ZUR ZIEL-DB WECHSELN
-- ============================================================

\connect citizen_shield


-- ============================================================
-- RECHTE AUF DATENBANK-EBENE
-- ============================================================

GRANT ALL PRIVILEGES ON DATABASE citizen_shield TO citizen_shield_admin;


-- ============================================================
-- RECHTE AUF SCHEMA public
-- ============================================================

ALTER SCHEMA public OWNER TO citizen_shield_admin;
GRANT ALL PRIVILEGES ON SCHEMA public TO citizen_shield_admin;


-- ============================================================
-- RECHTE AUF ALLE BESTEHENDEN OBJEKTE IM SCHEMA public
-- ============================================================

GRANT ALL PRIVILEGES ON ALL TABLES    IN SCHEMA public TO citizen_shield_admin;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO citizen_shield_admin;
GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public TO citizen_shield_admin;
GRANT ALL PRIVILEGES ON ALL ROUTINES  IN SCHEMA public TO citizen_shield_admin;


-- ============================================================
-- DEFAULT PRIVILEGES
-- Gilt automatisch für zukünftig erstellte Objekte
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
-- VERIFIKATION
-- ============================================================

\echo 'Rolle angelegt und Rechte vergeben:'
SELECT rolname, rolcanlogin, rolcreatedb, rolcreaterole, rolsuper
FROM   pg_roles
WHERE  rolname = 'citizen_shield_admin';
