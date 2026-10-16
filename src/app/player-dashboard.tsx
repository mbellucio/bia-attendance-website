import Image from "next/image";
import { signOut } from "@/app/actions";
import { getPrisma } from "@/lib/db";
import { eventTypeLabel } from "@/lib/event-types";
import EventDetailsModal from "@/app/event-details-modal";
import { SiteShell } from "@/components/layout/site-shell";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { StatCard } from "@/components/ui/stat-card";
import { EmptyState } from "@/components/ui/empty-state";
import { AutoSubmitPeriodSelect } from "@/components/ui/auto-submit-period-select";

type DashboardProps = { steamId: string; period?: string };
const monthFormatter = new Intl.DateTimeFormat("en", { month: "long", year: "numeric", timeZone: "UTC" });
function periodFor(date: Date) { return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`; }

export default async function PlayerDashboard({ steamId, period }: DashboardProps) {
  const user = await getPrisma().user.findUnique({ where: { steamId }, select: { steamId: true, displayName: true, player: { select: { id: true, nickname: true } } } });
  const player = user?.player;
  const name = player?.nickname ?? user?.displayName ?? "Player";
  const events = await getPrisma().event.findMany({
    select: {
      id: true, title: true, eventCode: true, eventType: true, game: true, eventDate: true,
      participants: { where: { playerId: player?.id ?? "__no_player__" }, select: { id: true, attendanceGranted: true, attendanceOverride: true, totalConnectedSeconds: true }, take: 1 },
    },
    orderBy: { eventDate: "desc" },
  });
  const availablePeriods = [...new Set(events.map(({ eventDate }) => periodFor(eventDate)))];
  const periodsByYear = availablePeriods.reduce<Record<string, string[]>>((groups, key) => {
    const year = key.slice(0, 4);
    groups[year] = [...(groups[year] ?? []), key];
    return groups;
  }, {});
  const activePeriod = period && availablePeriods.includes(period) ? period : availablePeriods[0];
  const records = activePeriod ? events.filter(({ eventDate }) => periodFor(eventDate) === activePeriod) : [];
  const month = activePeriod ? monthFormatter.format(new Date(`${activePeriod}-01T00:00:00Z`)) : "No event records";
  const grantedCount = records.filter(({ participants }) => { const p = participants[0]; return Boolean(p && (p.attendanceOverride ?? p.attendanceGranted)); }).length;
  const pendingCount = records.filter(({ participants }) => { const p = participants[0]; return Boolean(p && p.attendanceOverride == null && !p.attendanceGranted && p.totalConnectedSeconds == null); }).length;
  const missedCount = records.filter(({ participants }) => participants.length === 0).length;
  const dateParts = activePeriod?.split("-").map(Number);
  const monthDayCount = dateParts ? new Date(Date.UTC(dateParts[0], dateParts[1], 0)).getUTCDate() : 0;
  const firstWeekday = dateParts ? new Date(Date.UTC(dateParts[0], dateParts[1] - 1, 1)).getUTCDay() : 0;
  const eventsByDay = records.reduce<Record<number, typeof records>>((groups, item) => {
    const day = item.eventDate.getUTCDate();
    groups[day] = [...(groups[day] ?? []), item];
    return groups;
  }, {});

  return <SiteShell>
    <SiteHeader variant="member"><nav className="roster-nav" aria-label="Member navigation"><a href="#attendance-calendar">MY ATTENDANCE</a><a href="#period-summary">RECORD SUMMARY</a><form action={signOut}><button className="signout-button" type="submit">SIGN OUT</button></form></nav></SiteHeader>
    <section className="roster-welcome roster-hero"><div className="roster-hero-copy"><p className="roster-eyebrow">BIA MEMBER PORTAL <span className="hero-divider">/</span> PERSONNEL RECORD</p><h1>{name}</h1><p className="roster-subtitle">Your service record, event attendance and connection history.</p><div className="identity-chip"><span>STEAM ACCOUNT</span><strong>{steamId}</strong></div></div><div className="roster-hero-mark" aria-hidden="true"><Image src="/BIA-BW-clean-2048.png" alt="" width={1038} height={1038} sizes="(max-width: 480px) 108px, (max-width: 700px) 170px, 250px" className="roster-hero-logo" unoptimized /><p>FIELD<br />ROSTER</p></div></section>
    {!player ? <EmptyState label="NO PERSONNEL MATCH" title="Your Steam account is verified.">There is no player record linked to this account yet. Contact an administrator to connect your attendance history.</EmptyState> : <>
      <section className="month-heading"><div><p className="roster-eyebrow">LATEST OPERATIONAL PERIOD</p><h2>{month}</h2></div><div className="period-filter"><label htmlFor="period">RECORD PERIOD</label><AutoSubmitPeriodSelect groups={Object.entries(periodsByYear).map(([year, keys]) => ({ year, periods: keys.map((key) => ({ key, label: monthFormatter.format(new Date(key + "-01T00:00:00Z")) })) }))} activePeriod={activePeriod ?? ""} disabled={!availablePeriods.length} /></div></section>
      <section key={activePeriod ?? "no-period"} id="attendance-calendar" className="month-calendar" aria-label={`${month} attendance calendar`}>
        <div className="calendar-title"><div><p className="roster-eyebrow">MONTH AT A GLANCE</p><h3>{month}</h3></div><div className="calendar-legend"><span><i className="granted-dot" /> GRANTED</span><span><i className="pending-dot" /> PENDING</span><span><i className="denied-dot" /> NOT GRANTED</span><span><i className="missed-dot" /> DID NOT ATTEND</span></div></div>
        <div className="calendar-scroll"><div className="calendar-grid">
          {(["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"] as const).map((day) => <div className="calendar-weekday" key={day}>{day}</div>)}
          {Array.from({ length: firstWeekday }, (_, index) => <div className="calendar-cell blank" aria-hidden="true" key={`blank-${index}`} />)}
          {Array.from({ length: monthDayCount }, (_, index) => {
            const day = index + 1;
            const dayEvents = eventsByDay[day] ?? [];
            return <div className={`calendar-cell ${dayEvents.length ? "has-events" : ""}`} key={day}>
              <span className="calendar-date">{String(day).padStart(2, "0")}</span>
              {dayEvents.length > 0 && <div className="calendar-events">{dayEvents.map((event) => {
                const participation = event.participants[0];
                const effective = participation?.attendanceOverride ?? participation?.attendanceGranted ?? false;
                const pending = Boolean(participation && participation.attendanceOverride == null && !participation.attendanceGranted && participation.totalConnectedSeconds == null);
                const outcome = !participation ? "missed" : pending ? "pending" : effective ? "granted" : "denied";
                const status = !participation ? "Did not attend" : pending ? "Pending review" : effective ? "Attended" : "Attendance not granted";
                return <EventDetailsModal className={`calendar-event ${outcome}`} key={event.id} eventId={event.id} eventTitle={event.title} label={eventTypeLabel(event.eventType)} attendanceStatus={status} />;
              })}</div>}
            </div>;
          })}
        </div></div>
      </section>
      <section id="period-summary" className="roster-stats grid grid-cols-3 gap-px" aria-label="Attendance summary"><StatCard label="EVENTS THIS PERIOD" value={records.length} /><StatCard label="ATTENDANCE GRANTED" value={grantedCount} /><StatCard label="DID NOT ATTEND" value={missedCount} /></section>
      {pendingCount > 0 && <p className="time-note">{pendingCount} attendance record{pendingCount === 1 ? " is" : "s are"} still under review.</p>}
      <p className="time-note">Event and connection times use the recorded server log clock. The source logs do not specify a timezone.</p>
    </>}
    <SiteFooter variant="member" />
  </SiteShell>;
}
