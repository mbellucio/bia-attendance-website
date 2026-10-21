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

async function syncLinkedMember(discordUserId, member) {
  const linked = await database.query(
    "SELECT u.id AS user_id, p.id AS player_id FROM users u JOIN players p ON p.user_id=u.id WHERE u.discord_user_id=$1",
    [discordUserId],
  );
  const user = linked.rows[0];
  if (!user) return false;

  const result = await database.query(`SELECT dr.discord_role_id,dr.name AS discord_role_name,dr.id AS catalog_role_id,d.id AS department_id,r.id AS rank_id,r.sort_order AS rank_order,ts.id AS time_served_id,ts.sort_order AS time_served_order,rb.id AS ribbon_id,c.id AS competence_id,m.id AS miscellaneous_id FROM discord_roles dr LEFT JOIN departments d ON d.discord_role_id=dr.id LEFT JOIN ranks r ON r.discord_role_id=dr.id LEFT JOIN time_served ts ON ts.discord_role_id=dr.id LEFT JOIN ribbons rb ON rb.discord_role_id=dr.id LEFT JOIN competences c ON c.discord_role_id=dr.id LEFT JOIN miscellaneous m ON m.discord_role_id=dr.id`);
  const byDiscordId = new Map(result.rows.map((row) => {
    const leadingNumber = row.discord_role_name.match(/^\s*(\d+)/);
    return [row.discord_role_id, { ...row, time_served_order: leadingNumber ? Number(leadingNumber[1]) : row.time_served_order }];
  }));
  const assigned = [...member.roles.cache.keys()].map((id) => byDiscordId.get(id)).filter(Boolean);
  const rank = assigned.filter((item) => item.rank_id).sort((a, b) => b.rank_order - a.rank_order)[0];
  const served = assigned.filter((item) => item.time_served_id).sort((a, b) => b.time_served_order - a.time_served_order)[0];
  const discordDisplayName = member.nickname ?? member.user.globalName ?? member.user.username;
  const connection = await database.connect();
  try {
    await connection.query("BEGIN");
    for (const table of ["player_roles", "player_departments", "player_ribbons", "player_competences", "player_miscellaneous"]) {
      await connection.query(`DELETE FROM ${table} WHERE player_id=$1`, [user.player_id]);
    }
    await connection.query("UPDATE players SET rank_id=$2,time_served_id=$3,updated_at=NOW() WHERE id=$1", [user.player_id, rank?.rank_id ?? null, served?.time_served_id ?? null]);
    await connection.query("UPDATE users SET display_name=$2,updated_at=NOW() WHERE id=$1", [user.user_id, discordDisplayName]);
    for (const item of assigned) {
      await connection.query("INSERT INTO player_roles (player_id,discord_role_id) VALUES ($1,$2) ON CONFLICT DO NOTHING", [user.player_id, item.catalog_role_id]);
      if (item.department_id) await connection.query("INSERT INTO player_departments (player_id,department_id) VALUES ($1,$2) ON CONFLICT DO NOTHING", [user.player_id, item.department_id]);
      if (item.ribbon_id) await connection.query("INSERT INTO player_ribbons (player_id,ribbon_id) VALUES ($1,$2) ON CONFLICT DO NOTHING", [user.player_id, item.ribbon_id]);
      if (item.competence_id) await connection.query("INSERT INTO player_competences (player_id,competence_id) VALUES ($1,$2) ON CONFLICT DO NOTHING", [user.player_id, item.competence_id]);
      if (item.miscellaneous_id) await connection.query("INSERT INTO player_miscellaneous (player_id,miscellaneous_id) VALUES ($1,$2) ON CONFLICT DO NOTHING", [user.player_id, item.miscellaneous_id]);
    }
    await connection.query("COMMIT");
    return true;
  } catch (error) {
    await connection.query("ROLLBACK").catch(() => undefined);
    throw error;
  } finally {
    connection.release();
  }
}

