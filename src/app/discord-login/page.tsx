import { Suspense } from "react";
import { redirect } from "next/navigation";
import { ArrowUpRightIcon } from "@heroicons/react/24/outline";
import { getSteamSession } from "@/lib/auth/current-user";
import { endpoints } from "@/lib/api/endpoints";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteShell } from "@/components/layout/site-shell";
import { ErrorNotification } from "@/components/ui/error-notification";

const errorMessages: Record<string, string> = {
  config: "Discord sign-in is not configured yet. Please contact the BIA administrator.",
  state: "That Discord connection attempt expired. Please try again.",
  cancelled: "Discord connection was cancelled. Connect Discord to continue.",
  invalid: "Discord could not verify this connection. Please try again.",
  already_linked: "That Discord account is already connected to another BIA account.",
  account: "We could not save your Discord connection. Please try again later.",
  unavailable: "Discord sign-in is temporarily unavailable. Please try again later.",
};

type DiscordLoginProps = { searchParams: Promise<{ error?: string }> };

async function DiscordLoginContent({ searchParams }: DiscordLoginProps) {
  const [session, params] = await Promise.all([getSteamSession(), searchParams]);
  if (!session) redirect("/");
  if (session.discordLinked) redirect("/player-dashboard");

  const message = params.error ? errorMessages[params.error] : undefined;
  return <section className="w-full max-w-[760px]" aria-labelledby="page-title">
    <p className="mb-6 flex items-center gap-3 text-[10px] font-semibold uppercase tracking-[.19em] text-[#a8bc7a]"><span className="size-1.5 rounded-full bg-[#a8bc7a]" /> ACCOUNT LINK REQUIRED <span className="ml-1 h-px w-8 bg-[#a8bc7a]/50" /></p>
    <h1 id="page-title" className="m-0 max-w-[720px] text-[clamp(42px,6vw,76px)] font-medium leading-[.99] tracking-[-.07em] text-[#f5f4ec]">Connect your<br /><span className="text-[#a8bc7a]">Discord account.</span></h1>
    <p className="mt-5 max-w-[610px] text-sm leading-7 text-[#c0c5b9] sm:text-base">BIA uses this link to match your Steam sign-in to your Discord member record and sync your server roles. You’ll authorize the connection on Discord; your Discord password is never shared with BIA.</p>
    {message && <ErrorNotification message={message} />}
    <a className="mt-7 flex min-h-[54px] w-full items-center gap-3 bg-[#5865f2] px-5 text-xs font-bold text-white transition-colors hover:bg-[#6975f5] focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#a8bc7a] sm:w-auto sm:min-w-[300px]" href={endpoints.auth.discord}>
      <svg aria-hidden="true" viewBox="0 0 24 24" className="size-6 shrink-0" fill="currentColor"><path d="M19.73 5.2A18.3 18.3 0 0 0 15.2 3.8l-.56 1.14a16.9 16.9 0 0 0-5.28 0L8.8 3.8a18.3 18.3 0 0 0-4.53 1.4C1.4 9.42.63 13.55 1.02 17.62a18.5 18.5 0 0 0 5.57 2.82l1.2-1.95c-.66-.24-1.3-.54-1.9-.9l.47-.36c3.67 1.7 7.65 1.7 11.28 0l.48.36c-.6.36-1.24.66-1.9.9l1.2 1.95a18.5 18.5 0 0 0 5.57-2.82c.46-4.72-.78-8.82-3.26-12.42ZM8.73 14.94c-1.1 0-2-.99-2-2.2s.88-2.2 2-2.2 2.02.99 2 2.2c0 1.21-.88 2.2-2 2.2Zm6.54 0c-1.1 0-2-.99-2-2.2s.88-2.2 2-2.2 2.02.99 2 2.2c0 1.21-.88 2.2-2 2.2Z" /></svg>
      <span>Continue with Discord</span><ArrowUpRightIcon className="ml-auto size-4 shrink-0" aria-hidden="true" />
    </a>
    <p className="mt-4 max-w-[520px] text-[10px] leading-5 text-[#9fa79a]">Only your Discord account identifier is linked to your BIA account. Your server roles are read by the BIA Discord bot.</p>
  </section>;
}

export default function DiscordLoginPage(props: DiscordLoginProps) {
  return <SiteShell variant="auth">
    <SiteHeader variant="auth" status="DISCORD ACCOUNT REQUIRED" />
    <div className="mx-auto flex w-full max-w-[1080px] flex-1 flex-col justify-center gap-7 py-[clamp(40px,7vh,72px)]">
      <Suspense fallback={<section className="w-full max-w-[760px]" aria-live="polite"><p className="text-sm text-[#c0c5b9]">Checking your account…</p></section>}>
        <DiscordLoginContent searchParams={props.searchParams} />
      </Suspense>
    </div>
    <SiteFooter variant="auth" />
  </SiteShell>;
}