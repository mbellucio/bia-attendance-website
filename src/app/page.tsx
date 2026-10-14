import { Suspense } from "react";
import { signOut } from "@/app/actions";
import { getSteamSession } from "@/lib/auth/current-user";
import PlayerDashboard from "@/app/player-dashboard";

const errorMessages: Record<string, string> = {
  state: "That sign-in attempt expired. Please try again.", cancelled: "Steam sign-in was cancelled.",
  invalid: "Steam could not verify this sign-in. Please try again.", unavailable: "Steam sign-in is temporarily unavailable. Please try again.",
  config: "Steam sign-in is not configured yet. Check the local setup notes.",
  database: "Steam verified your account, but we could not save your user record. Check the database connection and migration.",
};
type HomeProps = { searchParams: Promise<{ error?: string; period?: string }> };

function SteamMark() {
  return <svg aria-hidden="true" viewBox="0 0 32 32" className="steam-mark" fill="none"><circle cx="16" cy="16" r="15" fill="currentColor" /><circle cx="21.6" cy="10.2" r="4.1" stroke="#101311" strokeWidth="2.5" /><circle cx="21.6" cy="10.2" r="1.35" fill="#101311" /><circle cx="11.1" cy="21.1" r="3.9" stroke="#101311" strokeWidth="2.4" /><path d="m14.2 18.5 4.7-5.2M7.3 20.1l-5-2" stroke="#101311" strokeWidth="2.6" strokeLinecap="round" /><path d="M7.4 20.1a3.9 3.9 0 0 0 7.5 1.4" stroke="#101311" strokeWidth="2" strokeLinecap="round" /></svg>;
}

async function LoginPanel({ searchParams }: HomeProps) {
  const [{ error }, session] = await Promise.all([searchParams, getSteamSession()]);
  const message = error ? errorMessages[error] : undefined;
  const databaseConnected = Boolean(process.env.DATABASE_URL);
  return <section className="login-panel" aria-label="Steam sign in">
    <div className="panel-topline"><span>IDENTITY PROVIDER</span><span>01 / STEAM</span></div><div className="panel-main">
      <div className="provider-badge"><SteamMark /><span>STEAM ACCOUNT</span></div>
      {session ? <><p className="panel-kicker">SESSION PROFILE UNAVAILABLE</p><h2>Roster access pending.</h2><p className="panel-copy">This account has no linked attendance profile yet. Ask an administrator to link your player record.</p><div className="account-card"><span className="account-label">STEAM ID</span><span className="account-id">{session.steamId}</span></div><form action={signOut}><button className="steam-button secondary-button" type="submit">Sign out</button></form>{!databaseConnected && <p className="setup-note">The database is not connected.</p>}</> : <>
        <p className="panel-kicker">SIGN IN TO CONTINUE</p><h2>Welcome to<br />the roster.</h2><p className="panel-copy">Use Steam to confirm your identity. We never ask for or handle your Steam password.</p>
        {message && <p className="error-message" role="alert">{message}</p>}<a className="steam-button" href="/api/auth/steam"><SteamMark /><span>Sign in through Steam</span><span className="button-arrow" aria-hidden="true">↗</span></a><p className="privacy-note">Steam shares your unique account ID with us. It does not provide your email address through this sign-in.</p>
      </>}
    </div><div className="panel-bottomline"><span>AUTHENTICATION BY STEAM</span><span>OPENID 2.0</span></div>
  </section>;
}
function LoginPanelFallback() { return <section className="login-panel" aria-label="Loading account" aria-busy="true"><div className="panel-topline"><span>PERSONNEL ACCESS</span><span>01 / BIA</span></div><div className="panel-main" role="status">Loading roster…</div></section>; }
function LoginPage({ searchParams }: HomeProps) {
  return <main className="auth-shell"><header className="topbar"><a href="/" className="wordmark" aria-label="BIA Attendance home"><span className="wordmark-icon">B</span><span className="wordmark-text">BIA <span>ATTENDANCE</span></span></a><div className="topbar-status"><span className="status-dot" /> STEAM SECURE SIGN IN</div></header>
    <div className="auth-content"><section className="intro-panel" aria-labelledby="page-title"><p className="eyebrow"><span /> MEMBER ACCESS <span className="eyebrow-line" /></p><h1 id="page-title">One roster.<br /><em>Every operation.</em></h1><p className="intro-copy">A clearer home for event records and attendance. Sign in with your Steam account to get started.</p><div className="intro-footnote"><span className="footnote-number">01</span><span>YOUR STEAM PASSWORD STAYS WITH STEAM</span></div><div className="watermark" aria-hidden="true">BIA</div></section><Suspense fallback={<LoginPanelFallback />}><LoginPanel searchParams={searchParams} /></Suspense></div>
    <footer className="page-footer"><span>BIA ATTENDANCE PORTAL</span><span>YOUR ACCOUNT. YOUR ROSTER.</span></footer></main>;
}
async function Portal({ searchParams }: HomeProps) {
  const [params, session] = await Promise.all([searchParams, getSteamSession()]);
  if (session) return <PlayerDashboard steamId={session.steamId} period={params.period} />;
  return <LoginPage searchParams={Promise.resolve(params)} />;
}
export default function Home({ searchParams }: HomeProps) {
  return <Suspense fallback={<LoginPanelFallback />}><Portal searchParams={searchParams} /></Suspense>;
}
