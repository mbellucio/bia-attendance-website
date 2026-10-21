import { getPrisma } from "@/lib/db";

const DISCORD_API = "https://discord.com/api/v10";
const DISCORD_ID_PATTERN = /^\d{17,20}$/;
const MEMBER_PAGE_SIZE = 1_000;

type DiscordRole = { id: string; name: string; icon: string | null };
type DiscordMember = {
  user: { id: string; username: string; global_name?: string | null };
  nick: string | null;
  roles: string[];
};
type SyncCounts = { syncedCount: number; skippedCount: number };
type DiscordRuntimeConfig = { token: string; guildId: string };
type PrismaClient = ReturnType<typeof getPrisma>;

class DiscordApiError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
    this.name = "DiscordApiError";
  }
}

function getDiscordConfig(): DiscordRuntimeConfig {
  const token = process.env.DISCORD_BOT_TOKEN?.trim();
  const guildId = process.env.DISCORD_GUILD_ID?.trim();
  if (!token || !guildId || !DISCORD_ID_PATTERN.test(guildId)) {
    throw new Error("DISCORD_BOT_TOKEN or DISCORD_GUILD_ID is missing or invalid.");
  }
  return { token, guildId };
}

const wait = (milliseconds: number) => new Promise((resolve) => setTimeout(resolve, milliseconds));

async function discordGet<T>(path: string, token: string): Promise<T> {
  for (let attempt = 0; ; attempt++) {
    const response = await fetch(`${DISCORD_API}${path}`, {
      headers: { Authorization: `Bot ${token}`, Accept: "application/json" },
      cache: "no-store",
      redirect: "error",
      signal: AbortSignal.timeout(15_000),
    });

    if (response.status === 429 && attempt < 4) {
      const payload = await response.json().catch(() => null) as { retry_after?: number } | null;
      const retryAfterSeconds = payload?.retry_after ?? Number(response.headers.get("retry-after"));
      await wait(Math.max(250, Math.min((retryAfterSeconds || 1) * 1_000, 60_000)));
      continue;
    }
    if (!response.ok) throw new DiscordApiError(`Discord API request failed with status ${response.status}.`, response.status);
    return await response.json() as T;
  }
}

function assertDiscordId(value: string): void {
  if (!DISCORD_ID_PATTERN.test(value)) throw new Error("Discord returned an invalid user or role ID.");
}

function iconUrl(role: DiscordRole): string | null {
  return role.icon ? `https://cdn.discordapp.com/role-icons/${role.id}/${role.icon}.png` : null;
}

export async function synchronizeDiscordRoles(): Promise<number> {
  const { token, guildId } = getDiscordConfig();
  const roles = await discordGet<DiscordRole[]>(`/guilds/${guildId}/roles`, token);
  if (!Array.isArray(roles)) throw new Error("Discord returned an invalid roles response.");
  const prisma = getPrisma();
  // Keep role writes out of one long transaction. Large guilds can exceed
  // Prisma's default 5-second transaction timeout when every role is upserted
  // inside a single batch transaction.
  const batchSize = 10;
  for (let offset = 0; offset < roles.length; offset += batchSize) {
    const batch = roles.slice(offset, offset + batchSize);
    await Promise.all(batch.map((role) => {
      assertDiscordId(role.id);
      return prisma.discordRole.upsert({
        where: { discordRoleId: role.id },
        create: { discordRoleId: role.id, name: role.name, iconPath: iconUrl(role) },
        update: { name: role.name, iconPath: iconUrl(role) },
      });
    }));
  }
  return roles.length;
}

async function loadRoleMappings(prisma: PrismaClient) {
  return prisma.discordRole.findMany({
    select: {
      id: true,
      discordRoleId: true,
      name: true,
      department: { select: { id: true } },
      rank: { select: { id: true, sortOrder: true } },
      ribbon: { select: { id: true } },
      competence: { select: { id: true } },
      timeServed: { select: { id: true, sortOrder: true } },
      miscellaneous: { select: { id: true } },
    },
  });
}

