import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import { getSteamSession } from "@/lib/auth/current-user";
import { getPrisma } from "@/lib/db";
import { SiteShell } from "@/components/layout/site-shell";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { StatCard } from "@/components/ui/stat-card";
import { AttendanceBadge } from "@/components/ui/attendance-badge";
import { eventTypeLabel } from "@/lib/event-types";

type Props = { params: Promise<{ eventId: string }>; searchParams: Promise<{ period?: string }> };
const clockFormatter = new Intl.DateTimeFormat("en", { hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23", timeZone: "UTC" });
const dateFormatter = new Intl.DateTimeFormat("en", { day: "2-digit", month: "long", year: "numeric", timeZone: "UTC" });
function elapsed(seconds: number | null) {
  if (seconds == null) return "Incomplete session";
  const hours = Math.floor(seconds / 3600); const minutes = Math.floor((seconds % 3600) / 60); const remainder = seconds % 60;
  return [hours ? `${hours}h` : "", minutes ? `${minutes}m` : "", !hours && !minutes ? `${remainder}s` : ""].filter(Boolean).join(" ");
}
async function EventTimeline({ params, searchParams }: Props) {
  const [{ eventId }, { period }] = await Promise.all([params, searchParams]);
  const session = await getSteamSession();
  if (!session) redirect("/");
  const player = await getPrisma().player.findFirst({ where: { user: { is: { steamId: session.steamId } } }, select: { id: true, nickname: true } });
  if (!player) notFound();
  const participation = await getPrisma().eventParticipant.findFirst({
    where: { playerId: player.id, eventId },
    select: { attendanceGranted: true, attendanceOverride: true, totalConnectedSeconds: true, event: { select: { title: true, eventCode: true, eventType: true, game: true, eventDate: true, minimumAttendanceMinutes: true } }, sessions: { orderBy: { connectedAt: "asc" }, select: { connectedAt: true, disconnectedAt: true, durationSeconds: true } } },
  });
  if (!participation) notFound();
  const { event, sessions } = participation;
  const effective = participation.attendanceOverride ?? participation.attendanceGranted;
  const back = period ? `/?period=${encodeURIComponent(period)}` : "/";
  return <SiteShell>
    <SiteHeader variant="member"><a className="back-link" href={back}>← BACK TO ROSTER</a></SiteHeader>
    <section className="roster-welcome event-welcome"><div><p className="roster-eyebrow">{eventTypeLabel(event.eventType)} / AFTER ACTION RECORD</p><h1>{event.title}</h1><p className="roster-subtitle">{dateFormatter.format(event.eventDate)}{event.game ? ` · ${event.game}` : ""}</p></div><AttendanceBadge large status={effective ? "granted" : participation.totalConnectedSeconds == null ? "pending" : "denied"}>{effective ? "ATTENDANCE GRANTED" : participation.totalConnectedSeconds == null ? "PENDING REVIEW" : "NOT GRANTED"}</AttendanceBadge></section>
    <section className="roster-stats detail-stats grid grid-cols-3 gap-px"><StatCard label="TOTAL TIME LOGGED" value={elapsed(participation.totalConnectedSeconds)} /><StatCard label="REQUIRED TIME" value={event.minimumAttendanceMinutes == null ? "Not set" : `${event.minimumAttendanceMinutes} min`} /><StatCard label="TIME TO REQUIREMENT" value={event.minimumAttendanceMinutes == null ? "Not set" : participation.totalConnectedSeconds == null ? "Pending" : Math.max(0, event.minimumAttendanceMinutes * 60 - participation.totalConnectedSeconds) === 0 ? "Threshold met" : elapsed(event.minimumAttendanceMinutes * 60 - participation.totalConnectedSeconds)} /></section>
    <section className="timeline-panel"><div className="timeline-heading"><div><p className="roster-eyebrow">PLAYER CONNECTION HISTORY</p><h2>{player.nickname ?? "Your sessions"}</h2></div><span>SERVER LOG TIME</span></div>
      {sessions.length ? <ol className="session-list">{sessions.map((item, index) => <li className="session-row" key={`${item.connectedAt.toISOString()}-${index}`}><span className="session-index">{String(index + 1).padStart(2, "0")}</span><div className="session-connection"><strong>CONNECTED</strong><span>{dateFormatter.format(item.connectedAt)} · {clockFormatter.format(item.connectedAt)}</span></div><div className="session-connection"><strong>DISCONNECTED</strong><span>{item.disconnectedAt ? `${dateFormatter.format(item.disconnectedAt)} · ${clockFormatter.format(item.disconnectedAt)}` : "No disconnect recorded"}</span></div><div className="session-duration"><strong>{elapsed(item.durationSeconds)}</strong><span>SESSION DURATION</span></div></li>)}</ol> : <p className="empty-month"><strong>No connection sessions were recorded.</strong><span>Attendance summary: {elapsed(participation.totalConnectedSeconds)}.</span></p>}
    </section>
    <p className="time-note">Times are shown as recorded in the server log. The source logs do not specify a timezone.</p><SiteFooter variant="member" />
  </SiteShell>;
}
function DetailFallback() { return <SiteShell><div className="timeline-panel" role="status">Loading event record…</div></SiteShell>; }
export default async function EventPage({ params, searchParams }: Props) {
  return <Suspense fallback={<DetailFallback />}><EventTimeline params={params} searchParams={searchParams} /></Suspense>;
}
