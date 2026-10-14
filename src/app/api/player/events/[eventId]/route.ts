import { getSteamSession } from "@/lib/auth/current-user";
import { getPrisma } from "@/lib/db";

type Context = { params: Promise<{ eventId: string }> };

export async function GET(_request: Request, { params }: Context) {
  const session = await getSteamSession();
  if (!session) return Response.json({ error: "Sign in to view event details." }, { status: 401 });

  const { eventId } = await params;
  const player = await getPrisma().player.findFirst({
    where: { user: { is: { steamId: session.steamId } } },
    select: { id: true },
  });
  if (!player) return Response.json({ error: "Player record not found." }, { status: 404 });

  const record = await getPrisma().eventParticipant.findFirst({
    where: { eventId, playerId: player.id },
    select: {
      attendanceGranted: true,
      attendanceOverride: true,
      totalConnectedSeconds: true,
      event: { select: { title: true, eventCode: true, game: true, eventDate: true, minimumAttendanceMinutes: true } },
      sessions: {
        orderBy: { connectedAt: "asc" },
        select: { connectedAt: true, disconnectedAt: true, durationSeconds: true },
      },
    },
  });
  if (!record) return Response.json({ error: "Event record not found." }, { status: 404 });

  return Response.json({
    event: record.event,
    attendanceGranted: record.attendanceOverride ?? record.attendanceGranted,
    attendanceOverride: record.attendanceOverride,
    totalConnectedSeconds: record.totalConnectedSeconds,
    sessions: record.sessions,
  }, { headers: { "Cache-Control": "private, no-store" } });
}
