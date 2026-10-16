import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { signOut } from "@/app/actions";
import { getSteamSession } from "@/lib/auth/current-user";
import { getPrisma } from "@/lib/db";
import { getLinkedDiscordRoles } from "@/lib/discord/guild-roles";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteShell } from "@/components/layout/site-shell";
import { DashboardSkeleton } from "@/components/ui/page-skeleton";
import { TrophyIcon, ShieldCheckIcon, UserCircleIcon } from "@heroicons/react/24/outline";

type ProfileProps = { searchParams: Promise<{ discord?: string }> };
const messages: Record<string, string> = {
  linked: "Discord account linked. Your current server roles are shown below.",
  config: "Discord linking is not configured. Set the Discord application credentials in the app environment.",
  session: "Sign in with Steam before linking Discord.",
  state: "The Discord link expired or could not be verified. Please try again.",
  cancelled: "Discord linking was cancelled.",
  unavailable: "Discord could not be reached. Please try again.",
};

async function ProfileContent({ searchParams }: ProfileProps) {
  const [session, params] = await Promise.all([getSteamSession(), searchParams]);
  if (!session) redirect("/");
  const user = process.env.DATABASE_URL ? await getPrisma().user.findUnique({
    where: { steamId: session.steamId },
    select: { displayName: true, createdAt: true, player: { select: { nickname: true } } },
  }) : null;
  const name = user?.player?.nickname ?? user?.displayName ?? "BIA Member";
  const discord = await getLinkedDiscordRoles(session.discordId);

  return <SiteShell>
    <SiteHeader variant="member">
      <nav className="flex items-center gap-3 sm:gap-5 md:gap-8" aria-label="Member navigation">
        <Link className="text-[8px] font-semibold tracking-[.1em] text-[#d9dcd2] hover:text-[#a8bc7a] sm:text-[9px]" href="/">MY ATTENDANCE</Link>
        <Link className="text-[8px] font-semibold tracking-[.1em] text-[#a8bc7a] sm:text-[9px]" href="/profile" aria-current="page">MY PROFILE</Link>
        <form action={signOut}><button className="border border-white/35 px-2 py-2 text-[8px] font-semibold tracking-[.1em] text-[#f1f0e9] hover:border-[#a8bc7a] hover:bg-[#a8bc7a] hover:text-[#171914] sm:px-3 sm:text-[9px]" type="submit">SIGN OUT</button></form>
      </nav>
    </SiteHeader>

    <section className="border-b border-white/10 bg-[linear-gradient(110deg,#171b18_0%,#202820_64%,#293229_100%)] px-[clamp(20px,4vw,64px)] py-8 sm:py-10">
      <p className="mb-3 text-[9px] font-semibold uppercase tracking-[.19em] text-[#b6c781]">BIA MEMBER PORTAL <span className="mx-2">/</span> PERSONNEL PROFILE</p>
      <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div><h1 className="m-0 text-[clamp(38px,5vw,68px)] font-medium leading-none tracking-[-.06em] text-[#f6f4e9]">{name}</h1><p className="mt-3 text-sm text-[#c4c8bd]">Your member profile, linked roles and honours.</p></div>
        <div className="border-l border-[#a8bc7a] pl-3"><span className="block text-[8px] uppercase tracking-[.14em] text-[#b6b9ad]">STEAM ACCOUNT</span><strong className="font-mono text-[11px] text-[#f1f0e7]">{session.steamId}</strong></div>
      </div>
    </section>
    {params.discord && messages[params.discord] && <p role="status" className="mt-5 border-l-2 border-[#a8bc7a] bg-[#202520] px-4 py-3 text-xs leading-5 text-[#d9dcd2]">{messages[params.discord]}</p>}

    <section className="grid gap-4 py-7 md:grid-cols-2" aria-label="Member profile">
      <article className="border border-white/10 bg-[#1a1e1b] p-5 sm:p-6">
        <div className="flex items-center gap-3 text-[#b6c781]"><UserCircleIcon className="size-6" /><p className="m-0 text-[9px] font-semibold uppercase tracking-[.16em]">IDENTITY</p></div>
        <h2 className="mt-5 text-xl font-semibold text-[#f3f1e8]">Steam member</h2><p className="mt-2 text-xs leading-5 text-[#b4b9ad]">Your Steam account is the verified sign-in for this roster.</p>
        <p className="mt-5 border-t border-white/10 pt-4 text-[9px] uppercase tracking-[.12em] text-[#9da598]">PROFILE CREATED</p>
        <p className="mt-1 text-sm text-[#e7e7dc]">{user?.createdAt ? new Intl.DateTimeFormat("en", { dateStyle: "medium", timeZone: "UTC" }).format(user.createdAt) : "Available after database setup"}</p>
      </article>
      <article className="border border-white/10 bg-[#1a1e1b] p-5 sm:p-6">
        <div className="flex items-center gap-3 text-[#b6c781]"><ShieldCheckIcon className="size-6" /><p className="m-0 text-[9px] font-semibold uppercase tracking-[.16em]">DISCORD MEMBERSHIP</p></div>
        {session.discordId ? <>
          <h2 className="mt-5 text-xl font-semibold text-[#f3f1e8]">Discord linked</h2><p className="mt-2 font-mono text-[10px] text-[#abb1a5]">ACCOUNT ID · {session.discordId}</p>
          <div className="mt-5 border-t border-white/10 pt-4"><p className="mb-3 text-[9px] font-semibold uppercase tracking-[.12em] text-[#9da598]">CURRENT SERVER ROLES</p>
            {discord.state === "ready" && discord.roles.length ? <ul className="m-0 flex list-none flex-wrap gap-2 p-0">{discord.roles.map((role) => <li key={role.id} className="border border-[#71855d]/50 bg-[#242b23] px-3 py-2 text-xs text-[#e0e5d6]">{role.name}</li>)}</ul>
              : <p className="m-0 text-xs leading-5 text-[#adb3a7]">{discord.state === "ready" ? "No server roles are assigned to this account." : discord.state === "not-configured" ? "Add the bot token and server ID to this app’s environment to load roles." : discord.state === "not-a-member" ? "This Discord account is not a member of the configured server." : "Role information is temporarily unavailable."}</p>}
          </div>
        </> : <><h2 className="mt-5 text-xl font-semibold text-[#f3f1e8]">Link your Discord</h2><p className="mt-2 text-xs leading-5 text-[#b4b9ad]">Connect the Discord account in your BIA server to display your current roles here.</p>
          <a href="/api/auth/discord" className="mt-5 inline-flex min-h-11 items-center border border-[#a8bc7a] bg-[#506846] px-4 text-[10px] font-semibold uppercase tracking-[.1em] text-[#f5f3e8] hover:bg-[#617a54]">Connect Discord</a></>}
      </article>
    </section>

    <section className="mb-8 border border-white/10 bg-[#1a1e1b] p-5 sm:p-6" aria-labelledby="honours-title">
      <div className="flex items-center gap-3 text-[#b6c781]"><TrophyIcon className="size-6" /><p className="m-0 text-[9px] font-semibold uppercase tracking-[.16em]">HONOURS</p></div>
      <h2 id="honours-title" className="mt-5 text-xl font-semibold text-[#f3f1e8]">Medals and ribbons</h2>
      <p className="mt-2 text-xs leading-6 text-[#b4b9ad]">No medal records are available yet. This space is ready for your BIA honours.</p>
    </section>
    <SiteFooter variant="member" />
  </SiteShell>;
}

export default function ProfilePage({ searchParams }: ProfileProps) {
  return <Suspense fallback={<DashboardSkeleton />}><ProfileContent searchParams={searchParams} /></Suspense>;
}