async function readDiscordUserId(request) {
  let body = "";
  for await (const chunk of request) {
    body += chunk.toString();
    if (body.length > 256) return null;
  }
  try {
    const value = JSON.parse(body);
    return typeof value.discordUserId === "string" && /^\d{17,20}$/.test(value.discordUserId) ? value.discordUserId : null;
  } catch {
    return null;
  }
}
const syncServer = createServer(async (request, response) => {
  const path = request.url ?? "";
  if (request.method !== "POST" || !["/internal/sync/roles", "/internal/sync/members", "/internal/sync/member"].includes(path)) { response.writeHead(404).end(); return; }
  const raw = request.headers["x-discord-sync-secret"];
  const supplied = Buffer.from(Array.isArray(raw) ? raw[0] ?? "" : raw ?? "");
  const expected = Buffer.from(syncSecret);
  if (supplied.length !== expected.length || !timingSafeEqual(supplied, expected)) { response.writeHead(401).end(); return; }
  if (!client.isReady()) { response.writeHead(503).end(); return; }
  let connection;
  try {
    const guild = await client.guilds.fetch(guildId);
    if (path === "/internal/sync/roles") {
      const roles = await guild.roles.fetch();
      connection = await database.connect();
      await connection.query("BEGIN");
      for (const role of roles.values()) {
        const iconPath = role.icon ? `https://cdn.discordapp.com/role-icons/${role.id}/${role.icon}.png` : null;
        await connection.query(`INSERT INTO discord_roles (id, discord_role_id, name, icon_path, created_at, updated_at) VALUES ($1,$2,$3,$4,NOW(),NOW()) ON CONFLICT (discord_role_id) DO UPDATE SET name=EXCLUDED.name, icon_path=EXCLUDED.icon_path, updated_at=NOW()`, [randomUUID(), role.id, role.name, iconPath]);
      }
      await connection.query("COMMIT"); connection.release(); connection = undefined;
      response.writeHead(200, { "Content-Type": "application/json", "Cache-Control": "no-store" }).end(JSON.stringify({ syncedCount: roles.size })); return;
    }
    if (path === "/internal/sync/member") {
      const discordUserId = await readDiscordUserId(request);
      if (!discordUserId) { response.writeHead(400).end(); return; }
      let member;
      try { member = await guild.members.fetch(discordUserId); }
      catch (error) {
        if (error?.code === 10007) {
          response.writeHead(200, { "Content-Type": "application/json", "Cache-Control": "no-store" }).end(JSON.stringify({ syncedCount: 0, skippedCount: 1 }));
          return;
        }
        throw error;
      }
      const synced = await syncLinkedMember(discordUserId, member);
      response.writeHead(200, { "Content-Type": "application/json", "Cache-Control": "no-store" }).end(JSON.stringify({ syncedCount: synced ? 1 : 0, skippedCount: synced ? 0 : 1 }));
      return;
    }
    const members = await guild.members.fetch();
    const linked = await database.query("SELECT u.id AS user_id, u.discord_user_id, p.id AS player_id FROM users u JOIN players p ON p.user_id=u.id WHERE u.discord_user_id IS NOT NULL");
    const result = await database.query(`SELECT dr.discord_role_id,dr.name AS discord_role_name,dr.id AS catalog_role_id,d.id AS department_id,r.id AS rank_id,r.sort_order AS rank_order,ts.id AS time_served_id,ts.sort_order AS time_served_order,rb.id AS ribbon_id,c.id AS competence_id,m.id AS miscellaneous_id FROM discord_roles dr LEFT JOIN departments d ON d.discord_role_id=dr.id LEFT JOIN ranks r ON r.discord_role_id=dr.id LEFT JOIN time_served ts ON ts.discord_role_id=dr.id LEFT JOIN ribbons rb ON rb.discord_role_id=dr.id LEFT JOIN competences c ON c.discord_role_id=dr.id LEFT JOIN miscellaneous m ON m.discord_role_id=dr.id`);
    const byDiscordId = new Map(result.rows.map((row) => { const leadingNumber = row.discord_role_name.match(/^\s*(\d+)/); return [row.discord_role_id, { ...row, time_served_order: leadingNumber ? Number(leadingNumber[1]) : row.time_served_order }]; }));
    let syncedCount = 0, skippedCount = 0;
    for (const user of linked.rows) {
      const member = members.get(user.discord_user_id);
      if (!member) { skippedCount++; continue; }
      const assigned = [...member.roles.cache.keys()].map((id) => byDiscordId.get(id)).filter(Boolean);
      const discordDisplayName = member.nickname ?? member.user.globalName ?? member.user.username;
      const rank = assigned.filter((item) => item.rank_id).sort((a,b) => b.rank_order-a.rank_order)[0];
      const served = assigned.filter((item) => item.time_served_id).sort((a,b) => b.time_served_order-a.time_served_order)[0];
      connection = await database.connect();
      try {
        await connection.query("BEGIN");
        for (const table of ["player_roles","player_departments","player_ribbons","player_competences","player_miscellaneous"]) await connection.query(`DELETE FROM ${table} WHERE player_id=$1`, [user.player_id]);
        await connection.query("UPDATE players SET rank_id=$2,time_served_id=$3,updated_at=NOW() WHERE id=$1", [user.player_id,rank?.rank_id ?? null,served?.time_served_id ?? null]);
        await connection.query("UPDATE users SET display_name=$2,updated_at=NOW() WHERE id=$1", [user.user_id, discordDisplayName]);
        for (const item of assigned) {
          await connection.query("INSERT INTO player_roles (player_id,discord_role_id) VALUES ($1,$2) ON CONFLICT DO NOTHING", [user.player_id,item.catalog_role_id]);
          if (item.department_id) await connection.query("INSERT INTO player_departments (player_id,department_id) VALUES ($1,$2) ON CONFLICT DO NOTHING", [user.player_id,item.department_id]);
          if (item.ribbon_id) await connection.query("INSERT INTO player_ribbons (player_id,ribbon_id) VALUES ($1,$2) ON CONFLICT DO NOTHING", [user.player_id,item.ribbon_id]);
          if (item.competence_id) await connection.query("INSERT INTO player_competences (player_id,competence_id) VALUES ($1,$2) ON CONFLICT DO NOTHING", [user.player_id,item.competence_id]);
          if (item.miscellaneous_id) await connection.query("INSERT INTO player_miscellaneous (player_id,miscellaneous_id) VALUES ($1,$2) ON CONFLICT DO NOTHING", [user.player_id,item.miscellaneous_id]);
        }
        await connection.query("COMMIT"); syncedCount++;
      } catch (error) { await connection.query("ROLLBACK").catch(()=>undefined); throw error; }
      finally { connection.release(); connection = undefined; }
    }
    response.writeHead(200, { "Content-Type":"application/json", "Cache-Control":"no-store" }).end(JSON.stringify({syncedCount,skippedCount}));
  } catch (error) {
    if (connection) { await connection.query("ROLLBACK").catch(()=>undefined); connection.release(); }
    console.error("Discord synchronization failed.", error); response.writeHead(503).end();
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
