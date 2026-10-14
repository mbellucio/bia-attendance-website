# BIA Attendance

A Next.js app with Steam-only sign-in and a Prisma/PostgreSQL attendance model.

## Local setup

1. Install dependencies with `npm install`.
2. The local `.env` is created and ignored by Git. On a fresh checkout, copy `.env.example` to `.env`, then set `AUTH_SECRET` to a random value of at least 32 characters and `POSTGRES_PASSWORD` to a random hex password. Use the same password in both local database URLs.
3. Start local PostgreSQL with `docker compose up -d db`.
4. Create or update the database schema with `npm run db:migrate`.
5. On a fresh database, preview the bundled historical archive with `npm run db:import-logs`, then import it with `npm run db:import-logs -- --apply`.
6. Start the app with `npm run dev` when you are ready.
7. Open `http://localhost:3000` and choose **Sign in through Steam**. Steam login does not need an API key for the account ID.

The Compose service listens only on your own computer, and PostgreSQL data persists in the `attendance_postgres_data` Docker volume. Stop the database with `docker compose down`; this keeps the data. `docker compose down -v` removes the volume and permanently deletes the local database contents.

## Deploy to Vercel

The raw archive and duration/identity lookup files are bundled in `data/archive`, so the production build does not read folders from the developer's computer. The Vercel build command runs `prisma migrate deploy`, imports the bundled archive, then builds Next.js. It runs the database steps only on Production; Preview builds skip them.

Set `DATABASE_URL` in Vercel Production to the hosted Postgres URL. If your provider offers a separate direct connection for schema changes, set `DIRECT_URL` too; Prisma uses it for migrations. Also set the app's existing `AUTH_SECRET` and `APP_URL` values. The production migration and import are idempotent for unchanged source files.

The archive includes player names and SteamID64s. Keep the source repository private if those records should not be public. Do not put database credentials in Git; configure them as Vercel environment variables.

See [the deployment runbook](docs/DEPLOYMENT.md) for the exact build sequence.

## Steam identity and sessions

Steam signs the visitor in on Steam's own site and returns an OpenID 2.0 assertion. The callback verifies the assertion with Steam before creating a signed, HTTP-only, secure-in-production session cookie. No Steam password is received by this app.

Basic Steam OpenID sign-in provides the SteamID64. It does not provide an email address or profile details, so email is nullable. Historical log import creates both a User and a linked Player for each resolvable Steam ID and stores the most recently observed nickname. The User table has an `admin` flag; `data/admin-users.json` bootstraps Seedorf as the initial admin.

## Prisma and attendance data

`DATABASE_URL` is the app's PostgreSQL connection URL; `DIRECT_URL` is used by Prisma migrations. For this local Docker setup, both point directly to the database on `localhost:5432`. Keep `.env` out of Git.

The Prisma schema models Users, Players, Events, EventParticipants, EventLogLines, and PlayerSessions. The raw source log lines are preserved. Sessions store separate visits so reconnect gaps are not counted as play time.

The historical archive is imported separately from the schema migration. `npm run db:import-logs` is a read-only preview; add `-- --apply` to import. The import is safe to rerun for unchanged source files. The completed local database contains 487 events, 238,064 raw lines, and 881 linked User/Player pairs. Some attendance results remain pending where session evidence or duration metadata is incomplete.

Imported timestamps preserve the server's logged wall-clock time. The logs do not state a time zone, so they are not converted to UTC.

## Authentication endpoints

- `GET /api/auth/steam` starts Steam OpenID sign-in.
- `GET /api/auth/steam/callback` verifies the assertion and establishes a session.
- The sign-out button clears the session cookie.

Only Steam sign-in is offered. This is identity verification, not BIA membership or role authorization; access restrictions can be added when the attendance workflows are designed.
