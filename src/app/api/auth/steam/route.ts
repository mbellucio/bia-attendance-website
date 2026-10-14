import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { STEAM_STATE_COOKIE, STEAM_STATE_MAX_AGE_SECONDS } from "@/lib/auth/session";

const OPENID_ENDPOINT = "https://steamcommunity.com/openid/login";
const OPENID_NAMESPACE = "http://specs.openid.net/auth/2.0";

function appOrigin(request: NextRequest): string {
  const configuredUrl = process.env.APP_URL;

  if (configuredUrl) {
    return new URL(configuredUrl).origin;
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error("APP_URL must be configured in production.");
  }

  return request.nextUrl.origin;
}

export async function GET(request: NextRequest) {
  try {
    const origin = appOrigin(request);
    const state = randomBytes(32).toString("base64url");
    const returnTo = new URL("/api/auth/steam/callback", origin);
    returnTo.searchParams.set("state", state);

    const steamLogin = new URL(OPENID_ENDPOINT);
    steamLogin.searchParams.set("openid.ns", OPENID_NAMESPACE);
    steamLogin.searchParams.set("openid.mode", "checkid_setup");
    steamLogin.searchParams.set("openid.return_to", returnTo.toString());
    steamLogin.searchParams.set("openid.realm", origin + "/");
    steamLogin.searchParams.set("openid.identity", OPENID_NAMESPACE + "/identifier_select");
    steamLogin.searchParams.set("openid.claimed_id", OPENID_NAMESPACE + "/identifier_select");

    const response = NextResponse.redirect(steamLogin);
    response.cookies.set(STEAM_STATE_COOKIE, state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: STEAM_STATE_MAX_AGE_SECONDS,
    });
    return response;
  } catch {
    return NextResponse.redirect(new URL("/?error=config", request.nextUrl.origin));
  }
}
