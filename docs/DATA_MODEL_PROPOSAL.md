# Attendance data model and import

## Source archive

The historical source is the raw Arma log archive bundled under `data/archive`. It contains 487 event files and 238,064 raw lines. Connection lines provide SteamID64 in nearly all cases; Steam OpenID itself does not provide the player's email.

The importer keeps each original line in `event_log_lines`. It also parses player connection actions, links lines to known Steam accounts where possible, creates connection sessions, and stores uncertainty in `parse_note` rather than guessing.

## Tables and identity

- **User** is a website account and owns the unique SteamID64 used for Steam sign-in. Email stays optional because Steam sign-in does not return one. `admin` is a Boolean role flag and defaults to false.
- **Player** is the in-game attendance identity. A historical Steam ID creates a User and a linked Player; Player stores the observed nickname. This lets a past attendee sign in later and match their history.
- **Event** represents one source log file, keyed by its filename stem and protected by a SHA-256 checksum.
- **EventParticipant** uniquely joins one Player to one Event and stores connected time and attendance calculation state.
- **PlayerSession** stores each matched connect/disconnect interval, so reconnect gaps are not counted as play time.
- **EventLogLine** preserves every original line, including lines that could not be matched to a session.

Steam IDs remain on User as the sign-in key. Player points to User through a nullable unique foreign key. Historical identities with a Steam ID populate both rows; lines without a reliable Steam ID remain in the raw log table without a guessed account.

The bootstrap admin list is `data/admin-users.json`. The importer applies it after creating User and Player rows, so it also works on an empty production database. The current initial admin is Seedorf, SteamID64 `76561198120795598`. All other accounts default to `admin=false`.

## Attendance and timestamps

Completed session durations are summed per event and player. An attendance result is only calculated when all of that player's sessions are closed and a threshold is known. The legacy rule uses 55 minutes for TRN and the archive's Duration value for other event types; the event stores mission duration and attendance threshold in separate fields. Incomplete or unresolved sessions leave the result pending for later review.

The logs contain local time-of-day without a time zone. The importer retains the event date and stores parsed wall-clock fields without claiming a time zone conversion. Configure the server time zone before using historical timestamps for cross-zone reporting.

## Import behavior

`scripts/import-logs.ts` defaults to a read-only dry run. Applying it is a separate step after the schema migration. It is restartable: already imported events with the same checksum are skipped, and a changed source file aborts before new event data is written. Each event's records are inserted in a transaction.

The importer upserts one User and one linked Player per SteamID64, setting the latest nickname observed in the archive on both records. It does not invent email addresses. Every event log line is preserved, while unmatched and ambiguous disconnects are marked for review.

## Completed local import

The schema migration and historical import have been applied to the local PostgreSQL database. Verified row counts:

- 487 events
- 238,064 raw log lines
- 33,710 event participants
- 51,332 connection sessions
- 881 Users and 881 linked Players
- 30,600 attendance results calculated
- 3,110 attendance results pending

The source scan found 2 connection lines without a resolvable SteamID64, 5,919 disconnect lines without a unique open session match, 418 ambiguous disconnects, 1,143 sessions still open at end of their log, and 173 events without duration metadata. Some unmatched disconnects follow failed connection attempts. All raw lines are stored; affected attendance results remain pending instead of being treated as zero attendance.

## Deployment and local setup

Vercel production builds apply schema migrations, import the bundled archive, and then build Next.js. Preview builds skip database writes. Set production database URLs and other app secrets in Vercel's Production environment.

For a fresh local database:

1. Start PostgreSQL.
2. Apply the Prisma schema migration with `npm run db:migrate`.
3. Preview the archive with `npm run db:import-logs`.
4. Import it with `npm run db:import-logs -- --apply`.

The schema migration provisions a linked Player for any existing User. The separate backfill writes historical Users, Players, Events, participants, raw lines, and sessions. The importer does not start the Next.js app.
