import { signOut } from "@/app/actions";
import { getPrisma } from "@/lib/db";

type DashboardProps = { steamId: string; period?: string };
const monthFormatter = new Intl.DateTimeFormat("en", { month: "long", year: "numeric", timeZone: "UTC" });
const dateFormatter = new Intl.DateTimeFormat("en", { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" });
function periodFor(date: Date) { return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`; }
function secondsLabel(seconds: number | null | undefined) {
  if (seconds == null) return "—";
  const hours = Math.floor(seconds / 3600); const minutes = Math.floor((seconds % 3600) / 60);
  return hours ? `${hours}h ${minutes}m` : `${minutes}m`;
}

export default async function PlayerDashboard({ steamId, period }: DashboardProps) {
  const user = await getPrisma().user.findUnique({ where: { steamId }, select: { steamId: true, displayName: true, player: { select: { id: true, nickname: true } } } });
  const player = user?.player;
  const name = player?.nickname ?? user?.displayName ?? "Player";
  const participations = player ? await getPrisma().eventParticipant.findMany({
    where: { playerId: player.id },
    select: { id: true, attendanceGranted: true, attendanceOverride: true, totalConnectedSeconds: true,
      event: { select: { id: true, title: true, eventCode: true, game: true, eventDate: true } } },
    orderBy: { event: { eventDate: "desc" } },
  }) : [];
  const availablePeriods = [...new Set(participations.map(({ event }) => periodFor(event.eventDate)))];
  const periodsByYear = availablePeriods.reduce<Record<string, string[]>>((groups, key) => {
    const year = key.slice(0, 4);
    groups[year] = [...(groups[year] ?? []), key];
    return groups;
  }, {});
  const activePeriod = period && availablePeriods.includes(period) ? period : availablePeriods[0];
  const records = activePeriod ? participations.filter(({ event }) => periodFor(event.eventDate) === activePeriod) : [];
  const month = activePeriod ? monthFormatter.format(new Date(`${activePeriod}-01T00:00:00Z`)) : "No records yet";
  const grantedCount = records.filter((item) => item.attendanceOverride ?? item.attendanceGranted).length;
  const pendingCount = records.filter((item) => item.attendanceOverride == null && !item.attendanceGranted && item.totalConnectedSeconds == null).length;

  return <main className="roster-shell">
    <header className="roster-topbar">
      <a href="/" className="wordmark"><span className="wordmark-icon">B</span><span className="wordmark-text">BIA <span>FIELD ROSTER</span></span></a>
      <div className="roster-top-actions"><span className="roster-live"><i /> MEMBER ACCESS</span><form action={signOut}><button className="signout-button" type="submit">Sign out</button></form></div>
    </header>
    <section className="roster-welcome"><div><p className="roster-eyebrow">PERSONNEL FILE / ATTENDANCE RECORD</p><h1>{name}</h1><p className="roster-subtitle">Welcome back. Your event attendance is ready for review.</p></div><div className="identity-chip"><span>STEAM ACCOUNT</span><strong>{steamId}</strong></div></section>
    {!player ? <section className="empty-roster"><p className="roster-eyebrow">NO PERSONNEL MATCH</p><h2>Your Steam account is verified.</h2><p>There is no player record linked to this account yet. Contact an administrator to connect your attendance history.</p></section> : <>
      <section className="month-heading"><div><p className="roster-eyebrow">LATEST OPERATIONAL PERIOD</p><h2>{month}</h2></div><form className="period-filter" method="get"><label htmlFor="period">RECORD PERIOD</label><select id="period" name="period" value={activePeriod ?? ""} disabled={!availablePeriods.length}>{availablePeriods.length ? Object.entries(periodsByYear).map(([year, keys]) => <optgroup key={year} label={year}>{keys.map((key) => <option key={key} value={key}>{monthFormatter.format(new Date(`${key}-01T00:00:00Z`))}</option>)}</optgroup>) : <option value="">No event records</option>}</select><button type="submit" className="period-submit">GO</button></form></section>
      <section className="roster-stats" aria-label="Attendance summary"><article><span>EVENTS THIS PERIOD</span><strong>{records.length}</strong></article><article><span>ATTENDANCE GRANTED</span><strong>{grantedCount}</strong></article><article><span>TIME UNDER REVIEW</span><strong>{pendingCount}</strong></article></section>
      <section className="event-list" aria-label={`${month} events`}><div className="event-list-heading"><span>EVENT RECORD</span><span>DATE</span><span>TIME LOGGED</span><span>ATTENDANCE</span><span /></div>
        {records.length ? records.map((item) => {
          const effective = item.attendanceOverride ?? item.attendanceGranted;
          const pending = item.attendanceOverride == null && !item.attendanceGranted && item.totalConnectedSeconds == null;
          const status = pending ? "PENDING" : effective ? "GRANTED" : "NOT GRANTED";
          return <article className="event-row" key={item.id}><div className="event-title"><span>{item.event.eventCode}</span><strong>{item.event.title}</strong><small>{item.event.game ?? "BIA operation"}</small></div><div className="event-date">{dateFormatter.format(item.event.eventDate)}</div><div className="event-time">{secondsLabel(item.totalConnectedSeconds)}</div><div><span className={`attendance-badge ${pending ? "pending" : effective ? "granted" : "denied"}`}>{status}</span></div><a className="event-detail-link" href={`/events/${encodeURIComponent(item.event.id)}?period=${activePeriod}`} aria-label={`View ${item.event.title} connection log`}>VIEW LOG <span aria-hidden="true">↗</span></a></article>;
        }) : <div className="empty-month"><strong>No event records for this player yet.</strong><span>When your attendance is imported, the latest month will appear here.</span></div>}
      </section>
      <p className="time-note">Connection times use the recorded server log clock. The source logs do not specify a timezone.</p>
    </>}
    <footer className="roster-footer"><span>BIA ATTENDANCE / PERSONNEL RECORD</span><span>AUTHORIZED MEMBER VIEW</span></footer>
  </main>;
}


