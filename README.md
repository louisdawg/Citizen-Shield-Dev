# Citizen Shield

A community-powered crisis coordination platform that connects people in crisis regions with verified safety information, mutual aid resources, and real-time communication tools.

Built with React + Vite (frontend), Express + PostgreSQL (backend), and Firebase (authentication + real-time chat).

## Tech Stack

| Layer      | Technology                                                   |
|------------|--------------------------------------------------------------|
| Frontend   | React 19, TypeScript, Tailwind CSS v4, Framer Motion         |
| Backend    | Express.js, PostgreSQL, Firebase Admin SDK                   |
| Auth       | Firebase Authentication (Google OAuth)                       |
| Chat       | Cloud Firestore (real-time)                                  |
| Storage    | Azure Blob Storage (image uploads)                           |
| Dev Tools  | Vite, tsx                                                    |

## Prerequisites

- Node.js 18+
- PostgreSQL 15+
- A Firebase project with Authentication (Google provider) and Firestore enabled
- An Azure Storage account with a blob container (for image uploads)

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

```bash
cp .env.example .env
```

Edit `.env` and fill in your credentials:

- `DATABASE_URL` — PostgreSQL connection string
- `PORT` — Backend API port (default: `3001`)
- `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY` — Firebase Admin SDK credentials (from Firebase Console > Project Settings > Service Accounts > Generate new private key)
- `AZURE_STORAGE_CONNECTION_STRING`, `AZURE_STORAGE_CONTAINER` — Azure Blob Storage credentials

### 3. Set up the database

The database setup has three steps. Run them **in order** — each step depends on the previous one.

#### 3a. Create the database

Connect to PostgreSQL as a superuser (typically `postgres`) and create an empty database:

```bash
psql -h localhost -U postgres -c "CREATE DATABASE citizen_shield;"
```

#### 3b. Create the application admin user

The project ships with a script that creates a dedicated PostgreSQL role (`citizen_shield_admin`) that owns the database and has full DDL + DML rights (CREATE, DROP, ALTER, SELECT, INSERT, UPDATE, DELETE, TRUNCATE) — including on objects created in the future.

1. Open `Backend/002_create_admin_user.sql` and replace `CHANGE_ME_STRONG_PASSWORD` with a secure password.
2. Run the script **as a superuser** against the `postgres` maintenance database (the script switches to `citizen_shield` internally):

   ```bash
   psql -h localhost -U postgres -d postgres -f Backend/002_create_admin_user.sql
   ```

3. Put the same password into your `.env` file:

   ```
   DATABASE_URL=postgres://citizen_shield_admin:<your_password>@localhost:5432/citizen_shield
   ```

#### 3c. Run the schema migration

Now run the migration **as the new admin user** so all created objects are owned by `citizen_shield_admin`:

```bash
psql -h localhost -U citizen_shield_admin -d citizen_shield -f Backend/001_citizen_shield_migration.sql
```

This creates all tables, enums, indexes, triggers, and seeds initial region data (Nepal, Myanmar, Sudan, Iran, Georgia).

> **Troubleshooting**
> - *"permission denied to create extension"* — extensions (`pgcrypto`, `earthdistance`) require superuser rights. Either run step 3c as `postgres`, or have a superuser run the two `CREATE EXTENSION` statements from `001_citizen_shield_migration.sql` once beforehand.
> - *"role already exists"* — safe to ignore; the admin-user script is idempotent and will `ALTER` the existing role instead.

### 4. Configure Firebase (frontend)

Update `firebase-applet-config.json` with your Firebase project's web app config (from Firebase Console > Project Settings > General > Your apps > Web app).

### 5. Set up Firestore security rules

Deploy the included `firestore.rules` to your Firebase project:

```bash
firebase deploy --only firestore:rules
```

## Running the Project

You need two terminals — one for the frontend dev server and one for the backend API.

**Terminal 1 — Frontend (Vite dev server on port 3000):**

```bash
npm run dev
```

**Terminal 2 — Backend (Express API on port 3001):**

```bash
npm run server:dev
```

The Vite dev server automatically proxies `/api/*` requests to the backend on port 3001.

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Available Scripts

| Command              | Description                                     |
|----------------------|-------------------------------------------------|
| `npm run dev`        | Start Vite dev server (port 3000)               |
| `npm run server:dev` | Start Express API with hot reload (port 3001)   |
| `npm run server`     | Start Express API without hot reload            |
| `npm run build`      | Build frontend for production                   |
| `npm run preview`    | Preview production build locally                |
| `npm run lint`       | Type-check with TypeScript (`tsc --noEmit`)     |
| `npm run clean`      | Remove `dist/` folder                           |

## Project Structure

