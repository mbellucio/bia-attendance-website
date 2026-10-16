import "server-only";

export type GuildRole = { id: string; name: string; position: number };
export type GuildRoleResult =
  | { state: "unlinked" | "not-configured" | "not-a-member" | "unavailable"; roles: [] }
  | { state: "ready"; roles: GuildRole[] };

type RoleResponse = { id: string; name: string; position: number };
type MemberResponse = { roles: string[] };

export async function getLinkedDiscordRoles(discordId?: string): Promise<GuildRoleResult> {
  if (!discordId) return { state: "unlinked", roles: [] };
  const token = process.env.DISCORD_BOT_TOKEN?.trim();
  const guildId = process.env.DISCORD_GUILD_ID?.trim();
  if (!token || !guildId) return { state: "not-configured", roles: [] };

  const headers = { Authorization: `Bot ${token}`, Accept: "application/json" };
  try {
    const [memberResponse, rolesResponse] = await Promise.all([
      fetch(`https://discord.com/api/v10/guilds/${guildId}/members/${discordId}`, { headers, cache: "no-store", signal: AbortSignal.timeout(8_000) }),
      fetch(`https://discord.com/api/v10/guilds/${guildId}/roles`, { headers, cache: "no-store", signal: AbortSignal.timeout(8_000) }),
    ]);
    if (memberResponse.status === 404) return { state: "not-a-member", roles: [] };
    if (!memberResponse.ok || !rolesResponse.ok) return { state: "unavailable", roles: [] };
    const [member, roles] = await Promise.all([
      memberResponse.json() as Promise<MemberResponse>,
      rolesResponse.json() as Promise<RoleResponse[]>,
    ]);
    const assigned = new Set(member.roles);
    return {
      state: "ready",
      roles: roles.filter((role) => assigned.has(role.id) && role.id !== guildId)
        .map(({ id, name, position }) => ({ id, name, position }))
        .sort((a, b) => b.position - a.position),
    };
  } catch { return { state: "unavailable", roles: [] }; }
}
