"use client";

import { useState } from "react";
import { ArrowUpRightIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { useAnimatedDialog } from "@/hooks/use-animated-dialog";
import { AttendanceBadge } from "@/components/ui/attendance-badge";
import { eventTypeLabel } from "@/lib/event-types";
import { formatSerializedServerClockAsGmt } from "@/lib/server-log-time";

import type { EventDetails } from "@/lib/api/player";
import { network } from "@/lib/api/client";

import { endpoints } from "@/lib/api/endpoints";

type Props = { eventId: string; eventTitle: string; className: string; label?: string; attendanceStatus?: string };
const dateFormat = new Intl.DateTimeFormat("en", { day: "2-digit", month: "long", year: "numeric", timeZone: "UTC" });

function duration(seconds: number | null) {
  if (seconds == null) return "Incomplete";
  return Math.floor(seconds / 60) + " min";
}
function stamp(value: string) {
  return formatSerializedServerClockAsGmt(value) + " GMT";
}

export default function EventDetailsModal({ eventId, eventTitle, className, label = "VIEW LOG", attendanceStatus }: Props) {
  const [data, setData] = useState<EventDetails | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { dialogRef, closing, show, close } = useAnimatedDialog();

  async function showDetails() {
    show();
    setLoading(true);
    setError(null);
    setData(null);
    try {
      setData(await network.get<EventDetails>(endpoints.player.event(eventId)));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not load event details.");
    } finally {
      setLoading(false);
    }
  }

  const effectiveAttendance = data?.attendanceOverride ?? data?.attendanceGranted ?? false;
  const statusClass = !data?.attended ? "missed" : effectiveAttendance ? "granted" : data.totalConnectedSeconds == null ? "pending" : "denied";
  const statusText = !data?.attended ? "DID NOT ATTEND" : effectiveAttendance ? "ATTENDANCE GRANTED" : data.totalConnectedSeconds == null ? "PENDING REVIEW" : "NOT GRANTED";
  const remaining = !data?.attended || data.event.minimumAttendanceMinutes == null || data.totalConnectedSeconds == null
    ? null
    : Math.max(0, data.event.minimumAttendanceMinutes * 60 - data.totalConnectedSeconds);

  return <>
    <button type="button" className={className} aria-haspopup="dialog" aria-label={attendanceStatus ? eventTitle + ": " + attendanceStatus : label === "VIEW LOG" ? "View " + eventTitle + " connection log" : "Open " + eventTitle + " details"} onClick={showDetails}>
      <span className="truncate">{label}</span>
      {attendanceStatus && <span className="line-clamp-2 text-[8px] font-medium opacity-85 sm:text-[9px]">{attendanceStatus}</span>}
      {label === "VIEW LOG" && <ArrowUpRightIcon className="ml-auto size-4 shrink-0" aria-hidden="true" />}
    </button>
    <dialog ref={dialogRef} className="event-modal m-auto h-[min(680px,88svh)] w-[min(760px,calc(100vw-30px))] max-w-none overflow-hidden border border-[#91a978]/40 bg-[#171b18] p-0 text-[#eeeee8] shadow-[0_28px_100px_rgba(0,0,0,.65)]" aria-label={eventTitle} data-closing={closing ? "true" : undefined} onCancel={(event) => { event.preventDefault(); close(); }} onClick={(event) => { if (event.target === dialogRef.current) close(); }}>
      <div className="h-full overflow-y-auto bg-[radial-gradient(ellipse_at_92%_3%,rgba(111,132,73,.15),transparent_35%),#171b18]">
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4 text-[9px] font-semibold tracking-[.14em] text-[#b6c781] sm:px-7"><span>AFTER ACTION RECORD</span><button type="button" className="grid size-9 place-items-center border border-white/20 text-xl text-[#e8e9df] transition hover:border-[#a8bc7a] hover:bg-[#a8bc7a] hover:text-[#181a15] focus-visible:outline-2 focus-visible:outline-[#a8bc7a]" onClick={close} aria-label="Close event details"><XMarkIcon className="size-5" aria-hidden="true" /></button></div>
        {loading && <div className="space-y-4 p-5 sm:p-7" role="status" aria-label="Loading event details" aria-busy="true"><span className="block h-8 w-2/3 animate-pulse bg-white/[.09]" /><span className="block h-4 w-1/3 animate-pulse bg-white/[.07]" /><div className="grid grid-cols-1 gap-2 pt-3 sm:grid-cols-3">{[0, 1, 2].map((item) => <span key={item} className="h-20 animate-pulse bg-white/[.07]" />)}</div><div className="space-y-3 pt-3">{[0, 1, 2].map((item) => <span key={item} className="block h-12 animate-pulse bg-white/[.06]" />)}</div><span className="sr-only">Retrieving your connection record…</span></div>}
        {error && <div className="m-5 border-l-2 border-[#edab98] bg-[#7e3225]/20 p-4 text-sm text-[#edab98]" role="alert">{error}</div>}
        {data && <>
          <header className="border-b border-white/10 px-5 py-6 sm:px-7">
            <p className="mb-2 text-[9px] font-semibold uppercase tracking-[.15em] text-[#b6c781]">{eventTypeLabel(data.event.eventType)}{data.event.game ? " / " + data.event.game : ""}</p>
            <h2 className="m-0 text-2xl font-semibold tracking-tight text-[#f4f2e9] sm:text-3xl">{data.event.title || eventTitle}</h2>
            <p className="my-3 text-xs text-[#aeb4a8]">{dateFormat.format(new Date(data.event.eventDate))}</p>
            <AttendanceBadge status={statusClass} large>{statusText}</AttendanceBadge>
          </header>
          <div className="grid grid-cols-1 gap-px border-b border-white/10 bg-white/10 sm:grid-cols-3">
            <article className="flex min-h-20 flex-col justify-between bg-[#202520] p-4"><span className="text-[8px] tracking-[.13em] text-[#aeb4a8]">TOTAL TIME</span><strong className="text-sm text-[#d1dcaa]">{data.attended ? duration(data.totalConnectedSeconds) : "—"}</strong></article>
            <article className="flex min-h-20 flex-col justify-between bg-[#202520] p-4"><span className="text-[8px] tracking-[.13em] text-[#aeb4a8]">REQUIRED</span><strong className="text-sm text-[#d1dcaa]">{data.event.minimumAttendanceMinutes == null ? "Not set" : data.event.minimumAttendanceMinutes + " min"}</strong></article>
            <article className="flex min-h-20 flex-col justify-between bg-[#202520] p-4"><span className="text-[8px] tracking-[.13em] text-[#aeb4a8]">TIME REMAINING</span><strong className="text-sm text-[#d1dcaa]">{!data.attended ? "Did not attend" : remaining == null ? "Pending" : duration(remaining)}</strong></article>
          </div>
          <section className="px-5 py-5 sm:px-7">
            <div className="mb-4 flex items-center justify-between border-b border-white/10 pb-3"><h3 className="m-0 text-[10px] font-semibold tracking-[.14em] text-[#b6c781]">CONNECTION HISTORY</h3><span className="text-[8px] tracking-[.1em] text-[#c1c6ba]">{data.sessions.length} SESSION{data.sessions.length === 1 ? "" : "S"}</span></div>
            {data.sessions.length ? <ol className="m-0 list-none divide-y divide-white/10 p-0">{data.sessions.map((session, index) => <li className="grid grid-cols-[28px_1fr] gap-3 py-4 sm:grid-cols-[28px_1fr_1fr_auto] sm:items-center" key={session.connectedAt + "-" + index}>
              <span className="font-mono text-[10px] text-[#a8bc7a]">{String(index + 1).padStart(2, "0")}</span>
              <div className="flex flex-col gap-1"><strong className="text-[8px] tracking-[.12em] text-[#b6c781]">CONNECTED</strong><span className="text-[10px] text-[#c1c6ba]">{stamp(session.connectedAt)}</span></div>
              <div className="flex flex-col gap-1"><strong className="text-[8px] tracking-[.12em] text-[#b6c781]">DISCONNECTED</strong><span className="text-[10px] text-[#c1c6ba]">{session.disconnectedAt ? stamp(session.disconnectedAt) : "No disconnect recorded"}</span></div>
              <div className="col-start-2 flex flex-col gap-1 sm:col-start-auto sm:text-right"><strong className="text-xs text-[#f0efe8]">{duration(session.durationSeconds)}</strong><span className="text-[8px] tracking-[.1em] text-[#aeb4a8]">DURATION</span></div>
            </li>)}</ol> : <p className="text-xs leading-6 text-[#c2c7bb]">{data.attended ? "No connection sessions were recorded for this event." : "No attendance was recorded for this event."}</p>}
            <p className="mb-0 mt-5 text-[9px] leading-5 text-[#a2aa9b]">Connection timestamps are converted to GMT from the server clock (GMT+2; GMT+3 during EU summer time).</p>
          </section>
        </>}
        {!loading && !error && !data && <div className="p-8 text-center text-sm text-[#c2c7bb]">No details available.</div>}
      </div>
    </dialog>
  </>;
}