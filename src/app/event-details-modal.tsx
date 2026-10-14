"use client";

import { useEffect, useRef, useState } from "react";

type EventDetails = {
  event: { title: string; eventCode: string; game: string | null; eventDate: string; minimumAttendanceMinutes: number | null };
  attendanceGranted: boolean;
  attendanceOverride: boolean | null;
  totalConnectedSeconds: number | null;
  sessions: { connectedAt: string; disconnectedAt: string | null; durationSeconds: number | null }[];
};
type Props = { eventId: string; eventTitle: string; className: string; label?: string };
const dateFormat = new Intl.DateTimeFormat("en", { day: "2-digit", month: "long", year: "numeric", timeZone: "UTC" });
const timeFormat = new Intl.DateTimeFormat("en", { hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23", timeZone: "UTC" });
function duration(seconds: number | null) {
  if (seconds == null) return "Incomplete";
  const h = Math.floor(seconds / 3600); const m = Math.floor((seconds % 3600) / 60); const s = seconds % 60;
  return [h ? `${h}h` : "", m ? `${m}m` : "", !h && !m ? `${s}s` : ""].filter(Boolean).join(" ");
}
function stamp(value: string) { const date = new Date(value); return `${dateFormat.format(date)} · ${timeFormat.format(date)}`; }

export default function EventDetailsModal({ eventId, eventTitle, className, label = "VIEW LOG" }: Props) {
  const [open, setOpen] = useState(false);
  const [data, setData] = useState<EventDetails | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  async function showDetails() {
    setOpen(true);
    setLoading(true);
    setError(null);
    setData(null);
    try {
      const response = await fetch(`/api/player/events/${encodeURIComponent(eventId)}`, { cache: "no-store" });
      const result = await response.json();
      if (!response.ok) throw new Error(typeof result.error === "string" ? result.error : "Could not load event details.");
      setData(result as EventDetails);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not load event details.");
    } finally {
      setLoading(false);
    }
  }

  const effectiveAttendance = data?.attendanceOverride ?? data?.attendanceGranted ?? false;
  const remaining = data?.event.minimumAttendanceMinutes == null || data.totalConnectedSeconds == null
    ? null
    : Math.max(0, data.event.minimumAttendanceMinutes * 60 - data.totalConnectedSeconds);

  return <>
    <button type="button" className={className} aria-haspopup="dialog" aria-label={label === "VIEW LOG" ? `View ${eventTitle} connection log` : `Open ${eventTitle} details`} onClick={showDetails}>
      {label}{label === "VIEW LOG" && <span aria-hidden="true">↗</span>}
    </button>
    <dialog ref={dialogRef} className="event-modal" aria-label={eventTitle} onCancel={(event) => { event.preventDefault(); setOpen(false); }} onClick={(event) => { if (event.target === dialogRef.current) setOpen(false); }}>
      <div className="modal-frame">
        <div className="modal-topline"><span>AFTER ACTION RECORD</span><button type="button" className="modal-close" onClick={() => setOpen(false)} aria-label="Close event details">×</button></div>
        {loading && <div className="modal-state" role="status">Retrieving your connection record…</div>}
        {error && <div className="modal-state modal-error" role="alert">{error}</div>}
        {data && <>
          <header className="modal-event-header"><p className="roster-eyebrow">{data.event.eventCode}{data.event.game ? ` / ${data.event.game}` : ""}</p><h2 id={`event-modal-title-${eventId}`}>{data.event.title || eventTitle}</h2><p>{dateFormat.format(new Date(data.event.eventDate))}</p><span className={`attendance-badge large ${effectiveAttendance ? "granted" : data.totalConnectedSeconds == null ? "pending" : "denied"}`}>{effectiveAttendance ? "ATTENDANCE GRANTED" : data.totalConnectedSeconds == null ? "PENDING REVIEW" : "NOT GRANTED"}</span></header>
          <div className="modal-stats"><article><span>TOTAL TIME</span><strong>{duration(data.totalConnectedSeconds)}</strong></article><article><span>REQUIRED</span><strong>{data.event.minimumAttendanceMinutes == null ? "Not set" : `${data.event.minimumAttendanceMinutes} min`}</strong></article><article><span>TIME REMAINING</span><strong>{remaining == null ? "Pending" : remaining === 0 ? "Threshold met" : duration(remaining)}</strong></article></div>
          <section className="modal-sessions"><div className="modal-section-title"><h3>CONNECTION HISTORY</h3><span>{data.sessions.length} SESSION{data.sessions.length === 1 ? "" : "S"}</span></div>
            {data.sessions.length ? <ol className="modal-session-list">{data.sessions.map((session, index) => <li key={`${session.connectedAt}-${index}`}><span className="modal-session-number">{String(index + 1).padStart(2, "0")}</span><div><strong>CONNECTED</strong><span>{stamp(session.connectedAt)}</span></div><div><strong>DISCONNECTED</strong><span>{session.disconnectedAt ? stamp(session.disconnectedAt) : "No disconnect recorded"}</span></div><div className="modal-duration"><strong>{duration(session.durationSeconds)}</strong><span>DURATION</span></div></li>)}</ol> : <p className="modal-empty">No connection sessions were recorded for this event.</p>}
          </section>
          <p className="modal-time-note">Times use the server log clock. The source logs do not specify a timezone.</p>
        </>}
        {!loading && !error && !data && <div className="modal-state">No details available.</div>}
      </div>
    </dialog>
  </>;
}
