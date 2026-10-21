"use client";

import { MemberNavigation } from "@/components/layout/member-navigation";
import { endpoints } from "@/lib/api/endpoints";
import { useApiResource } from "@/hooks/use-api-resource";
import type { AttendanceResponse } from "@/lib/api/player";
import { DashboardSkeleton } from "@/components/ui/layout/page-skeleton";
import { ApiErrorState } from "@/components/ui/feedback/api-error-state";
import { eventTypeLabel } from "@/lib/event-types";
import EventDetailsModal from "@/app/attendance/components/event-details-modal";
import { SiteShell } from "@/components/layout/site-shell";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { StatCard } from "@/components/ui/data-display/stat-card";
import { EmptyState } from "@/components/ui/feedback/empty-state";
import { AutoSubmitPeriodSelect } from "@/components/ui/forms/auto-submit-period-select";

type DashboardProps = { period?: string };
const monthOnlyFormatter = new Intl.DateTimeFormat("en", { month: "long", timeZone: "UTC" });
const monthFormatter = new Intl.DateTimeFormat("en", { month: "long", year: "numeric", timeZone: "UTC" });
function periodFor(value: string) { const date = new Date(value); return date.getUTCFullYear() + "-" + String(date.getUTCMonth() + 1).padStart(2, "0"); }

const outcomeStyle = {
  granted: "text-[#d5e7c5] hover:bg-[#537c40]/30",
  pending: "text-[#f3d97f] hover:bg-[#ab852c]/25",
  denied: "text-[#edb1a0] hover:bg-[#934230]/25",
  missed: "text-[#f2b48e] hover:bg-[#a5552b]/25",
};

export default function AttendanceDashboard({ period }: DashboardProps) {
  const { data, error, retry } = useApiResource<AttendanceResponse>(endpoints.player.attendance);
  if (error) return <ApiErrorState error={error} onRetry={retry} />;
  if (!data) return <DashboardSkeleton />;
  return <AttendanceCalendar data={data} period={period} />;
}

