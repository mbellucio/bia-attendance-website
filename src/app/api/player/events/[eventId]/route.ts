import { withSteamSession } from "@/lib/auth/api-guard";
import { errorResponse } from "@/lib/errors/server";
import { getPrisma } from "@/lib/db";
import { serializeDatabaseDate, serializeServerClock } from "@/lib/server-log-time";

import type { EventDetails } from "@/lib/api/player";

type Context = { params: Promise<{ eventId: string }> };

const headers = { "Cache-Control": "private, no-store" };

export const GET = withSteamSession(async (_request, { params }: Context, session) => {
    const { eventId } = await params;
    const player = await getPrisma().player.findFirst({
      where: { user: { is: { steamId: session.steamId } } },
      select: { id: true, nickname: true },
    });
    if (!player) return errorResponse("PLAYER_NOT_FOUND");

    const event = await getPrisma().event.findUnique({
      where: { id: eventId },
      select: {
        title: true, eventCode: true, eventType: true, game: true, eventDate: true, minimumAttendanceMinutes: true,
        participants: {
          where: { playerId: player.id }, take: 1,
          select: {
            attendanceGranted: true, attendanceOverride: true, totalConnectedSeconds: true,
            sessions: { orderBy: { connectedAt: "asc" }, select: { connectedAt: true, disconnectedAt: true, durationSeconds: true } },
          },
        },
      },
    });
    if (!event) return errorResponse("EVENT_NOT_FOUND");

    const participation = event.participants[0];
    const result: EventDetails = {
      player: { nickname: player.nickname },
      event: { title: event.title, eventCode: event.eventCode, eventType: event.eventType, game: event.game, eventDate: serializeDatabaseDate(event.eventDate), minimumAttendanceMinutes: event.minimumAttendanceMinutes },
      attended: Boolean(participation),
      attendanceGranted: participation ? participation.attendanceOverride ?? participation.attendanceGranted : false,
      attendanceOverride: participation?.attendanceOverride ?? null,
      totalConnectedSeconds: participation?.totalConnectedSeconds ?? null,
      sessions: (participation?.sessions ?? []).map((item) => ({ ...item, connectedAt: serializeServerClock(item.connectedAt), disconnectedAt: item.disconnectedAt ? serializeServerClock(item.disconnectedAt) : null })),
    };
    return Response.json(result, { headers });
});
