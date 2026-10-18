# BIA Discord bot proof of concept

This service connects to Discord's Gateway, verifies its PostgreSQL connection, reads the configured server's role list, and prints role creation, edit, deletion, and member role changes to the container log. It is an initial connectivity and permissions check for the planned website integration.

## Configure Discord

1. Create an application and bot in the Discord Developer Portal, then copy the bot token into `discord-bot/.env`. Keep that file private; never commit or share the token.
2. Enable the **Server Members Intent** under the bot's privileged Gateway intents. The bot needs this to receive member role changes.
3. Invite the bot to the BIA server with the `bot` scope and permission to view the server. This proof of concept only reads roles and listens for changes, so it does not need Administrator or Manage Roles.
4. Copy `.env.example` to `.env` in this folder and set `DISCORD_BOT_TOKEN` and `DISCORD_GUILD_ID`. The server ID can be copied from Discord with Developer Mode enabled.

## Start Postgres and the bot together

From the repository root, run:

```sh
docker compose up --build
```

Compose starts Postgres first, waits for its health check, then starts the bot. On startup, the logs should show a successful database connection, the connected bot account, and a role snapshot. Create or rename a role, or change a member's roles, and check the logs for the corresponding event.

Stop both containers with Ctrl+C or `docker compose down`. Do not paste bot tokens into chat or issue trackers.

## Scope of this first slice

The bot can connect to Postgres, but it does not write Discord data to tables yet or change Discord roles from the website. Those need the agreed role classification and link schema, plus a defined conflict rule for edits made on both sides. The bot runs separately from the Vercel-hosted Next.js app so its Gateway connection can stay open.
