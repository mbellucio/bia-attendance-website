import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createSessionToken, SESSION_COOKIE, SESSION_MAX_AGE_SECONDS, STEAM_STATE_COOKIE } from "@/lib/auth/session";
import { getPrisma } from "@/lib/db";

const OPENID_ENDPOINT = "https://steamcommunity.com/openid/login";
const OPENID_NAMESPACE = "http://specs.openid.net/auth/2.0";
const STEAM_ID_PATTERN = /^https?:\/\/steamcommunity\.com\/openid\/id\/(\d{17})$/;
const SIGNED_FIELDS_REQUIRED = ["op_endpoint", "claimed_id", "identity", "return_to", "response_nonce"];

function appOrigin(request: NextRequest): string {
  const configuredUrl = process.env.APP_URL;

  if (configuredUrl) return new URL(configuredUrl).origin;
  if (process.env.NODE_ENV === "production") throw new Error("APP_URL is not configured.");
  return request.nextUrl.origin;
}

function redirectToError(request: NextRequest, error: string) {
  const destination = new URL("/", request.nextUrl.origin);
  destination.searchParams.set("error", error);
  const response = NextResponse.redirect(destination);
  response.cookies.delete(STEAM_STATE_COOKIE);
  return response;
}

export async function GET(request: NextRequest) {
  const cookieStore = await cookies();
  const savedState = cookieStore.get(STEAM_STATE_COOKIE)?.value;
  const receivedState = request.nextUrl.searchParams.get("state");

  if (!savedState || !receivedState || savedState !== receivedState) {
    return redirectToError(request, "state");
  }

  const params = request.nextUrl.searchParams;
  const mode = params.get("openid.mode");
  if (mode === "cancel") return redirectToError(request, "cancelled");

  try {
    const origin = appOrigin(request);
    const expectedReturnTo = new URL("/api/auth/steam/callback", origin);
    expectedReturnTo.searchParams.set("state", savedState);

    if (
      params.get("openid.ns") !== OPENID_NAMESPACE ||
      mode !== "id_res" ||
      params.get("openid.op_endpoint") !== OPENID_ENDPOINT ||
      params.get("openid.return_to") !== expectedReturnTo.toString()
    ) {
      return redirectToError(request, "invalid");
    }

    const claimedId = params.get("openid.claimed_id");
    const identity = params.get("openid.identity");
    const claimedMatch = claimedId?.match(STEAM_ID_PATTERN);
    const identityMatch = identity?.match(STEAM_ID_PATTERN);

    if (!claimedMatch || !identityMatch || claimedMatch[1] !== identityMatch[1]) {
      return redirectToError(request, "invalid");
    }

    const signedFields = params.get("openid.signed")?.split(",") ?? [];
    if (SIGNED_FIELDS_REQUIRED.some((field) => !signedFields.includes(field))) {
      return redirectToError(request, "invalid");
    }

    const verification = new URLSearchParams();
    for (const [key, value] of params.entries()) {
      if (key.startsWith("openid.")) verification.append(key, value);
    }
    verification.set("openid.mode", "check_authentication");

    const steamResponse = await fetch(OPENID_ENDPOINT, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: verification,
      cache: "no-store",
      redirect: "error",
      signal: AbortSignal.timeout(10_000),
    });
    const verificationBody = await steamResponse.text();
    const validAssertion = /(?:^|\r?\n)is_valid:true(?:\r?\n|$)/.test(verificationBody);

    if (!steamResponse.ok || !validAssertion) {
      return redirectToError(request, "invalid");
    }

    const steamId = claimedMatch[1];

    if (process.env.DATABASE_URL) {
      try {
        const prisma = getPrisma();
        const user = await prisma.user.upsert({
          where: { steamId },
          update: { profileUrl: "https://steamcommunity.com/profiles/" + steamId },
          create: {
            steamId,
            profileUrl: "https://steamcommunity.com/profiles/" + steamId,
          },
        });
        await prisma.player.upsert({
          where: { userId: user.id },
          update: {},
          create: { userId: user.id },
        });
      } catch {
        console.error("Steam sign-in could not save the user record. Check the database connection and migration.");
        return redirectToError(request, "database");
      }
    }

    const token = await createSessionToken(steamId);
    const response = NextResponse.redirect(new URL("/profile", origin));
    response.cookies.delete(STEAM_STATE_COOKIE);
    response.cookies.set(SESSION_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_MAX_AGE_SECONDS,
    });
    return response;
  } catch {
    return redirectToError(request, "unavailable");
  }
}


