import { withAdminSession } from "@/lib/auth/api-guard";
import { getPrisma } from "@/lib/db";

const keys = ["department", "rank", "ribbon", "competence", "timeServed", "miscellaneous"] as const;
type Category = typeof keys[number];
function rankCode(name: string, roleId: string) {
  const slug = name.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toUpperCase().replace(/[^A-Z0-9]+/g, "-").replace(/^-|-$/g, "") || "RANK";
  return slug + "-" + roleId.slice(-8).toUpperCase();
}

export const POST = withAdminSession(async (request) => {
  let body: unknown;
  try { body = await request.json(); } catch { return Response.json({ error: "Invalid JSON." }, { status: 400 }); }
  if (!body || typeof body !== "object" || !("roleId" in body) || !("category" in body)
    || typeof body.roleId !== "string" || typeof body.category !== "string" || !keys.includes(body.category as Category)) {
    return Response.json({ error: "Choose a role and a valid category." }, { status: 400 });
  }
  const { roleId, category } = body as { roleId: string; category: Category };
  const db = getPrisma();
  const role = await db.discordRole.findUnique({ where: { id: roleId }, select: { id: true, name: true } });
  if (!role) return Response.json({ error: "Discord role not found." }, { status: 404 });
  await db.$transaction(async (tx) => {
    const assigned = await Promise.all([
      tx.department.findFirst({ where: { discordRoleId: roleId }, select: { id: true } }),
      tx.rank.findFirst({ where: { discordRoleId: roleId }, select: { id: true } }),
      tx.ribbon.findFirst({ where: { discordRoleId: roleId }, select: { id: true } }),
      tx.competence.findFirst({ where: { discordRoleId: roleId }, select: { id: true } }),
      tx.timeServed.findFirst({ where: { discordRoleId: roleId }, select: { id: true } }),
      tx.miscellaneous.findFirst({ where: { discordRoleId: roleId }, select: { id: true } }),
    ]);
    const current = assigned.findIndex(Boolean);
    if (current === keys.indexOf(category)) return;
    if (current === 0) await tx.department.updateMany({ where: { discordRoleId: roleId }, data: { discordRoleId: null } });
    if (current === 1) await tx.rank.updateMany({ where: { discordRoleId: roleId }, data: { discordRoleId: null } });
    if (current === 2) await tx.ribbon.updateMany({ where: { discordRoleId: roleId }, data: { discordRoleId: null } });
    if (current === 3) await tx.competence.updateMany({ where: { discordRoleId: roleId }, data: { discordRoleId: null } });
    if (current === 4) await tx.timeServed.updateMany({ where: { discordRoleId: roleId }, data: { discordRoleId: null } });
    if (current === 5) await tx.miscellaneous.updateMany({ where: { discordRoleId: roleId }, data: { discordRoleId: null } });
    if (category === "department") await tx.department.create({ data: { name: role.name, discordRoleId: roleId } });
    if (category === "rank") {
      const highest = await tx.rank.aggregate({ _max: { sortOrder: true } });
      await tx.rank.create({ data: { name: role.name, code: rankCode(role.name, roleId), discordRoleId: roleId, sortOrder: (highest._max.sortOrder ?? -1) + 1 } });
    }
    if (category === "ribbon") await tx.ribbon.create({ data: { name: role.name, discordRoleId: roleId } });
    if (category === "competence") await tx.competence.create({ data: { name: role.name, discordRoleId: roleId } });
    if (category === "timeServed") {
      const leadingNumber = role.name.match(/^\s*(\d+)/);
      await tx.timeServed.create({ data: { name: role.name, discordRoleId: roleId, sortOrder: leadingNumber ? Number(leadingNumber[1]) : 0 } });
    }
    if (category === "miscellaneous") await tx.miscellaneous.create({ data: { name: role.name, discordRoleId: roleId } });
  });
  return Response.json({ success: true }, { headers: { "Cache-Control": "private, no-store" } });
});