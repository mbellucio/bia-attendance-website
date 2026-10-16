import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { getSteamSession } from "@/lib/auth/current-user";
import { createSessionToken, DISCORD_STATE_COOKIE, SESSION_COOKIE, SESSION_MAX_AGE_SECONDS } from "@/lib/auth/session";
import { appOrigin } from "@/lib/discord/config";

function back(request: NextRequest, status: string) {
  const response = NextResponse.redirect(new URL(`/profile?discord=${encodeURIComponent(status)}`, request.nextUrl.origin));
  response.cookies.delete(DISCORD_STATE_COOKIE);
  return response;
}

export async function GET(request: NextRequest) {
  const session = await getSteamSession();
  const stateCookie = (await cookies()).get(DISCORD_STATE_COOKIE)?.value;
  const state = request.nextUrl.searchParams.get("state");
  const code = request.nextUrl.searchParams.get("code");
  if (!session) return back(request, "session");
  if (!stateCookie || stateCookie !== state || !state?.startsWith(`${session.steamId}.`)) return back(request, "state");
  if (request.nextUrl.searchParams.has("error") || !code) return back(request, "cancelled");

  const clientId = process.env.DISCORD_CLIENT_ID?.trim();
  const clientSecret = process.env.DISCORD_CLIENT_SECRET?.trim();
  if (!clientId || !clientSecret) return back(request, "config");

  try {
    const origin = appOrigin(request.url);
    const redirectUri = new URL("/api/auth/discord/callback", origin).toString();
    const tokenResponse = await fetch("https://discord.com/api/v10/oauth2/token", {
      method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ client_id: clientId, client_secret: clientSecret, grant_type: "authorization_code", code, redirect_uri: redirectUri }),
      cache: "no-store", redirect: "error", signal: AbortSignal.timeout(8_000),
    });
    if (!tokenResponse.ok) return back(request, "unavailable");
    const tokenData = await tokenResponse.json() as { access_token?: string; token_type?: string };
    if (!tokenData.access_token || tokenData.token_type?.toLowerCase() !== "bearer") return back(request, "unavailable");

    const userResponse = await fetch("https://discord.com/api/v10/users/@me", {
      headers: { Authorization: `Bearer ${tokenData.access_token}`, Accept: "application/json" },
      cache: "no-store", redirect: "error", signal: AbortSignal.timeout(8_000),
    });
    if (!userResponse.ok) return back(request, "unavailable");
    const discordUser = await userResponse.json() as { id: string };
    if (!/^\d{17,20}$/.test(discordUser.id)) return back(request, "unavailable");

    const signed = await createSessionToken(session.steamId, discordUser.id);
    const response = NextResponse.redirect(new URL("/profile?discord=linked", origin));
    response.cookies.delete(DISCORD_STATE_COOKIE);
    response.cookies.set(SESSION_COOKIE, signed, {
      httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: SESSION_MAX_AGE_SECONDS,
    });
    return response;
  } catch { return back(request, "unavailable"); }
}