function AttendanceCalendar({ data, period }: { data: AttendanceResponse; period?: string }) {
  const { events } = data;
  const { player } = data.user;
  const availablePeriods = [...new Set(events.map(({ eventDate }) => periodFor(eventDate)))];
  const periodsByYear = availablePeriods.reduce<Record<string, string[]>>((groups, key) => {
    const year = key.slice(0, 4);
    groups[year] = [...(groups[year] ?? []), key];
    return groups;
  }, {});
  const activePeriod = period && availablePeriods.includes(period) ? period : availablePeriods[0];
  const records = activePeriod ? events.filter(({ eventDate }) => periodFor(eventDate) === activePeriod) : [];
  const month = activePeriod ? monthFormatter.format(new Date(activePeriod + "-01T00:00:00Z")) : "No event records";
  const grantedCount = records.filter(({ participants }) => { const p = participants[0]; return Boolean(p && (p.attendanceOverride ?? p.attendanceGranted)); }).length;
  const pendingCount = records.filter(({ participants }) => { const p = participants[0]; return Boolean(p && p.attendanceOverride == null && !p.attendanceGranted && p.totalConnectedSeconds == null); }).length;
  const missedCount = records.filter(({ participants }) => participants.length === 0).length;
  const dateParts = activePeriod?.split("-").map(Number);
  const monthDayCount = dateParts ? new Date(Date.UTC(dateParts[0], dateParts[1], 0)).getUTCDate() : 0;
  const firstWeekday = dateParts ? new Date(Date.UTC(dateParts[0], dateParts[1] - 1, 1)).getUTCDay() : 0;
  const eventsByDay = records.reduce<Record<number, typeof records>>((groups, item) => {
    const day = new Date(item.eventDate).getUTCDate();
    groups[day] = [...(groups[day] ?? []), item];
    return groups;
  }, {});

  return <SiteShell>
    <SiteHeader variant="member">
      <MemberNavigation active="attendance" isAdmin={data.user.isAdmin} />

    </SiteHeader>
    {!player ? <EmptyState label="NO PERSONNEL MATCH" title="Your Steam account is verified.">There is no player record linked to this account yet. Contact an administrator to connect your attendance history.</EmptyState> : <>
      <section className="flex flex-col gap-5 py-7 sm:flex-row sm:items-end sm:justify-between sm:py-8">
        <div className="border-l-4 border-[#a8bc7a] pl-4">
          <p className="mb-2 text-[9px] font-semibold uppercase tracking-[.17em] text-[#b6c781]">LATEST OPERATIONAL PERIOD</p>
          <h2 className="m-0 text-[clamp(30px,4vw,48px)] font-semibold leading-tight tracking-[-.055em] text-[#f4f2e9]">{month}</h2>
        </div>
        <div className="flex flex-col gap-2 sm:min-w-[250px]">
          <AutoSubmitPeriodSelect groups={Object.entries(periodsByYear).map(([year, keys]) => ({ year, periods: keys.map((key) => ({ key, label: monthOnlyFormatter.format(new Date(key + "-01T00:00:00Z")) })) }))} activePeriod={activePeriod ?? ""} disabled={!availablePeriods.length} />
        </div>
      </section>
      <section key={activePeriod ?? "no-period"} id="attendance-calendar" className="animate-[calendar-arrive_260ms_cubic-bezier(.2,.7,.25,1)_both] overflow-hidden border border-white/15 bg-[#1a1e1b] shadow-[0_16px_40px_rgba(0,0,0,.2)]" aria-label={month + " attendance calendar"}>
        <div className="flex flex-col gap-4 border-b border-white/10 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div><p className="mb-2 text-[9px] font-semibold uppercase tracking-[.17em] text-[#a8bc7a]">MONTH AT A GLANCE</p><h3 className="m-0 text-xl font-semibold text-[#f3f1e8]">{month}</h3></div>
          <div className="flex flex-wrap gap-x-4 gap-y-2 text-[8px] font-semibold tracking-[.1em] text-[#bec2b7] sm:gap-x-5">
            <span className="inline-flex items-center gap-1.5"><i className="size-2 rounded-full bg-[#b9d69e]" />GRANTED</span>
            <span className="inline-flex items-center gap-1.5"><i className="size-2 rounded-full bg-[#f0cd68]" />PENDING</span>
            <span className="inline-flex items-center gap-1.5"><i className="size-2 rounded-full bg-[#e3a090]" />NOT GRANTED</span>
            <span className="inline-flex items-center gap-1.5"><i className="size-2 rounded-full bg-[#f0aa7e]" />DID NOT ATTEND</span>
          </div>
        </div>
        <div className="overflow-x-auto">
          <div className="grid min-w-[620px] grid-cols-7">
            {(["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"] as const).map((day) => <div className="border-b border-r border-white/10 bg-[#292f29] py-3 text-center text-[9px] font-semibold tracking-[.12em] text-[#d4d7cc]" key={day}>{day}</div>)}
            {Array.from({ length: firstWeekday }, (_, index) => <div className="min-h-[82px] border-b border-r border-white/10 bg-white/[.015] sm:min-h-[104px]" aria-hidden="true" key={"blank-" + index} />)}
            {Array.from({ length: monthDayCount }, (_, index) => {
              const day = index + 1;
              const dayEvents = eventsByDay[day] ?? [];
              return <div className={"relative min-h-[82px] border-b border-r border-white/10 bg-[#1d221e] sm:min-h-[104px] " + (dayEvents.length ? "bg-[linear-gradient(145deg,rgba(104,128,77,.17),rgba(255,255,255,.018))]" : "")} key={day}>
                <span className="pointer-events-none relative z-[1] block px-2 pt-2 text-[11px] font-semibold text-[#f4f2e9] sm:text-xs">{String(day).padStart(2, "0")}</span>
                {dayEvents.length > 0 && <div className="absolute inset-0 flex flex-col">
                  {dayEvents.map((event, eventIndex) => {
                    const participation = event.participants[0];
                    const effective = participation?.attendanceOverride ?? participation?.attendanceGranted ?? false;
                    const pending = Boolean(participation && participation.attendanceOverride == null && !participation.attendanceGranted && participation.totalConnectedSeconds == null);
                    const outcome = !participation ? "missed" : pending ? "pending" : effective ? "granted" : "denied";
                    const status = !participation ? "Did not attend" : pending ? "Pending review" : effective ? "Attended" : "Attendance not granted";
                    const cellClass = "flex min-h-0 w-full flex-1 flex-col justify-start gap-1 overflow-hidden border-0 bg-transparent px-1.5 pb-1 text-left text-[8px] font-semibold leading-tight transition-colors focus-visible:z-[2] focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#a8bc7a] sm:text-[9px] " + (eventIndex === 0 ? "pt-6" : "py-2") + " " + outcomeStyle[outcome];
                    return <EventDetailsModal className={cellClass} key={event.id} eventId={event.id} eventTitle={event.title} label={eventTypeLabel(event.eventType)} attendanceStatus={status} />;
                  })}
                </div>}
              </div>;
            })}
          </div>
        </div>
      </section>
      <section id="period-summary" className="my-6 grid grid-cols-1 gap-3 sm:grid-cols-3" aria-label="Attendance summary">
        <StatCard label="EVENTS THIS PERIOD" value={records.length} />
        <StatCard label="ATTENDANCE GRANTED" value={grantedCount} />
        <StatCard label="DID NOT ATTEND" value={missedCount} />
      </section>
      {pendingCount > 0 && <p className="my-4 border-l-2 border-[#a8bc7a] pl-3 text-[10px] leading-5 text-[#a7aea1]">{pendingCount} attendance record{pendingCount === 1 ? " is" : "s are"} still under review.</p>}
      <p className="mb-6 mt-4 text-[10px] leading-5 text-[#a7aea1]">Event dates remain as recorded. Connection timestamps in event details are converted to GMT (server clock: GMT+2; GMT+3 during EU summer time).</p>
    </>}
    <SiteFooter variant="member" />
  </SiteShell>;
}
