import { Suspense } from "react";
import { ArrowUpRightIcon } from "@heroicons/react/24/outline";
import { endpoints } from "@/lib/api/endpoints";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteShell } from "@/components/layout/site-shell";
import { SteamMark } from "@/components/ui/steam-mark";
import { ErrorNotification } from "@/components/ui/error-notification";
import { LoginPanelSkeleton } from "@/components/ui/page-skeleton";

type HomeProps = { searchParams: Promise<{ error?: string }> };
const errorMessages: Record<string, string> = {
  state: "That sign-in attempt expired. Please try again.",
  cancelled: "Steam sign-in was cancelled.",
  invalid: "Steam could not verify this sign-in. Please try again.",
  unavailable: "Steam sign-in is temporarily unavailable. Please try again.",
  config: "Steam sign-in is not configured yet. Check the local setup notes.",
  database: "Steam verified your account, but we could not save your account. Please try again later.",
};

async function LoginPanel({ searchParams }: HomeProps) {
  const { error } = await searchParams;
  const message = error ? errorMessages[error] : undefined;
  return <section className="w-full border-t border-white/20" aria-label="Steam sign in">
    <div className="flex flex-wrap items-center gap-x-6 gap-y-3 pt-4">
      <p className="m-0 w-full text-[9px] font-semibold uppercase tracking-[.16em] text-[#c6cdbb]">MEMBER SIGN-IN</p>
      {message && <ErrorNotification message={message} />}
      <a className="flex min-h-[52px] w-full items-center gap-3 bg-[#506846] px-5 text-xs font-bold text-[#f5f3e8] transition-colors hover:bg-[#617a54] focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#a8bc7a] sm:w-auto sm:min-w-[280px]" href={endpoints.auth.steam}>
        <SteamMark className="size-6 shrink-0 text-[#f4f3e9]" />
        <span>Sign in through Steam</span><ArrowUpRightIcon className="ml-auto size-4 shrink-0" aria-hidden="true" />
      </a>
      <p className="m-0 max-w-sm text-[10px] leading-5 text-[#aeb5a7]">Steam shares your unique account ID with us. It does not provide your email address through this sign-in.</p>
    </div>
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

export default function Home(props: HomeProps) {
  return <LoginPage {...props} />;
}