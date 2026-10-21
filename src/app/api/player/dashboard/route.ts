import { withSteamSession } from "@/lib/auth/api-guard";
import { getPrisma } from "@/lib/db";
import type { DashboardResponse } from "@/lib/api/player";

export const GET = withSteamSession(async (_request, _context, session) => {
  const prisma = getPrisma();
  const user = await prisma.user.findUnique({
    where: { steamId: session.steamId },
    select: {
      displayName: true, admin: true,
      player: {
        select: {
          id: true,
          nickname: true,
          rank: { select: { name: true, discordRole: { select: { iconPath: true } } } },
          timeServed: { select: { name: true, discordRole: { select: { iconPath: true } } } },
          departments: { select: { department: { select: { name: true, discordRole: { select: { iconPath: true } } } } } },
          ribbons: { select: { ribbon: { select: { name: true, discordRole: { select: { iconPath: true } } } } } },
          competences: { select: { competence: { select: { name: true, discordRole: { select: { iconPath: true } } } } } },
        },
      },
      modelPreference: { select: { faction: true, modelPath: true } },
    },
  });
  const result: DashboardResponse = {
    steamId: session.steamId,
    isAdmin: user?.admin ?? false,
    name: user?.player?.nickname ?? user?.displayName ?? "BIA Member",
    nickname: user?.player?.nickname ?? null,
    rosterLinked: Boolean(user?.player),
    rank: user?.player?.rank ? {
      name: user.player.rank.name,
      iconPath: user.player.rank.discordRole?.iconPath ?? null,
    } : null,
    departments: user?.player?.departments.map(({ department }) => ({
      name: department.name,
      iconPath: department.discordRole?.iconPath ?? null,
    })) ?? [],
    timeServed: user?.player?.timeServed ? {
      name: user.player.timeServed.name,
      iconPath: user.player.timeServed.discordRole?.iconPath ?? null,
    } : null,
    ribbons: user?.player?.ribbons.map(({ ribbon }) => ({
      name: ribbon.name,
      iconPath: ribbon.discordRole?.iconPath ?? null,
    })) ?? [],
    competences: user?.player?.competences.map(({ competence }) => ({
      name: competence.name,
      iconPath: competence.discordRole?.iconPath ?? null,
    })) ?? [],
    selectedFaction: user?.modelPreference?.faction ?? "US",
    modelPath: user?.modelPreference?.modelPath ?? "/models/ww2/us-rifleman.glb",
  };
  return Response.json(result, { headers: { "Cache-Control": "private, no-store" } });
});
