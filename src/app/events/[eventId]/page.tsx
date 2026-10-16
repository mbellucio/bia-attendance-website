import { Suspense } from "react";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import { notFound, redirect } from "next/navigation";
import { getSteamSession } from "@/lib/auth/current-user";
import { getPrisma } from "@/lib/db";
import { SiteShell } from "@/components/layout/site-shell";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { StatCard } from "@/components/ui/stat-card";
import { AttendanceBadge } from "@/components/ui/attendance-badge";
import { EventSkeleton } from "@/components/ui/page-skeleton";
import { eventTypeLabel } from "@/lib/event-types";
import { formatServerClockAsGmt, serializeDatabaseDate } from "@/lib/server-log-time";

type Props = { params: Promise<{ eventId: string }>; searchParams: Promise<{ period?: string }> };

const dateFormatter = new Intl.DateTimeFormat("en", { day: "2-digit", month: "long", year: "numeric", timeZone: "UTC" });
function elapsed(seconds: number | null) {
  if (seconds == null) return "Incomplete session";
  return `${Math.floor(seconds / 60)} min`;
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
  const status = effective ? "granted" : participation.totalConnectedSeconds == null ? "pending" : "denied";
  const statusText = effective ? "ATTENDANCE GRANTED" : participation.totalConnectedSeconds == null ? "PENDING REVIEW" : "NOT GRANTED";
  const remainingSeconds = event.minimumAttendanceMinutes == null || participation.totalConnectedSeconds == null ? null : Math.max(0, event.minimumAttendanceMinutes * 60 - participation.totalConnectedSeconds);
  const remaining = event.minimumAttendanceMinutes == null ? "Not set" : participation.totalConnectedSeconds == null ? "Pending" : elapsed(remainingSeconds);

  return <SiteShell>
    <SiteHeader variant="member"><a className="text-[9px] font-semibold tracking-[.13em] text-[#d9dcd2] transition-colors hover:text-[#a8bc7a]" href={back}><ArrowLeftIcon className="mr-2 inline size-3.5 align-[-2px]" aria-hidden="true" />BACK TO ROSTER</a></SiteHeader>
    <section className="flex flex-col justify-between gap-6 border-b border-white/10 py-7 sm:flex-row sm:items-end sm:py-9">
      <div><p className="mb-3 text-[9px] font-semibold uppercase tracking-[.18em] text-[#b6c781]">{eventTypeLabel(event.eventType)} / AFTER ACTION RECORD</p><h1 className="m-0 text-[clamp(34px,5vw,62px)] font-medium leading-none tracking-[-.06em] text-[#f4f2e9]">{event.title}</h1><p className="mb-0 mt-3 text-sm text-[#c4c8bd]">{dateFormatter.format(new Date(serializeDatabaseDate(event.eventDate)))}{event.game ? ` · ${event.game}` : ""}</p></div>
      <AttendanceBadge large status={status}>{statusText}</AttendanceBadge>
    </section>
    <section className="my-6 grid grid-cols-1 gap-3 sm:grid-cols-3" aria-label="Event attendance summary">
      <StatCard label="TOTAL TIME LOGGED" value={elapsed(participation.totalConnectedSeconds)} />
      <StatCard label="REQUIRED TIME" value={event.minimumAttendanceMinutes == null ? "Not set" : `${event.minimumAttendanceMinutes} min`} />
      <StatCard label="TIME TO REQUIREMENT" value={remaining} />
    </section>
    <section className="border border-white/15 bg-[#1a1e1b] shadow-[0_16px_40px_rgba(0,0,0,.18)]">
      <div className="flex flex-col justify-between gap-3 border-b border-white/10 px-5 py-4 sm:flex-row sm:items-end sm:px-7"><div><p className="mb-2 text-[9px] font-semibold uppercase tracking-[.17em] text-[#a8bc7a]">PLAYER CONNECTION HISTORY</p><h2 className="m-0 text-xl font-semibold text-[#f3f1e8]">{player.nickname ?? "Your sessions"}</h2></div><span className="text-[8px] font-semibold tracking-[.13em] text-[#afb4a8]">GMT DISPLAY TIME</span></div>
      {sessions.length ? <ol className="m-0 divide-y divide-white/10 p-0">{sessions.map((item, index) => <li className="grid grid-cols-[28px_1fr] gap-3 px-5 py-4 sm:grid-cols-[32px_1fr_1fr_auto] sm:items-center sm:px-7" key={`${item.connectedAt.toISOString()}-${index}`}>
        <span className="font-mono text-[10px] text-[#a8bc7a]">{String(index + 1).padStart(2, "0")}</span>
        <div className="flex flex-col gap-1"><strong className="text-[8px] tracking-[.12em] text-[#b6c781]">CONNECTED</strong><span className="text-[10px] text-[#c1c6ba]">{formatServerClockAsGmt(item.connectedAt)} GMT</span></div>
        <div className="flex flex-col gap-1"><strong className="text-[8px] tracking-[.12em] text-[#b6c781]">DISCONNECTED</strong><span className="text-[10px] text-[#c1c6ba]">{item.disconnectedAt ? `${formatServerClockAsGmt(item.disconnectedAt)} GMT` : "No disconnect recorded"}</span></div>
        <div className="col-start-2 flex flex-col gap-1 sm:col-start-auto sm:text-right"><strong className="text-xs text-[#f0efe8]">{elapsed(item.durationSeconds)}</strong><span className="text-[8px] tracking-[.1em] text-[#aeb4a8]">SESSION DURATION</span></div>
      </li>)}</ol> : <p className="m-0 px-5 py-7 text-xs leading-6 text-[#c2c7bb]"><strong className="block text-[#f0efe8]">No connection sessions were recorded.</strong><span>Attendance summary: {elapsed(participation.totalConnectedSeconds)}.</span></p>}
    </section>
    <p className="my-5 text-[10px] leading-5 text-[#a7aea1]">Connection timestamps are converted to GMT from the server clock (GMT+2; GMT+3 during EU summer time). Event dates remain as recorded.</p>
    <SiteFooter variant="member" />
  </SiteShell>;
}

export default async function EventPage({ params, searchParams }: Props) {
  return <Suspense fallback={<EventSkeleton />}><EventTimeline params={params} searchParams={searchParams} /></Suspense>;
}