import { randomBytes } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { getSteamSession } from "@/lib/auth/current-user";
import { DISCORD_STATE_COOKIE, STEAM_STATE_MAX_AGE_SECONDS } from "@/lib/auth/session";

const AUTHORIZE_ENDPOINT = "https://discord.com/oauth2/authorize";

function appOrigin(request: NextRequest): string {
  const configuredUrl = process.env.APP_URL;
  if (configuredUrl) return new URL(configuredUrl).origin;
  if (process.env.NODE_ENV === "production") throw new Error("APP_URL must be configured in production.");
  return request.nextUrl.origin;
}

export async function GET(request: NextRequest) {
  const session = await getSteamSession();
  if (!session) return NextResponse.redirect(new URL("/", request.url));
  if (session.discordLinked) return NextResponse.redirect(new URL("/player-dashboard", request.url));

  const clientId = process.env.DISCORD_CLIENT_ID;
  if (!clientId || !process.env.DISCORD_CLIENT_SECRET) {
    return NextResponse.redirect(new URL("/discord-login?error=config", request.url));
  }

  try {
    const origin = appOrigin(request);
    const state = randomBytes(32).toString("base64url");
    const redirectUri = new URL("/api/auth/discord/callback", origin).toString();
    const authorizeUrl = new URL(AUTHORIZE_ENDPOINT);
    authorizeUrl.searchParams.set("client_id", clientId);
    authorizeUrl.searchParams.set("redirect_uri", redirectUri);
    authorizeUrl.searchParams.set("response_type", "code");
    authorizeUrl.searchParams.set("scope", "identify");
    authorizeUrl.searchParams.set("state", state);

    const response = NextResponse.redirect(authorizeUrl);
    response.cookies.set(DISCORD_STATE_COOKIE, state + "." + session.steamId, {
      httpOnly: true,
      secure: new URL(origin).protocol === "https:",
      sameSite: "lax",
      path: "/",
      maxAge: STEAM_STATE_MAX_AGE_SECONDS,
    });
    return response;
  } catch {
    return NextResponse.redirect(new URL("/discord-login?error=config", request.url));
  }
}