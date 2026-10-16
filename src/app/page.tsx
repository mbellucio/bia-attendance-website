import { Suspense } from "react";
import { signOut } from "@/app/actions";
import { getSteamSession } from "@/lib/auth/current-user";
import PlayerDashboard from "@/app/player-dashboard";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteShell } from "@/components/layout/site-shell";
import { SteamMark } from "@/components/ui/steam-mark";

const errorMessages: Record<string, string> = {
  state: "That sign-in attempt expired. Please try again.", cancelled: "Steam sign-in was cancelled.",
  invalid: "Steam could not verify this sign-in. Please try again.", unavailable: "Steam sign-in is temporarily unavailable. Please try again.",
  config: "Steam sign-in is not configured yet. Check the local setup notes.",
  database: "Steam verified your account, but we could not save your user record. Check the database connection and migration.",
};
type HomeProps = { searchParams: Promise<{ error?: string; period?: string }> };

async function LoginPanel({ searchParams }: HomeProps) {
  const [{ error }, session] = await Promise.all([searchParams, getSteamSession()]);
  const message = error ? errorMessages[error] : undefined;
  const databaseConnected = Boolean(process.env.DATABASE_URL);
  return <section className={"login-panel " + (session ? "has-session" : "sign-in-panel")} aria-label="Steam sign in">
    <div className="panel-topline"><span>IDENTITY PROVIDER</span><span>01 / STEAM</span></div><div className="panel-main">
      {session ? <><div className="provider-badge"><SteamMark /><span>STEAM ACCOUNT</span></div><p className="panel-kicker">SESSION PROFILE UNAVAILABLE</p><h2>Roster access pending.</h2><p className="panel-copy">This account has no linked attendance profile yet. Ask an administrator to link your player record.</p><div className="account-card"><span className="account-label">STEAM ID</span><span className="account-id">{session.steamId}</span></div><form action={signOut}><button className="steam-button secondary-button" type="submit">Sign out</button></form>{!databaseConnected && <p className="setup-note">The database is not connected.</p>}</> : <>
        <p className="panel-kicker">MEMBER SIGN-IN</p>
        {message && <p className="error-message" role="alert">{message}</p>}<a className="steam-button" href="/api/auth/steam"><SteamMark /><span>Sign in through Steam</span><span className="button-arrow" aria-hidden="true">↗</span></a><p className="privacy-note">Steam shares your unique account ID with us. It does not provide your email address through this sign-in.</p>
      </>}
    </div><div className="panel-bottomline"><span>AUTHENTICATION BY STEAM</span><span>OPENID 2.0</span></div>
  </section>;
}
function LoginPanelFallback() { return <section className="login-panel" aria-label="Loading account" aria-busy="true"><div className="panel-topline"><span>PERSONNEL ACCESS</span><span>01 / BIA</span></div><div className="panel-main" role="status">Loading roster…</div></section>; }
function LoginPage({ searchParams }: HomeProps) {
  return <SiteShell variant="auth"><SiteHeader variant="auth" />
    <div className="auth-content"><section className="intro-panel" aria-labelledby="page-title"><p className="eyebrow"><span /> MEMBER ACCESS <span className="eyebrow-line" /></p><h1 id="page-title">One roster.<br /><em>Every operation.</em></h1><p className="intro-copy">A clearer home for event records and attendance. Sign in with your Steam account to get started.</p><div className="intro-footnote"><span className="footnote-number">01</span><span>YOUR STEAM PASSWORD STAYS WITH STEAM</span></div></section><Suspense fallback={<LoginPanelFallback />}><LoginPanel searchParams={searchParams} /></Suspense></div>
    <SiteFooter variant="auth" /></SiteShell>;
}
async function Portal({ searchParams }: HomeProps) {
  const [params, session] = await Promise.all([searchParams, getSteamSession()]);
  if (session) return <PlayerDashboard steamId={session.steamId} period={params.period} />;
  return <LoginPage searchParams={Promise.resolve(params)} />;
}
export default function Home({ searchParams }: HomeProps) {
  return <Suspense fallback={<LoginPanelFallback />}><Portal searchParams={searchParams} /></Suspense>;
}
