import { randomBytes } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { getSteamSession } from "@/lib/auth/current-user";
import { DISCORD_STATE_COOKIE } from "@/lib/auth/session";
import { appOrigin, DISCORD_STATE_MAX_AGE_SECONDS } from "@/lib/discord/config";

export async function GET(request: NextRequest) {
  const session = await getSteamSession();
  if (!session) return NextResponse.redirect(new URL("/?error=discord_session", request.nextUrl.origin));
  const clientId = process.env.DISCORD_CLIENT_ID?.trim();
  if (!clientId) return NextResponse.redirect(new URL("/profile?discord=config", request.nextUrl.origin));

  try {
    const origin = appOrigin(request.url);
    const state = `${session.steamId}.${randomBytes(32).toString("base64url")}`;
    const redirectUri = new URL("/api/auth/discord/callback", origin).toString();
    const authorize = new URL("https://discord.com/oauth2/authorize");
    authorize.searchParams.set("client_id", clientId);
    authorize.searchParams.set("redirect_uri", redirectUri);
    authorize.searchParams.set("response_type", "code");
    authorize.searchParams.set("scope", "identify");
    const response = NextResponse.redirect(authorize);
    response.cookies.set(DISCORD_STATE_COOKIE, state, {
      httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: DISCORD_STATE_MAX_AGE_SECONDS,
    });
    return response;
  } catch {
    return NextResponse.redirect(new URL("/profile?discord=config", request.nextUrl.origin));
  }
}
