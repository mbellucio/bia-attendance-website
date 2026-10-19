import Link from "next/link";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import { getSteamSession } from "@/lib/auth/current-user";
import { MemberNavigation } from "@/components/layout/member-navigation";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteShell } from "@/components/layout/site-shell";
import DiscordRolesPanel from "../panel";

export default async function DiscordRolesPage() {
  await connection();
  const session = await getSteamSession();
  if (!session) redirect("/");

  return <SiteShell>
    <SiteHeader variant="member"><MemberNavigation active="admin" isAdmin /></SiteHeader>
    <div className="pt-7 sm:pt-9">
      <nav className="mb-5 flex items-center gap-2 text-[9px] font-semibold uppercase tracking-[.13em]" aria-label="Breadcrumb">
        <Link className="text-[#aeb5a7] transition-colors hover:text-[#a8bc7a]" href="/admin-panel">Admin Panel</Link>
        <span className="text-[#65705d]" aria-hidden="true">/</span>
        <span className="text-[#a8bc7a]" aria-current="page">Discord roles</span>
      </nav>
      <h1 className="m-0 text-[clamp(30px,4vw,48px)] font-semibold leading-tight tracking-[-.055em] text-[#f4f2e9]">Discord roles</h1>
      <p className="mb-6 mt-2 max-w-2xl text-sm leading-6 text-[#aeb5a7]">Synchronize the server roles into the staging catalog.</p>
    </div>
    <DiscordRolesPanel />
    <SiteFooter variant="member" />
  </SiteShell>;
}
