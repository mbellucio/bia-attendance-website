import { Client, Events, GatewayIntentBits } from "discord.js";
import { createServer } from "node:http";
import { randomUUID, timingSafeEqual } from "node:crypto";
import pg from "pg";

const { Pool } = pg;
const token = process.env.DISCORD_BOT_TOKEN?.trim();
const guildId = process.env.DISCORD_GUILD_ID?.trim();
const syncSecret = process.env.DISCORD_BOT_SYNC_SECRET?.trim();
const syncPort = Number(process.env.DISCORD_BOT_SYNC_PORT ?? 3100);

if (!token || !guildId || !syncSecret) {
  console.error("Set DISCORD_BOT_TOKEN, DISCORD_GUILD_ID, and DISCORD_BOT_SYNC_SECRET in discord-bot/.env.");
  process.exit(1);
}

const database = new Pool({
  host: process.env.DB_HOST ?? "db",
  port: Number(process.env.DB_PORT ?? 5432),
  database: process.env.DB_NAME ?? "attendance",
  user: process.env.DB_USER ?? "attendance",
  password: process.env.DB_PASSWORD,
  max: 3,
});

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers],
});

const syncServer = createServer(async (request, response) => {
  if (request.method !== "POST" || request.url !== "/internal/sync/roles") {
    response.writeHead(404).end();
    return;
  }

  const providedHeader = request.headers["x-discord-sync-secret"];
  const providedSecret = Buffer.from(Array.isArray(providedHeader) ? providedHeader[0] ?? "" : providedHeader ?? "");
  const expectedSecret = Buffer.from(syncSecret);
  if (providedSecret.length !== expectedSecret.length || !timingSafeEqual(providedSecret, expectedSecret)) {
    response.writeHead(401).end();
    return;
  }
  if (!client.isReady()) {
    response.writeHead(503).end();
    return;
  }

  let transaction;
  try {
    const guild = await client.guilds.fetch(guildId);
    const roles = await guild.roles.fetch();
    transaction = await database.connect();
    await transaction.query("BEGIN");

    for (const role of roles.values()) {
      const iconPath = role.icon ? `https://cdn.discordapp.com/role-icons/${role.id}/${role.icon}.png` : null;
      await transaction.query(
        `INSERT INTO discord_roles (id, discord_role_id, name, icon_path, created_at, updated_at)
         VALUES ($1, $2, $3, $4, NOW(), NOW())
         ON CONFLICT (discord_role_id) DO UPDATE SET name = EXCLUDED.name, icon_path = EXCLUDED.icon_path, updated_at = NOW()`,
        [randomUUID(), role.id, role.name, iconPath],
      );
    }
    await transaction.query("COMMIT");

    response.writeHead(200, { "Content-Type": "application/json", "Cache-Control": "no-store" });
    response.end(JSON.stringify({ syncedCount: roles.size }));
  } catch (error) {
    if (transaction) await transaction.query("ROLLBACK").catch(() => undefined);
    console.error("Discord role synchronization failed.", error);
    response.writeHead(503).end();
  } finally {
    transaction?.release();
  }
});

client.once(Events.ClientReady, async (readyClient) => {
  console.info(`Connected to Discord as ${readyClient.user.tag}.`);

  try {
    const guild = await readyClient.guilds.fetch(guildId);
    const roles = await guild.roles.fetch();
    const orderedRoles = [...roles.values()].sort((left, right) => right.position - left.position);

    console.info(`Role snapshot for ${guild.name}: ${orderedRoles.length} roles.`);
    for (const role of orderedRoles) {
      console.info(`ROLE ${role.id} | position ${role.position} | ${role.name}`);
    }
  } catch (error) {
    console.error("Could not read the configured Discord server and its roles.", error);
    process.exitCode = 1;
  }
});

client.on(Events.GuildRoleCreate, (role) => {
  console.info(`ROLE CREATED ${role.id} | position ${role.position} | ${role.name}`);
});

client.on(Events.GuildRoleUpdate, (_oldRole, role) => {
  console.info(`ROLE UPDATED ${role.id} | position ${role.position} | ${role.name}`);
});

client.on(Events.GuildRoleDelete, (role) => {
  console.info(`ROLE DELETED ${role.id} | ${role.name}`);
});

client.on(Events.GuildMemberUpdate, (oldMember, newMember) => {
  if (newMember.guild.id !== guildId) return;

  const oldRoleIds = new Set(oldMember.roles.cache.keys());
  const newRoleIds = new Set(newMember.roles.cache.keys());
  const added = [...newRoleIds].filter((id) => !oldRoleIds.has(id));
  const removed = [...oldRoleIds].filter((id) => !newRoleIds.has(id));

  if (added.length === 0 && removed.length === 0) return;

  console.info(
    `MEMBER ROLES CHANGED ${newMember.id} | added: ${added.join(",") || "none"} | removed: ${removed.join(",") || "none"}`,
  );
});

client.on(Events.Error, (error) => {
  console.error("Discord client error.", error);
});

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.once(signal, async () => {
    console.info(`Received ${signal}; closing the Discord and PostgreSQL connections.`);
    client.destroy();
    syncServer.close();
    await database.end();
    process.exit(0);
  });
}

async function start() {
  try {
    const result = await database.query("SELECT current_database() AS database");
    console.info(`Connected to PostgreSQL database ${result.rows[0].database}.`);
    syncServer.listen(syncPort, "0.0.0.0", () => console.info(`Role sync endpoint listening on port ${syncPort}.`));
    await client.login(token);
  } catch (error) {
    console.error("Startup failed. Check the database settings and Discord bot credentials.", error);
    await database.end();
    process.exit(1);
  }
}

start();
