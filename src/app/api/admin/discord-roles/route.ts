import { withAdminSession } from "@/lib/auth/api-guard";
import { getPrisma } from "@/lib/db";

export const GET = withAdminSession(async () => {
  const db = getPrisma();
  const [roles, departments, ranks, ribbons, competences, timeServed, miscellaneous] = await Promise.all([
    db.discordRole.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    db.department.findMany({ where: { discordRoleId: { not: null } }, select: { discordRole: { select: { id: true, name: true } } } }),
    db.rank.findMany({ where: { discordRoleId: { not: null } }, orderBy: [{ sortOrder: "desc" }, { name: "asc" }], select: { sortOrder: true, discordRole: { select: { id: true, name: true } } } }),
    db.ribbon.findMany({ where: { discordRoleId: { not: null } }, select: { discordRole: { select: { id: true, name: true } } } }),
    db.competence.findMany({ where: { discordRoleId: { not: null } }, select: { discordRole: { select: { id: true, name: true } } } }),
    db.timeServed.findMany({ where: { discordRoleId: { not: null } }, select: { sortOrder: true, discordRole: { select: { id: true, name: true } } } }),
    db.miscellaneous.findMany({ where: { discordRoleId: { not: null } }, select: { discordRole: { select: { id: true, name: true } } } }),
  ]);
  const categories = [
    { key: "department", label: "Departments", roles: departments.flatMap((x) => x.discordRole ? [x.discordRole] : []) },
    { key: "rank", label: "Ranks", roles: ranks.flatMap((x) => x.discordRole ? [{ ...x.discordRole, sortOrder: x.sortOrder }] : []) },
    { key: "ribbon", label: "Ribbons", roles: ribbons.flatMap((x) => x.discordRole ? [x.discordRole] : []) },
    { key: "competence", label: "Competences", roles: competences.flatMap((x) => x.discordRole ? [x.discordRole] : []) },
    { key: "timeServed", label: "Time served", roles: timeServed.flatMap((x) => { if (!x.discordRole) return []; const leadingNumber = x.discordRole.name.match(/^\s*(\d+)/); return [{ ...x.discordRole, sortOrder: leadingNumber ? Number(leadingNumber[1]) : x.sortOrder }]; }).sort((a, b) => b.sortOrder - a.sortOrder || a.name.localeCompare(b.name)) },
    { key: "miscellaneous", label: "Miscellaneous", roles: miscellaneous.flatMap((x) => x.discordRole ? [x.discordRole] : []) },
  ] as const;
  const used = new Set(categories.flatMap((item) => item.roles.map((role) => role.id)));
  return Response.json({ roles, unassignedRoleIds: roles.filter((role) => !used.has(role.id)).map((role) => role.id), categories },
    { headers: { "Cache-Control": "private, no-store" } });
});
export const DELETE = withAdminSession(async (request) => {
  const roleId = new URL(request.url).searchParams.get("roleId");
  if (!roleId) return Response.json({ error: "Discord role ID is required." }, { status: 400 });
  const result = await getPrisma().discordRole.deleteMany({ where: { id: roleId } });
  if (result.count === 0) return Response.json({ error: "Discord role not found." }, { status: 404 });
  return new Response(null, { status: 204, headers: { "Cache-Control": "private, no-store" } });
});