import { Suspense } from "react";
import { ArrowUpRightIcon } from "@heroicons/react/24/outline";
import { signOut } from "@/app/actions";
import { getSteamSession } from "@/lib/auth/current-user";
import PlayerDashboard from "@/app/player-dashboard";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteShell } from "@/components/layout/site-shell";
import { SteamMark } from "@/components/ui/steam-mark";
import { DashboardSkeleton, LoginPanelSkeleton, PortalSkeleton } from "@/components/ui/page-skeleton";

const errorMessages: Record<string, string> = {
  state: "That sign-in attempt expired. Please try again.",
  cancelled: "Steam sign-in was cancelled.",
  invalid: "Steam could not verify this sign-in. Please try again.",
  unavailable: "Steam sign-in is temporarily unavailable. Please try again.",
  config: "Steam sign-in is not configured yet. Check the local setup notes.",
  database: "Steam verified your account, but we could not save your user record. Check the database connection and migration.",
};

type HomeProps = { searchParams: Promise<{ error?: string; period?: string }> };

async function LoginPanel({ searchParams }: HomeProps) {
  const [{ error }, session] = await Promise.all([searchParams, getSteamSession()]);
  const message = error ? errorMessages[error] : undefined;
  const databaseConnected = Boolean(process.env.DATABASE_URL);

  return <section className={session ? "w-full max-w-xl border border-white/15 border-t-[3px] border-t-[#a8bc7a] bg-[#202520] text-[#f0efe7] shadow-[0_22px_70px_rgba(0,0,0,.32)]" : "w-full border-t border-white/20"} aria-label="Steam sign in">
    {session && <div className="flex justify-between border-b border-white/10 px-5 py-3 text-[8px] uppercase tracking-[.14em] text-[#b8beb1]"><span>IDENTITY PROVIDER</span><span>01 / STEAM</span></div>}
    <div className={session ? "p-5 sm:p-7" : "flex flex-wrap items-center gap-x-6 gap-y-3 pt-4"}>
      {session ? <>
        <div className="mb-6 inline-flex items-center gap-2 text-[9px] uppercase tracking-[.15em] text-[#e3e5dc]"><SteamMark /><span>STEAM ACCOUNT</span></div>
        <p className="mb-2 text-[9px] font-semibold uppercase tracking-[.15em] text-[#a8bc7a]">SESSION PROFILE UNAVAILABLE</p>
        <h2 className="m-0 text-3xl font-medium tracking-tight">Roster access pending.</h2>
        <p className="mt-3 max-w-sm text-xs leading-6 text-[#c0c5b9]">This account has no linked attendance profile yet. Ask an administrator to link your player record.</p>
        <div className="my-5 flex flex-col gap-1 bg-[#2b312b] p-3"><span className="text-[8px] uppercase tracking-[.14em] text-[#b8beb1]">STEAM ID</span><span className="font-mono text-xs text-[#f0efe7]">{session.steamId}</span></div>
        <form action={signOut}><button className="min-h-12 border border-[#a8bc7a] bg-[#506846] px-5 text-xs font-bold text-[#f5f3e8] transition-colors hover:bg-[#617a54] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a8bc7a]" type="submit">Sign out</button></form>
        {!databaseConnected && <p className="mt-4 border-l-2 border-[#a8bc7a] pl-3 text-[10px] leading-5 text-[#abb1a5]">The database is not connected.</p>}
      </> : <>
        <p className="m-0 w-full text-[9px] font-semibold uppercase tracking-[.16em] text-[#c6cdbb]">MEMBER SIGN-IN</p>
        {message && <p className="m-0 w-full border-l-2 border-[#e2846e] bg-[#7e3225]/30 px-3 py-2 text-xs text-[#ffd8cf]" role="alert">{message}</p>}
        <a className="flex min-h-[52px] w-full items-center gap-3 bg-[#506846] px-5 text-xs font-bold text-[#f5f3e8] transition-colors hover:bg-[#617a54] focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#a8bc7a] sm:w-auto sm:min-w-[280px]" href="/api/auth/steam">
          <SteamMark className="size-6 shrink-0 text-[#f4f3e9] [filter:drop-shadow(0_0_1px_rgba(23,25,20,.7))]" />
          <span>Sign in through Steam</span><ArrowUpRightIcon className="ml-auto size-4 shrink-0" aria-hidden="true" />
        </a>
        <p className="m-0 max-w-sm text-[10px] leading-5 text-[#aeb5a7]">Steam shares your unique account ID with us. It does not provide your email address through this sign-in.</p>
      </>}
    </div>
    {session && <div className="flex justify-between border-t border-white/10 px-5 py-3 text-[8px] uppercase tracking-[.14em] text-[#b8beb1]"><span>AUTHENTICATION BY STEAM</span><span>OPENID 2.0</span></div>}
  </section>;
}

function LoginPage({ searchParams }: HomeProps) {
  return <SiteShell variant="auth">
    <SiteHeader variant="auth" />
    <div className="mx-auto flex w-full max-w-[1080px] flex-1 flex-col justify-center gap-7 py-[clamp(40px,7vh,72px)]">
      <section className="w-full max-w-[940px]" aria-labelledby="page-title">
        <p className="mb-6 flex items-center gap-3 text-[10px] font-semibold uppercase tracking-[.19em] text-[#a8bc7a]"><span className="size-1.5 rounded-full bg-[#a8bc7a]" /> MEMBER ACCESS <span className="ml-1 h-px w-8 bg-[#a8bc7a]/50" /></p>
        <h1 id="page-title" className="m-0 max-w-[900px] text-[clamp(44px,6.2vw,88px)] font-medium leading-[.99] tracking-[-.07em] text-[#f5f4ec]">One roster.<br /><span className="text-[#a8bc7a]">Every operation.</span></h1>
        <p className="mt-5 max-w-[510px] text-sm leading-7 text-[#c0c5b9] sm:text-base">A clearer home for event records and attendance. Sign in with your Steam account to get started.</p>
        <p className="mt-7 flex items-center gap-3 text-[9px] uppercase tracking-[.15em] text-[#abb1a5]"><span className="text-[10px] text-[#a8bc7a]">01</span><span>YOUR STEAM PASSWORD STAYS WITH STEAM</span></p>
      </section>
      <Suspense fallback={<LoginPanelSkeleton />}><LoginPanel searchParams={searchParams} /></Suspense>
    </div>
    <SiteFooter variant="auth" />
  </SiteShell>;
}

async function Portal({ searchParams }: HomeProps) {
  const [params, session] = await Promise.all([searchParams, getSteamSession()]);
  if (session) return <Suspense fallback={<DashboardSkeleton />}><PlayerDashboard steamId={session.steamId} period={params.period} /></Suspense>;
  return <LoginPage searchParams={Promise.resolve(params)} />;
}

export default function Home({ searchParams }: HomeProps) {
  return <Suspense fallback={<PortalSkeleton />}><Portal searchParams={searchParams} /></Suspense>;
}
