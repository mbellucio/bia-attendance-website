# Discord profile setup (no database migration)

The member profile at `/profile` shows the Steam identity, current BIA Discord roles, and an honours section for future medals and ribbons. It makes one indexed lookup of the signed-in user and does not calculate historical mission totals.

## Discord Developer Portal

Add this OAuth2 redirect URL to the Discord application's OAuth2 settings:

- Local: `http://localhost:3000/api/auth/discord/callback`
- Production: `https://YOUR-VERCEL-DOMAIN/api/auth/discord/callback`

The profile requests only the `identify` OAuth scope. Keep Server Members Intent enabled for the bot. The bot needs access to the configured BIA server to read its roles and member assignments.

## App environment variables

Set these for local app development and in Vercel Production (and Preview if desired):

- `DISCORD_CLIENT_ID`: Application ID from Developer Portal
- `DISCORD_CLIENT_SECRET`: OAuth2 client secret from Developer Portal
- `DISCORD_BOT_TOKEN`: Bot token; keep it secret
- `DISCORD_GUILD_ID`: ID of the BIA Discord server
- `APP_URL`: exact app origin, such as `https://your-domain.vercel.app`

The bot container still needs its own `DISCORD_BOT_TOKEN` and `DISCORD_GUILD_ID` in `discord-bot/.env`. Never commit either env file or paste tokens into chat. After setting Vercel variables, redeploy.

## No-migration behavior

The Discord ID is held in the signed, HTTP-only Steam session cookie for up to 14 days. It is not saved in Postgres, so linking Discord on another browser/device will require linking again. Roles are fetched directly from Discord on profile page requests and are not cached in Neon. Medals are an empty display section until an awards source is decided.
