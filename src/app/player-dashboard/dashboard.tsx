"use client";

import Link from "next/link";
import { SiteShell } from "@/components/layout/site-shell";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { MemberNavigation } from "@/components/layout/member-navigation";
import { SoldierModel } from "@/components/dashboard/soldier-model";
import { useApiResource } from "@/hooks/use-api-resource";
import { endpoints } from "@/lib/api/endpoints";
import type { DashboardResponse } from "@/lib/api/player";
import { ApiErrorState } from "@/components/ui/api-error-state";
import { UserDashboardSkeleton } from "@/components/ui/page-skeleton";

const dateFormatter = new Intl.DateTimeFormat("en", { dateStyle: "medium", timeZone: "UTC" });

export default function UserDashboard() {
  const { data, error, retry } = useApiResource<DashboardResponse>(endpoints.player.dashboard);
  if (error) return <ApiErrorState error={error} onRetry={retry} />;
  if (!data) return <UserDashboardSkeleton />;
  return <DashboardContent data={data} />;
}

function DashboardContent({ data }: { data: DashboardResponse }) {
  const { steamId, name, nickname, attendedOperations, rosterLinked, selectedFaction, modelPath } = data;
  const createdAt = data.createdAt ? new Date(data.createdAt) : null;
  return <SiteShell>
    <SiteHeader variant="member"><MemberNavigation active="dashboard" /></SiteHeader>
    <section className="-mx-[clamp(20px,6.25vw,104px)] border-b border-white/10 bg-[linear-gradient(110deg,#171b18_0%,#202820_64%,#293229_100%)] px-[clamp(20px,7.45vw,124px)] py-8 sm:py-10 md:py-12">
      <p className="mb-3 text-[9px] font-semibold uppercase tracking-[.19em] text-[#b6c781] sm:text-[10px]">BIA MEMBER PORTAL <span className="mx-2 text-[#a8bc7a]">/</span> PERSONNEL DASHBOARD</p>
      <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="m-0 text-[clamp(42px,5.2vw,72px)] font-medium leading-none tracking-[-.065em] text-[#f6f4e9]">{name}</h1>
          <p className="mt-3 max-w-xl text-sm leading-6 text-[#c4c8bd]">Your service record, operations and honours at a glance.</p>
        </div>
        <div className="inline-flex flex-col gap-1 border-l border-[#a8bc7a] pl-3">
          <span className="text-[8px] uppercase tracking-[.14em] text-[#b6b9ad]">STEAM ACCOUNT</span>
          <strong className="font-mono text-[11px] text-[#f1f0e7]">{steamId}</strong>
        </div>
      </div>
    </section>

    <section className="grid gap-5 py-6 md:grid-cols-[minmax(0,1fr)_minmax(300px,420px)] md:gap-7 md:py-8" aria-label="Personnel overview">
      <div className="flex flex-col gap-5">
        <article className="border border-white/10 border-t-2 border-t-[#a8bc7a] bg-[#1a1e1b] p-5 sm:p-7">
          <p className="m-0 text-[9px] font-semibold uppercase tracking-[.16em] text-[#a8bc7a]">OPERATIONS ATTENDED</p>
          <p className="mt-4 text-[clamp(54px,8vw,88px)] font-semibold leading-none tracking-[-.07em] text-[#f3f1e8]" aria-live="polite">{attendedOperations ?? "—"}</p>
          <p className="mt-3 text-xs leading-5 text-[#aeb5a7]">{rosterLinked ? "Operations with attendance granted, including approved overrides." : "No personnel record is linked to this Steam account yet."}</p>
          {rosterLinked && <Link className="mt-5 inline-flex min-h-10 items-center border border-[#71855d]/60 px-3 text-[9px] font-semibold uppercase tracking-[.12em] text-[#d8dfc9] transition-colors hover:border-[#a8bc7a] hover:bg-[#506846]/40" href="/attendance">VIEW ATTENDANCE RECORD</Link>}
        </article>

        <article className="border border-white/10 bg-[#1a1e1b] p-5 sm:p-7">
          <p className="m-0 text-[9px] font-semibold uppercase tracking-[.16em] text-[#a8bc7a]">SERVICE PROFILE</p>
          <dl className="mt-4 grid gap-4 sm:grid-cols-2">
            <div><dt className="text-[8px] uppercase tracking-[.13em] text-[#9da598]">PERSONNEL NAME</dt><dd className="mt-1 text-sm text-[#e7e7dc]">{nickname ?? name}</dd></div>
            <div><dt className="text-[8px] uppercase tracking-[.13em] text-[#9da598]">MEMBER SINCE</dt><dd className="mt-1 text-sm text-[#e7e7dc]">{createdAt ? dateFormatter.format(createdAt) : "Database unavailable"}</dd></div>
          </dl>
        </article>

        <article className="border border-dashed border-white/15 bg-[#171b18]/70 p-5 sm:p-7">
          <p className="m-0 text-[9px] font-semibold uppercase tracking-[.16em] text-[#a8bc7a]">HONOURS & RIBBONS</p>
          <h2 className="mt-3 text-lg font-semibold text-[#e3e4d9]">Awards will appear here</h2>
          <p className="mt-2 max-w-lg text-xs leading-5 text-[#aeb5a7]">Your personnel display is ready for future medals and ribbons.</p>
        </article>
      </div>
      <SoldierModel initialFaction={selectedFaction} initialModelPath={modelPath} />
    </section>
    <SiteFooter variant="member" />
  </SiteShell>;
}