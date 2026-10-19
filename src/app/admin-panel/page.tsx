import { connection } from "next/server";
import { redirect } from "next/navigation";
import { getSteamSession } from "@/lib/auth/current-user";
import { SiteShell } from "@/components/layout/site-shell";
import { SiteHeader } from "@/components/layout/site-header";
import { MemberNavigation } from "@/components/layout/member-navigation";
import { SiteFooter } from "@/components/layout/site-footer";
import Link from "next/link";

export default async function AdminPanelPage() {
  await connection();
  const session = await getSteamSession();
  if (!session) redirect("/");

  return <SiteShell>
    <SiteHeader variant="member"><MemberNavigation active="admin" isAdmin /></SiteHeader>
    <section className="py-7 sm:py-9">
      <p className="mb-2 text-[9px] font-semibold uppercase tracking-[.17em] text-[#a8bc7a]">ADMINISTRATION</p>
      <h1 className="m-0 text-[clamp(30px,4vw,48px)] font-semibold leading-tight tracking-[-.055em] text-[#f4f2e9]">Admin Panel</h1>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-[#aeb5a7]">Choose an administration area.</p>
    </section>
    <section className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-label="Administration options">
      <Link href="/admin-panel/discord-roles" className="group flex min-h-40 items-center gap-5 border border-white/10 bg-[#1a1e1b] p-5 transition-colors hover:border-[#a8bc7a]/70 hover:bg-[#202720] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a8bc7a] sm:p-6">
        <span className="grid size-14 shrink-0 place-items-center border border-[#a8bc7a]/30 bg-[#506846]/20 text-[#a8bc7a] transition-colors group-hover:bg-[#506846]/40" aria-hidden="true">
          <svg viewBox="0 0 24 24" className="size-7 fill-current" role="img" aria-label="Discord">
            <path d="M19.54 5.34A18.7 18.7 0 0 0 14.9 3.9a.07.07 0 0 0-.08.04c-.2.36-.43.83-.59 1.2a17.3 17.3 0 0 0-5.2 0c-.16-.38-.4-.84-.6-1.2a.08.08 0 0 0-.08-.04 18.6 18.6 0 0 0-4.63 1.44.07.07 0 0 0-.03.03C.77 9.75-.04 14.02.36 18.24c0 .02.02.04.03.05a18.8 18.8 0 0 0 5.68 2.87.08.08 0 0 0 .09-.03c.44-.6.83-1.23 1.16-1.9a.08.08 0 0 0-.04-.1 12.4 12.4 0 0 1-1.77-.84.08.08 0 0 1-.01-.13l.35-.28a.08.08 0 0 1 .08-.01c3.72 1.7 7.75 1.7 11.43 0a.08.08 0 0 1 .08.01l.35.28a.08.08 0 0 1-.01.13c-.57.33-1.16.6-1.78.84a.08.08 0 0 0-.04.1c.34.67.72 1.3 1.16 1.9a.08.08 0 0 0 .09.03 18.7 18.7 0 0 0 5.69-2.87.08.08 0 0 0 .03-.05c.47-4.87-.78-9.1-3.32-12.84a.06.06 0 0 0-.03-.03ZM8.02 14.88c-1.12 0-2.04-1.03-2.04-2.3s.9-2.3 2.04-2.3c1.15 0 2.06 1.04 2.04 2.3 0 1.27-.9 2.3-2.04 2.3Zm7.96 0c-1.12 0-2.04-1.03-2.04-2.3s.9-2.3 2.04-2.3c1.15 0 2.06 1.04 2.04 2.3 0 1.27-.89 2.3-2.04 2.3Z" />
          </svg>
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[9px] font-semibold uppercase tracking-[.14em] text-[#a8bc7a]">DISCORD</span>
          <span className="mt-1 block text-lg font-semibold text-[#f3f1e8]">Discord roles</span>
          <span className="mt-2 block text-xs leading-5 text-[#aeb5a7]">Synchronize and review the server role catalog.</span>
        </span>
        <span className="text-xl text-[#9da598] transition-transform group-hover:translate-x-1 group-hover:text-[#a8bc7a]" aria-hidden="true">→</span>
      </Link>
    </section>
    <SiteFooter variant="member" />
  </SiteShell>;
}
