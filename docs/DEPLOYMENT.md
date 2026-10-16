# Vercel deployment and archive import

## What ships with the app

The archive is stored in `data/archive` inside this repository: 487 raw event logs, duration metadata, and the SteamID lookup file. The importer defaults to that bundled directory; it does not depend on the original sibling folder on a developer's computer. The total archive is about 11.9 MB.

The raw logs contain player nicknames and SteamID64s. Keep this repository private if those records should not be publicly visible.

## Production build flow

The root `vercel.json` points Vercel at `npm run vercel-build`. On a Production deployment, that script runs these steps in order:

1. `npm run db:deploy` applies checked-in Prisma migrations.
2. `npm run build` builds the Next.js app.

The historical archive import is deliberately separate from deploys. Neon already contains the imported archive, and the importer's source checksum guard stops if a bundled log changes after import. Running the bulk import on every deployment could block otherwise valid deploys over a source-file difference.

For a fresh database, first review the dry-run summary with `npm run db:import-logs`, then deliberately apply it with `npm run db:import-logs -- --apply` against the intended database URL.

On Preview deployments, the script skips migrations and imports, then builds the app. This avoids preview deployments changing the production database.
## Vercel environment

Configure these in the Vercel project's **Production** environment:

- `DATABASE_URL`: hosted Postgres connection used by the app and importer.
- `DIRECT_URL`: direct Postgres connection for Prisma schema migrations, if the provider gives you a separate URL. If omitted, migration config falls back to `DATABASE_URL`.
- `AUTH_SECRET` and `APP_URL`: the app's auth settings.

Do not commit these values to Git. Vercel provides project environment variables during build and runtime.

## Local use and manual import

- `npm run db:migrate` applies local development migrations.
- `npm run db:import-logs` parses the bundled archive and prints a dry-run summary.
- `npm run db:import-logs -- --apply` applies the import and admin bootstrap to the database selected by `DATABASE_URL`.

The importer is idempotent for matching event checksums. If a source file changes after import, it aborts rather than silently overwriting historical rows. The admin seed list is re-applied on each successful importer run, even when all event files are already present.