async function saveMemberRoles(
  prisma: PrismaClient,
  userId: string,
  playerId: string,
  member: DiscordMember,
  mappings: Awaited<ReturnType<typeof loadRoleMappings>>,
): Promise<void> {
  const memberRoleIds = new Set(member.roles);
  const assigned = mappings.filter((role) => memberRoleIds.has(role.discordRoleId));
  const rank = assigned
    .filter((role) => role.rank)
    .sort((left, right) => (right.rank?.sortOrder ?? 0) - (left.rank?.sortOrder ?? 0))[0]?.rank;
  const served = assigned
    .filter((role) => role.timeServed)
    .sort((left, right) => {
      const leftNumber = left.name.match(/^\s*(\d+)/);
      const rightNumber = right.name.match(/^\s*(\d+)/);
      const leftOrder = leftNumber ? Number(leftNumber[1]) : left.timeServed?.sortOrder ?? 0;
      const rightOrder = rightNumber ? Number(rightNumber[1]) : right.timeServed?.sortOrder ?? 0;
      return rightOrder - leftOrder;
    })[0]?.timeServed;
  const displayName = member.nick?.trim() || member.user.global_name?.trim() || member.user.username;

  await prisma.$transaction(async (transaction) => {
    await transaction.player.update({
      where: { id: playerId },
      data: { rankId: rank?.id ?? null, timeServedId: served?.id ?? null },
    });
    await transaction.user.update({ where: { id: userId }, data: { displayName } });
    await transaction.playerRole.deleteMany({ where: { playerId } });
    await transaction.playerDepartment.deleteMany({ where: { playerId } });
    await transaction.playerRibbon.deleteMany({ where: { playerId } });
    await transaction.playerCompetence.deleteMany({ where: { playerId } });
    await transaction.playerMiscellaneous.deleteMany({ where: { playerId } });

    const playerRoles = assigned.map((role) => ({ playerId, discordRoleId: role.id }));
    const departments = assigned.flatMap((role) => role.department ? [{ playerId, departmentId: role.department.id }] : []);
    const ribbons = assigned.flatMap((role) => role.ribbon ? [{ playerId, ribbonId: role.ribbon.id }] : []);
    const competences = assigned.flatMap((role) => role.competence ? [{ playerId, competenceId: role.competence.id }] : []);
    const miscellaneous = assigned.flatMap((role) => role.miscellaneous ? [{ playerId, miscellaneousId: role.miscellaneous.id }] : []);

    if (playerRoles.length) await transaction.playerRole.createMany({ data: playerRoles });
    if (departments.length) await transaction.playerDepartment.createMany({ data: departments });
    if (ribbons.length) await transaction.playerRibbon.createMany({ data: ribbons });
    if (competences.length) await transaction.playerCompetence.createMany({ data: competences });
    if (miscellaneous.length) await transaction.playerMiscellaneous.createMany({ data: miscellaneous });
  });
}

export async function synchronizeDiscordMember(discordUserId: string): Promise<SyncCounts> {
  assertDiscordId(discordUserId);
  const { token, guildId } = getDiscordConfig();
  const prisma = getPrisma();
  const user = await prisma.user.findUnique({
    where: { discordUserId },
    select: { id: true, player: { select: { id: true } } },
  });
  if (!user?.player) return { syncedCount: 0, skippedCount: 1 };

  let member: DiscordMember;
  try {
    member = await discordGet<DiscordMember>(`/guilds/${guildId}/members/${discordUserId}`, token);
  } catch (error) {
    if (!(error instanceof DiscordApiError) || error.status !== 404) throw error;
    // A 404 can mean either an absent member or a bad guild ID. Verify the guild
    // before treating the member as someone who simply left the server.
    await discordGet(`/guilds/${guildId}`, token);
    return { syncedCount: 0, skippedCount: 1 };
  }
  if (member.user?.id !== discordUserId || !Array.isArray(member.roles)) {
    throw new Error("Discord returned an invalid member response.");
  }
  const mappings = await loadRoleMappings(prisma);
  await saveMemberRoles(prisma, user.id, user.player.id, member, mappings);
  return { syncedCount: 1, skippedCount: 0 };
}

export async function synchronizeDiscordMembers(): Promise<SyncCounts> {
  const { token, guildId } = getDiscordConfig();
  const prisma = getPrisma();
  const users = await prisma.user.findMany({
    where: { discordUserId: { not: null } },
    select: { id: true, discordUserId: true, player: { select: { id: true } } },
  });
  const linkedPlayers = users.flatMap((user) => user.discordUserId && user.player
    ? [{ userId: user.id, discordUserId: user.discordUserId, playerId: user.player.id }]
    : []);
  if (!linkedPlayers.length) return { syncedCount: 0, skippedCount: 0 };

  const userByDiscordId = new Map(linkedPlayers.map((user) => [user.discordUserId, user]));
  const unsyncedIds = new Set(userByDiscordId.keys());
  const mappings = await loadRoleMappings(prisma);
  let after = "0";

  while (true) {
    const query = new URLSearchParams({ limit: String(MEMBER_PAGE_SIZE), after });
    const members = await discordGet<DiscordMember[]>(`/guilds/${guildId}/members?${query}`, token);
    if (!Array.isArray(members)) throw new Error("Discord returned an invalid members response.");
    if (members.length === 0) break;

    for (const member of members) {
      const user = userByDiscordId.get(member.user?.id);
      if (!user) continue;
      if (!Array.isArray(member.roles)) throw new Error("Discord returned an invalid member response.");
      await saveMemberRoles(prisma, user.userId, user.playerId, member, mappings);
      unsyncedIds.delete(user.discordUserId);
    }

    const lastId = members[members.length - 1]?.user?.id;
    if (!lastId || lastId === after) throw new Error("Discord members pagination did not advance.");
    after = lastId;
    if (members.length < MEMBER_PAGE_SIZE) break;
  }

  const syncedCount = linkedPlayers.length - unsyncedIds.size;
  return { syncedCount, skippedCount: unsyncedIds.size };
}