```
├── Backend/
│   ├── 001_citizen_shield_migration.sql   # Database schema + seed data
│   ├── 002_create_admin_user.sql          # Creates citizen_shield_admin role with full rights
│   ├── db.ts                              # PostgreSQL connection pool
│   ├── server.ts                          # Express app entrypoint
│   ├── middleware/
│   │   └── auth.ts                        # Firebase token verification middleware
│   └── routes/
│       ├── auth.ts                        # POST /api/auth/sync, GET /api/auth/me
│       ├── regions.ts                     # GET /api/regions, GET /api/regions/:slug, POST /api/regions/:slug/join
│       ├── posts.ts                       # CRUD for community posts
│       ├── votes.ts                       # POST/GET /api/posts/:id/vote
│       ├── moderation.ts                  # GET /api/moderation, POST /api/moderation/:id/review
│       └── upload.ts                      # POST /api/upload/image (Azure Blob)
├── src/
│   ├── main.tsx                           # App entrypoint with AuthProvider
│   ├── App.tsx                            # Root component with view routing
│   ├── api.ts                             # Authenticated fetch helper
│   ├── firebase.ts                        # Firebase client SDK init
│   ├── types.ts                           # TypeScript interfaces (Post, Region)
│   ├── data.ts                            # Hardcoded seed data (for frontend)
│   ├── constants.ts                       # Animation variants
│   ├── index.css                          # Tailwind config + theme
│   ├── context/
│   │   └── AuthContext.tsx                # Global auth state (Firebase + backend sync)
│   ├── components/
│   │   ├── TopNav.tsx                     # Top navigation with auth UI
│   │   ├── Sidebar.tsx                    # Desktop sidebar navigation
│   │   ├── BottomNav.tsx                  # Mobile bottom navigation
│   │   ├── Chat.tsx                       # Real-time Firestore chat
│   │   ├── PostForm.tsx                   # Submit community report modal
│   │   ├── TimelineItem.tsx               # Single post in timeline
│   │   └── RegionSelector.tsx             # Region picker modal
│   └── views/
│       ├── HubView.tsx                    # Global hub overview
│       ├── FeedView.tsx                   # Region-specific post feed
│       └── SafetyView.tsx                 # Safety protocols + resources
├── firebase-applet-config.json            # Firebase web app config
├── firebase-blueprint.json                # Firebase project blueprint
├── firestore.rules                        # Firestore security rules
├── vite.config.ts                         # Vite config with API proxy
├── tsconfig.json                          # TypeScript config
└── package.json
```

## What Is Implemented

### Backend (Express API)

- **Authentication** — Firebase token verification middleware (`verifyToken`, `optionalToken`), user sync endpoint that upserts users in PostgreSQL on login, profile endpoint with verification stats
- **Regions** — List all regions (sorted by intensity), get region details with safe zones and resources, join a region, get member counts
- **Posts** — Create posts with location blurring (~1 km precision), list posts with filtering (by region, status, tag), get single post, delete posts (author or moderator)
- **Voting** — Upvote/downvote with upsert logic, vote removal, DB triggers that auto-sync denormalized counts
- **Moderation** — Queue for flagged posts, moderator-only access, approve/reject workflow that updates post status
- **Image upload** — Multipart upload to Azure Blob Storage with file type validation (JPEG, PNG, WebP) and 10 MB limit
- **Database** — Full PostgreSQL schema with enums, foreign keys, indexes, triggers for `updated_at` and vote count sync, audit trail for verification badges

### Frontend (React)

- **Google authentication** — Global `AuthContext` with Firebase Google OAuth, automatic backend sync on login, sign-in/sign-out UI in TopNav (with dropdown showing user stats) and Sidebar
- **Region carousel** — Browse 5 crisis regions with animated transitions, stats cards (intensity, hubs, connectivity), emergency contacts, safe zones, resources
- **Timeline feed** — Chronological post display per region with type indicators (critical, info, broadcast), images, and tags
- **Post form** — Modal to submit community reports with type selector, title, description, and image URL
- **Real-time chat** — Per-region Firestore chat with Google auth, message bubbles, user avatars
- **Multiple views** — Hub (global overview), Regions (country timelines), Feed (filtered posts), Safety (protocols + guides)
- **Responsive layout** — Desktop sidebar + top nav, mobile bottom nav
- **Animations** — Page transitions, carousel, hover effects via Framer Motion

## What Needs to Be Implemented

### Frontend — Backend Integration

The frontend currently uses hardcoded data from `src/data.ts`. The following needs to be connected to the backend API using `src/api.ts`:

- [ ] **Fetch regions from API** — Replace `INITIAL_REGIONS` with `GET /api/regions` data on app load
- [ ] **Fetch posts from API** — Replace `INITIAL_POSTS` with `GET /api/posts?regionSlug=...`
- [ ] **Submit posts via API** — Wire `PostForm` to `POST /api/posts` instead of local state
- [ ] **Voting UI** — Add upvote/downvote buttons to `TimelineItem`, call `POST /api/posts/:id/vote`
- [ ] **Image upload** — Replace the URL text input in `PostForm` with file upload via `POST /api/upload/image`
- [ ] **Join region** — Wire "Offer Support" button to `POST /api/regions/:slug/join`

### Frontend — New Features

- [ ] **URL routing** — Add `react-router-dom` for real navigation (bookmarkable URLs, browser back/forward)
- [ ] **Moderation dashboard** — UI for moderators to review flagged posts (`GET /api/moderation`, `POST /api/moderation/:id/review`)
- [ ] **User profile page** — Display user info, verification badge, post history
- [ ] **Loading states** — Spinners/skeletons while fetching data from the API
- [ ] **Error handling** — Toast notifications for failed API calls, error boundaries
- [ ] **Search and filtering** — Post filtering by type/tag in the feed view

### Backend — Missing Logic

- [ ] **EXIF stripping** — The upload route stores raw image buffers; add EXIF removal (e.g. using `sharp`) before uploading to Azure
- [ ] **Distance-based moderation** — Calculate distance between user GPS coordinates and region; auto-flag posts with >5 km discrepancy into `moderation_queue`
- [ ] **Verification stats recalculation** — Implement periodic or event-driven recalculation of `user_verification_stats` (qualifying posts, badge eligibility)
- [ ] **Input validation** — Validate title length (5–200 chars) and description length (10–2000 chars) in the posts route before hitting DB constraints
- [ ] **Rate limiting** — Add rate limiting middleware to prevent abuse
- [ ] **Seed data for safe zones and resources** — The SQL migration seeds regions but not `region_safe_zones` or `region_resources` tables

### Infrastructure

- [ ] **Tests** — No test files exist yet; add unit and integration tests
- [ ] **CI/CD** — Set up a pipeline for linting, testing, and deployment
- [ ] **Production build for backend** — Currently runs via `tsx`; add a proper build step for production
