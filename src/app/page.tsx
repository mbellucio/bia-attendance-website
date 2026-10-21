import { connection } from "next/server";
import { ArrowUpRightIcon } from "@heroicons/react/24/outline";
import { endpoints } from "@/lib/api/endpoints";
import { getSteamSession } from "@/lib/auth/current-user";
import { getPrisma } from "@/lib/db";
import { MemberNavigation } from "@/components/layout/member-navigation";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteShell } from "@/components/layout/site-shell";
import { SteamMark } from "@/components/ui/branding/steam-mark";
import { ErrorNotification } from "@/components/ui/feedback/error-notification";

type HomeProps = { searchParams: Promise<{ error?: string }> };
const errorMessages: Record<string, string> = {
  state: "That sign-in attempt expired. Please try again.",
  cancelled: "Steam sign-in was cancelled.",
  invalid: "Steam could not verify this sign-in. Please try again.",
  unavailable: "Steam sign-in is temporarily unavailable. Please try again.",
  config: "Steam sign-in is not configured yet. Check the local setup notes.",
  database: "Steam verified your account, but we could not save your account. Please try again later.",
};

function LoginPage({ error, isSignedIn, isAdmin }: { error?: string; isSignedIn: boolean; isAdmin: boolean }) {
  const message = error ? errorMessages[error] : undefined;
  return <SiteShell variant="auth">
    <SiteHeader variant="auth" children={isSignedIn ? <MemberNavigation active="home" isAdmin={isAdmin} /> : (
      <a className="inline-flex min-h-10 items-center gap-2 border border-[#a8bc7a] bg-[#506846]/35 px-3 text-[9px] font-semibold tracking-wide text-[#e2e8d5] transition-colors hover:bg-[#506846]/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a8bc7a] sm:px-4 sm:text-xs" href={endpoints.auth.steam}>
        <SteamMark className="size-5 shrink-0 text-[#f4f3e9]" />
        <span>Sign in through Steam</span>
        <ArrowUpRightIcon className="size-4 shrink-0" aria-hidden="true" />
      </a>
    )} />
    <div className="mx-auto flex w-full max-w-[1080px] flex-1 flex-col justify-center gap-7 py-[clamp(40px,7vh,72px)]">
      <section className="w-full max-w-[940px]" aria-labelledby="page-title">
        <p className="mb-6 flex items-center gap-3 text-[10px] font-semibold uppercase tracking-[.19em] text-[#a8bc7a]"><span className="size-1.5 rounded-full bg-[#a8bc7a]" /> BROTHERS IN ARMS <span className="ml-1 h-px w-8 bg-[#a8bc7a]/50" /></p>
        <h1 id="page-title" className="m-0 max-w-[900px] text-[clamp(44px,6.2vw,88px)] font-medium leading-[.99] tracking-[-.07em] text-[#f5f4ec]">Brothers in Arms.<br /><span className="text-[#a8bc7a]">One community.</span></h1>
        <p className="mt-5 max-w-[510px] text-sm leading-7 text-[#c0c5b9] sm:text-base">The home of the Brothers in Arms community, its members, and shared operations.</p>
        {message && <div className="mt-7"><ErrorNotification message={message} /></div>}
      </section>
    </div>
    <SiteFooter variant="auth" />
  </SiteShell>;
}

export default async function Home({ searchParams }: HomeProps) {
  await connection();
  const [session, params] = await Promise.all([getSteamSession(), searchParams]);
  const user = session ? await getPrisma().user.findUnique({
    where: { steamId: session.steamId },
    select: { admin: true },
  }) : null;
  return <LoginPage error={params.error} isSignedIn={Boolean(session)} isAdmin={user?.admin ?? false} />;
}
