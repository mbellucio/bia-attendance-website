import { Client, Events, GatewayIntentBits } from "discord.js";
import pg from "pg";

const { Pool } = pg;
const token = process.env.DISCORD_BOT_TOKEN?.trim();
const guildId = process.env.DISCORD_GUILD_ID?.trim();

if (!token || !guildId) {
  console.error("Set DISCORD_BOT_TOKEN and DISCORD_GUILD_ID in discord-bot/.env.");
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
    await database.end();
    process.exit(0);
  });
}

async function start() {
  try {
    const result = await database.query("SELECT current_database() AS database");
    console.info(`Connected to PostgreSQL database ${result.rows[0].database}.`);
    await client.login(token);
  } catch (error) {
    console.error("Startup failed. Check the database settings and Discord bot credentials.", error);
    await database.end();
    process.exit(1);
  }
}

start();
