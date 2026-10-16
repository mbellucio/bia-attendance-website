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
  if (!event) return Response.json({ error: "Event record not found." }, { status: 404 });

  const participation = event.participants[0];
  return Response.json({
    event: { title: event.title, eventCode: event.eventCode, eventType: event.eventType, game: event.game, eventDate: event.eventDate, minimumAttendanceMinutes: event.minimumAttendanceMinutes },
    attended: Boolean(participation),
    attendanceGranted: participation ? participation.attendanceOverride ?? participation.attendanceGranted : false,
    attendanceOverride: participation?.attendanceOverride ?? null,
    totalConnectedSeconds: participation?.totalConnectedSeconds ?? null,
    sessions: participation?.sessions ?? [],
  }, { headers: { "Cache-Control": "private, no-store" } });
}
