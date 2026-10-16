# Attendance database schema

The Prisma schema separates Steam website accounts from in-game player records and stores event attendance from the raw Arma logs.

## Main relationships

- A **User** has a unique SteamID64, an `admin` Boolean that defaults to false, and can link to one **Player**.
- An **Event** contains raw **EventLogLine** records.
- **EventParticipant** uniquely joins one Player to one Event.
- A participant can have multiple **PlayerSession** rows for reconnects.
- Session rows point back to the source connect and optional disconnect log lines.

## Apply and import

Apply the schema migration:

```powershell
npm run db:migrate
```

Preview the archive without writing:

```powershell
npm run db:import-logs
```

Import the historical data:

```powershell
npm run db:import-logs -- --apply
```

Historical Steam IDs create both a User and a linked Player. The latest nickname observed in the archive is stored on both records. Email stays empty because Steam OpenID does not provide it. `data/admin-users.json` grants the admin flag to the configured SteamID after import, including on an empty production database.

Every original raw log line is preserved. Matched connections become sessions; unmatched or ambiguous disconnects remain reviewable and prevent an attendance result from being calculated for affected players. The importer uses checksums to skip identical events on reruns and stops if a source file changed after a prior import.

Raw connection timestamps remain stored as recorded in the server log. The player UI converts those timestamps to GMT for display: it subtracts two hours during standard time and three hours during EU summer time (last Sunday in March through the last Sunday in October). Event calendar dates remain as recorded. This is a display conversion; it does not rewrite raw log lines, stored timestamps, or stored durations.

## Local database

The local database contains 487 events, 238,064 raw lines, 33,710 participants, 51,332 sessions, and 881 linked User/Player pairs. Attendance was calculated for 30,600 participants; 3,110 remain pending. The first User, Seedorf, is configured as the sole initial admin.