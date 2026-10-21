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
import { HomepageFeatureShowcase } from "@/app/components/homepage-feature-showcase";

type HomeProps = { searchParams: Promise<{ error?: string }> };
const errorMessages: Record<string, string> = {
  state: "That sign-in attempt expired. Please try again.",
  cancelled: "Steam sign-in was cancelled.",
  invalid: "Steam could not verify this sign-in. Please try again.",
  unavailable: "Steam sign-in is temporarily unavailable. Please try again later.",
  config: "Steam sign-in is not configured yet. Check the local setup notes.",
  database: "Steam verified your account, but we could not save your account. Please try again later.",
};

function getNextSundayEventTime(now: Date) {
  const date = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 18));
  const daysToSunday = (7 - date.getUTCDay()) % 7;
  date.setUTCDate(date.getUTCDate() + daysToSunday);
  if (date.getTime() <= now.getTime()) date.setUTCDate(date.getUTCDate() + 7);
  const day = new Intl.DateTimeFormat("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  }).format(date);
  return day + " · 18:00 GMT";
}

function LoginPage({ error, isSignedIn, isAdmin, eventTime }: { error?: string; isSignedIn: boolean; isAdmin: boolean; eventTime: string }) {
  const message = error ? errorMessages[error] : undefined;
  return <SiteShell variant="auth">
    <SiteHeader variant="auth">
      {isSignedIn ? <MemberNavigation active="home" isAdmin={isAdmin} /> : (
        <a className="inline-flex min-h-10 items-center gap-2 border border-[#a8bc7a] bg-[#506846]/35 px-3 text-[9px] font-semibold tracking-wide text-[#e2e8d5] transition-colors hover:bg-[#506846]/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a8bc7a] sm:px-4 sm:text-xs" href={endpoints.auth.steam}>
          <SteamMark className="size-5 shrink-0 text-[#f4f3e9]" />
          <span>Sign in through Steam</span>
          <ArrowUpRightIcon className="size-4 shrink-0" aria-hidden="true" />
        </a>
      )}
    </SiteHeader>
    <div className="mx-auto flex w-full max-w-[1280px] flex-1 flex-col justify-start gap-7 pb-[clamp(28px,5vh,56px)]">
      {message && <div className="mx-auto w-full max-w-[940px]"><ErrorNotification message={message} /></div>}
      <HomepageFeatureShowcase eventTime={eventTime} />
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
  const eventTime = getNextSundayEventTime(new Date());
  return <LoginPage error={params.error} isSignedIn={Boolean(session)} isAdmin={user?.admin ?? false} eventTime={eventTime} />;
}
