import { errorResponse } from "@/lib/errors/server";
import { getSteamSession } from "@/lib/auth/current-user";
import { handleApiError } from "@/lib/errors/server";
import { getPrisma } from "@/lib/db";
import { serializeDatabaseDate } from "@/lib/server-log-time";
import type { AttendanceResponse } from "@/lib/api/player";

const headers = { "Cache-Control": "private, no-store" };

export async function GET() {
  const session = await getSteamSession();
  if (!session) return errorResponse("AUTH_REQUIRED");
  try {
    const prisma = getPrisma();
    const user = await prisma.user.findUnique({
      where: { steamId: session.steamId },
      select: { displayName: true, player: { select: { id: true, nickname: true } } },
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
        player: user?.player ? { nickname: user.player.nickname } : null,
      },
      events: events.map((event) => ({ ...event, eventDate: serializeDatabaseDate(event.eventDate) })),
    };
    return Response.json(result, { headers });
  } catch (cause) {
    return handleApiError(cause);
  }
}
