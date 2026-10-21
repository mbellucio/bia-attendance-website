"use client";

import Image from "next/image";
import { useEffect } from "react";
import { notifyError } from "@/lib/notifications";
import { SiteShell } from "@/components/layout/site-shell";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { MemberNavigation } from "@/components/layout/member-navigation";
import { SoldierModel } from "@/app/player-dashboard/components/soldier-model";
import { useApiResource } from "@/hooks/use-api-resource";
import { endpoints } from "@/lib/api/endpoints";
import type { DashboardResponse } from "@/lib/api/player";
import { ApiErrorState } from "@/components/ui/feedback/api-error-state";
import { UserDashboardSkeleton } from "@/components/ui/layout/page-skeleton";

type RoleDisplay = { name: string; iconPath: string | null };

export default function UserDashboard() {
  useEffect(() => {
    const url = new URL(window.location.href);
    if (url.searchParams.get("discordSync") !== "pending") return;
    notifyError("Discord was linked, but role synchronization could not finish. An administrator can retry it from Manage Users.");
    url.searchParams.delete("discordSync");
    window.history.replaceState(window.history.state, "", url.pathname + url.search + url.hash);
  }, []);
  const { data, error, retry } = useApiResource<DashboardResponse>(endpoints.player.dashboard);
  if (error) return <ApiErrorState error={error} onRetry={retry} />;
  if (!data) return <UserDashboardSkeleton />;
  return <DashboardContent data={data} />;
}

function RoleIcon({ role, size = 32 }: { role: RoleDisplay; size?: number }) {
  if (!role.iconPath) return null;
  return (
    <Image
      src={role.iconPath}
      alt=""
      aria-hidden="true"
      width={size}
      height={size}
      unoptimized
      className="shrink-0 object-contain"
    />
  );
}

function DashboardContent({ data }: { data: DashboardResponse }) {
  const { name, nickname, rosterLinked, selectedFaction, modelPath } = data;
  const personalName = nickname?.trim() || name;
  return <SiteShell>
    <SiteHeader variant="member"><MemberNavigation active="dashboard" isAdmin={data.isAdmin} /></SiteHeader>

    <section className="grid gap-5 py-6 md:grid-cols-[minmax(0,1fr)_minmax(300px,420px)] md:gap-7 md:py-8" aria-label="Personnel overview">
      <div className="flex flex-col gap-5">
        <article className="border border-white/10 border-t-2 border-t-[#a8bc7a] bg-[#1a1e1b] p-5 sm:p-7">
          <p className="m-0 text-[9px] font-semibold uppercase tracking-[.16em] text-[#a8bc7a]">SERVICE PROFILE</p>
          <div className="mt-5 flex items-center gap-4">
            {data.rank?.iconPath && <div className="flex size-16 shrink-0 items-center justify-center border border-white/10 bg-black/20"><RoleIcon role={data.rank} size={48} /></div>}
            <div className="min-w-0">
              <p className="m-0 text-[9px] font-semibold uppercase tracking-[.13em] text-[#9da598]">{data.rank?.name ?? "RANK NOT ASSIGNED"}</p>
              <h2 className="mt-1 break-words text-xl font-semibold text-[#f3f1e8] sm:text-2xl">{personalName}</h2>
            </div>
          </div>
          <div className="mt-5 border-t border-white/10 pt-4">
            <p className="m-0 text-[8px] font-semibold uppercase tracking-[.13em] text-[#9da598]">DEPARTMENT</p>
            {data.departments.length ? (
              <div className="mt-1 flex flex-wrap gap-2">
                {data.departments.map((department) => <span key={department.name} className="inline-flex items-center gap-1.5 text-sm text-[#e7e7dc]">
                  <RoleIcon role={department} size={20} />{department.name}
                </span>)}
              </div>
            ) : <p className="mt-1 text-sm text-[#aeb5a7]">Not assigned</p>}
          </div>
          {!rosterLinked && <p className="mt-4 text-xs leading-5 text-[#aeb5a7]">No personnel record is linked to this Steam account yet.</p>}
        </article>

        <article className="border border-white/10 bg-[#1a1e1b] p-5 sm:p-7">
          <p className="m-0 text-[9px] font-semibold uppercase tracking-[.16em] text-[#a8bc7a]">HONORS &amp; RIBBONS</p>
          {data.ribbons.length ? <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {data.ribbons.map((ribbon) => <div key={ribbon.name} className="flex min-h-32 flex-col items-center justify-between gap-3 border border-white/10 bg-black/10 p-3 text-center">
              <p className="m-0 text-xs font-medium leading-5 text-[#e7e7dc]">{ribbon.name}</p>
              {ribbon.iconPath ? <RoleIcon role={ribbon} size={48} /> : <div className="flex size-12 items-center justify-center border border-dashed border-white/15 text-[9px] uppercase tracking-wider text-[#8f9789]">No icon</div>}
            </div>)}
          </div> : <p className="mt-3 text-xs leading-5 text-[#aeb5a7]">No ribbons assigned yet.</p>}
        </article>

        <article className="border border-white/10 bg-[#1a1e1b] p-5 sm:p-7">
          <p className="m-0 text-[9px] font-semibold uppercase tracking-[.16em] text-[#a8bc7a]">COMPETENCES</p>
          {data.competences.length ? <div className="mt-4 flex flex-wrap gap-2">
            {data.competences.map((competence) => <span key={competence.name} className="inline-flex items-center gap-2 border border-white/10 bg-black/10 px-3 py-2 text-xs text-[#e7e7dc]">
              <RoleIcon role={competence} size={24} />{competence.name}
            </span>)}
          </div> : <p className="mt-3 text-xs leading-5 text-[#aeb5a7]">No competences assigned yet.</p>}
        </article>
      </div>
      <SoldierModel initialFaction={selectedFaction} initialModelPath={modelPath} />
    </section>
    <SiteFooter variant="member" />
  </SiteShell>;
}
