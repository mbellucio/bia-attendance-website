import { withSteamSession } from "@/lib/auth/api-guard";
import { getPrisma } from "@/lib/db";
import { serializeDatabaseDate } from "@/lib/server-log-time";
import type { AttendanceResponse } from "@/lib/api/player";

const headers = { "Cache-Control": "private, no-store" };

export const GET = withSteamSession(async (_request, _context, session) => {
    const prisma = getPrisma();
    const user = await prisma.user.findUnique({
      where: { steamId: session.steamId },
      select: { displayName: true, admin: true, player: { select: { id: true, nickname: true } } },
    });
    const events = user?.player ? await prisma.event.findMany({
      select: {
        id: true, title: true, eventCode: true, eventType: true, game: true, eventDate: true,
        participants: {
          where: { playerId: user.player.id },
          select: { attendanceGranted: true, attendanceOverride: true, totalConnectedSeconds: true },
          take: 1,
        },
      },
      orderBy: { eventDate: "desc" },
    }) : [];
    const result: AttendanceResponse = {
      user: {
        steamId: session.steamId,
        displayName: user?.displayName ?? null,
        isAdmin: user?.admin ?? false,
        player: user?.player ? { nickname: user.player.nickname } : null,
      },
      events: events.map((event) => ({ ...event, eventDate: serializeDatabaseDate(event.eventDate) })),
    };
    return Response.json(result, { headers });
});
