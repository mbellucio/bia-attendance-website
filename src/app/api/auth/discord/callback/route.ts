import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { getSteamSession } from "@/lib/auth/current-user";
import { createSessionToken, DISCORD_STATE_COOKIE, SESSION_COOKIE, SESSION_MAX_AGE_SECONDS } from "@/lib/auth/session";
import { getPrisma } from "@/lib/db";

const DISCORD_API = "https://discord.com/api/v10";
const DISCORD_ID_PATTERN = /^\d{17,20}$/;
type DiscordTokenResponse = { access_token?: string; token_type?: string };
type DiscordUserResponse = { id?: string };

function appOrigin(request: NextRequest): string {
  const configuredUrl = process.env.APP_URL;
  if (configuredUrl) return new URL(configuredUrl).origin;
  if (process.env.NODE_ENV === "production") throw new Error("APP_URL must be configured in production.");
  return request.nextUrl.origin;
}

function redirectToLogin(request: NextRequest, error: string) {
  const response = NextResponse.redirect(new URL("/discord-login?error=" + encodeURIComponent(error), request.nextUrl.origin));
  response.cookies.delete(DISCORD_STATE_COOKIE);
  return response;
}

export async function GET(request: NextRequest) {
  const session = await getSteamSession();
  if (!session) return NextResponse.redirect(new URL("/", request.url));

  const params = request.nextUrl.searchParams;
  const queryError = params.get("error");
  if (queryError === "access_denied") return redirectToLogin(request, "cancelled");
  if (queryError) return redirectToLogin(request, "unavailable");

  const state = params.get("state");
  const savedState = (await cookies()).get(DISCORD_STATE_COOKIE)?.value;
  const [expectedState, boundSteamId] = savedState?.split(".") ?? [];
  if (!state || !expectedState || state !== expectedState || boundSteamId !== session.steamId) return redirectToLogin(request, "state");

  const code = params.get("code");
  const clientId = process.env.DISCORD_CLIENT_ID;
  const clientSecret = process.env.DISCORD_CLIENT_SECRET;
  if (!code || !clientId || !clientSecret) return redirectToLogin(request, "config");

  try {
    const origin = appOrigin(request);
    const redirectUri = new URL("/api/auth/discord/callback", origin).toString();
    const tokenResponse = await fetch(DISCORD_API + "/oauth2/token", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: "authorization_code",
        code,
        redirect_uri: redirectUri,
      }),
      cache: "no-store",
      redirect: "error",
      signal: AbortSignal.timeout(10_000),
    });
    if (!tokenResponse.ok) return redirectToLogin(request, "invalid");
    const tokenData = await tokenResponse.json() as DiscordTokenResponse;
    if (!tokenData.access_token || tokenData.token_type?.toLowerCase() !== "bearer") {
      return redirectToLogin(request, "invalid");
    }

    const discordResponse = await fetch(DISCORD_API + "/users/@me", {
      headers: { authorization: "Bearer " + tokenData.access_token },
      cache: "no-store",
      redirect: "error",
      signal: AbortSignal.timeout(10_000),
    });
    if (!discordResponse.ok) return redirectToLogin(request, "invalid");
    const discordUser = await discordResponse.json() as DiscordUserResponse;
    if (!discordUser.id || !DISCORD_ID_PATTERN.test(discordUser.id)) {
      return redirectToLogin(request, "invalid");
    }

    const prisma = getPrisma();
    const user = await prisma.user.findUnique({
      where: { steamId: session.steamId },
      select: { id: true, discordUserId: true },
    });
    if (!user) return redirectToLogin(request, "account");

    if (user.discordUserId && user.discordUserId !== discordUser.id) {
      return redirectToLogin(request, "already_linked");
    }

    const existingOwner = await prisma.user.findUnique({
      where: { discordUserId: discordUser.id },
      select: { steamId: true },
    });
    if (existingOwner && existingOwner.steamId !== session.steamId) {
      return redirectToLogin(request, "already_linked");
    }

    if (!user.discordUserId) {
      await prisma.user.update({
        where: { steamId: session.steamId },
        data: { discordUserId: discordUser.id },
      });
    }

    let syncPending = false;
    const botUrl = process.env.DISCORD_BOT_SYNC_URL?.trim();
    const syncSecret = process.env.DISCORD_BOT_SYNC_SECRET?.trim();
    if (!botUrl || !syncSecret) {
      console.error("Discord account linked, but automatic role sync is not configured.");
      syncPending = true;
    } else {
      try {
        const syncResponse = await fetch(new URL("/internal/sync/member", botUrl), {
          method: "POST",
          headers: { "x-discord-sync-secret": syncSecret, "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify({ discordUserId: discordUser.id }),
          cache: "no-store",
          redirect: "error",
          signal: AbortSignal.timeout(20_000),
        });
        const syncResult = syncResponse.ok ? await syncResponse.json() as { syncedCount?: number } : null;
        if (syncResult?.syncedCount !== 1) {
          console.error(`Discord account linked, but the member was not synchronized (HTTP ${syncResponse.status}).`);
          syncPending = true;
        }
      } catch (cause) {
        console.error("Discord account linked, but automatic role sync failed.", cause);
        syncPending = true;
      }
    }
    const sessionToken = await createSessionToken(session.steamId, true);
    const dashboardUrl = new URL("/player-dashboard", origin);
    if (syncPending) dashboardUrl.searchParams.set("discordSync", "pending");
    const response = NextResponse.redirect(dashboardUrl);
    response.cookies.delete(DISCORD_STATE_COOKIE);
    response.cookies.set(SESSION_COOKIE, sessionToken, {
      httpOnly: true,
      secure: new URL(origin).protocol === "https:",
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_MAX_AGE_SECONDS,
    });
    return response;
  } catch {
    return redirectToLogin(request, "unavailable");
  }
}
