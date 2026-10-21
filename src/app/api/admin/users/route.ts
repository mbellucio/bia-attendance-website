import { withAdminSession } from "@/lib/auth/api-guard";
import { getPrisma } from "@/lib/db";

export const GET = withAdminSession(async () => {
  const users = await getPrisma().user.findMany({
    orderBy: [{ displayName: "asc" }, { createdAt: "asc" }],
    select: {
      id: true,
      displayName: true,
      discordUserId: true,
      admin: true,
      player: {
        select: {
          nickname: true,
          rank: { select: { name: true, sortOrder: true, discordRole: { select: { iconPath: true } } } },
          timeServed: { select: { name: true, discordRole: { select: { iconPath: true } } } },
          roles: {
            select: {
              discordRole: {
                select: {
                  name: true,
                  iconPath: true,
                  department: { select: { id: true } },
                  rank: { select: { id: true, sortOrder: true } },
                  ribbon: { select: { id: true } },
                  competence: { select: { id: true } },
                  timeServed: { select: { id: true } },
                  miscellaneous: { select: { id: true } },
                },
              },
            },
          },
          departments: { select: { department: { select: { name: true, discordRole: { select: { iconPath: true } } } } } },
          ribbons: { select: { ribbon: { select: { name: true, discordRole: { select: { iconPath: true } } } } } },
          competences: { select: { competence: { select: { name: true, discordRole: { select: { iconPath: true } } } } } },
          miscellaneous: { select: { miscellaneous: { select: { name: true, discordRole: { select: { iconPath: true } } } } } },
        },
      },
    },
  });

  const result = users.map((user) => {
    const roles = user.player
      ? [
          ...(user.player.rank ? [{ category: "Rank", name: user.player.rank.name, iconPath: user.player.rank.discordRole?.iconPath ?? null }] : []),
          ...(user.player.timeServed ? [{ category: "Time served", name: user.player.timeServed.name, iconPath: user.player.timeServed.discordRole?.iconPath ?? null }] : []),
          ...user.player.departments.map(({ department }) => ({ category: "Department", name: department.name, iconPath: department.discordRole?.iconPath ?? null })),
          ...user.player.ribbons.map(({ ribbon }) => ({ category: "Ribbon", name: ribbon.name, iconPath: ribbon.discordRole?.iconPath ?? null })),
          ...user.player.competences.map(({ competence }) => ({ category: "Competence", name: competence.name, iconPath: competence.discordRole?.iconPath ?? null })),
          ...user.player.miscellaneous.map(({ miscellaneous }) => ({ category: "Miscellaneous", name: miscellaneous.name, iconPath: miscellaneous.discordRole?.iconPath ?? null })),
          ...user.player.roles.map(({ discordRole }) => ({
            category: discordRole.department
              ? "Department"
              : discordRole.rank
                ? "Rank"
                : discordRole.ribbon
                  ? "Ribbon"
                  : discordRole.competence
                    ? "Competence"
                    : discordRole.timeServed
                      ? "Time served"
                      : discordRole.miscellaneous
                        ? "Miscellaneous"
                        : "Other",
            name: discordRole.name,
            iconPath: discordRole.iconPath,
          })),
        ]
      : [];
    const uniqueRoles = [...new Map(roles.map((role) => [`${role.category}:${role.name}`, role])).values()];
    const mappedRankOrder = user.player?.roles.reduce<number | null>((highest, { discordRole }) => {
      const order = discordRole.rank?.sortOrder;
      return order == null ? highest : highest == null ? order : Math.max(highest, order);
    }, null);
    return {
      id: user.id,
      name: user.displayName?.trim() || user.player?.nickname?.trim() || "Unnamed user",
      discordLinked: Boolean(user.discordUserId),
      admin: user.admin,
      rankSortOrder: user.player?.rank?.sortOrder ?? mappedRankOrder ?? 0,
      roles: uniqueRoles,
    };
  });

  return Response.json({ users: result }, { headers: { "Cache-Control": "private, no-store" } });
});
