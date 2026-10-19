import { withSteamSession } from "@/lib/auth/api-guard";
import { getPrisma } from "@/lib/db";
import type { DashboardResponse } from "@/lib/api/player";

export const GET = withSteamSession(async (_request, _context, session) => {
  const prisma = getPrisma();
  const user = await prisma.user.findUnique({
    where: { steamId: session.steamId },
    select: {
      displayName: true, createdAt: true, admin: true,
      player: { select: { id: true, nickname: true } },
      modelPreference: { select: { faction: true, modelPath: true } },
    },
  });
  const attendedOperations = user?.player ? await prisma.eventParticipant.count({
    where: {
      playerId: user.player.id,
      OR: [{ attendanceOverride: true }, { attendanceOverride: null, attendanceGranted: true }],
    },
  }) : null;
  const result: DashboardResponse = {
    steamId: session.steamId,
    isAdmin: user?.admin ?? false,
    name: user?.player?.nickname ?? user?.displayName ?? "BIA Member",
    nickname: user?.player?.nickname ?? null,
    createdAt: user?.createdAt.toISOString() ?? null,
    attendedOperations,
    rosterLinked: Boolean(user?.player),
    selectedFaction: user?.modelPreference?.faction ?? "US",
    modelPath: user?.modelPreference?.modelPath ?? "/models/ww2/us-rifleman.glb",
  };
  return Response.json(result, { headers: { "Cache-Control": "private, no-store" } });
});
