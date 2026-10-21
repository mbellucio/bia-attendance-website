import { withAdminSession } from "@/lib/auth/api-guard";
import { getPrisma } from "@/lib/db";

export const POST = withAdminSession(async (request) => {
  let body: unknown;
  try { body = await request.json(); } catch { return Response.json({ error: "Invalid JSON." }, { status: 400 }); }
  if (!body || typeof body !== "object" || !("category" in body) || !("roleIds" in body)
    || body.category !== "rank" || !Array.isArray(body.roleIds)
    || !body.roleIds.every((id): id is string => typeof id === "string")
    || new Set(body.roleIds).size !== body.roleIds.length) {
    return Response.json({ error: "Provide each mapped rank once, in the desired order." }, { status: 400 });
  }
  const roleIds = body.roleIds as string[];
  const db = getPrisma();
  const result = await db.$transaction(async (tx) => {
    const ranks = await tx.rank.findMany({ where: { discordRoleId: { not: null } }, select: { discordRoleId: true } });
    const currentIds = ranks.flatMap((rank) => rank.discordRoleId ? [rank.discordRoleId] : []);
    if (currentIds.length !== roleIds.length || currentIds.some((id) => !roleIds.includes(id))) return false;
    const byRoleId = await tx.rank.findMany({ where: { discordRoleId: { in: roleIds } }, select: { id: true, discordRoleId: true } });
    const rankIdByDiscordRoleId = new Map(byRoleId.flatMap((rank) => rank.discordRoleId ? [[rank.discordRoleId, rank.id] as const] : []));
    await Promise.all(roleIds.map((discordRoleId, index) => {
      const id = rankIdByDiscordRoleId.get(discordRoleId);
      return id ? tx.rank.update({ where: { id }, data: { sortOrder: roleIds.length - index } }) : Promise.resolve(null);
    }));
    return true;
  });
  if (!result) return Response.json({ error: "The mapped rank list changed. Refresh and try again." }, { status: 409 });
  return Response.json({ success: true }, { headers: { "Cache-Control": "private, no-store" } });
});
