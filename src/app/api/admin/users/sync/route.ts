import { withAdminSession } from "@/lib/auth/api-guard";
import { errorResponse } from "@/lib/errors/server";

export const maxDuration = 300;

export const POST = withAdminSession(async () => {
  const botUrl = process.env.DISCORD_BOT_SYNC_URL?.trim();
  const syncSecret = process.env.DISCORD_BOT_SYNC_SECRET?.trim();
  if (!botUrl || !syncSecret) {
    console.error("User sync is unavailable: bot sync URL or shared secret is not configured.");
    return errorResponse("SERVICE_UNAVAILABLE");
  }

  let response: Response;
  try {
    response = await fetch(new URL("/internal/sync/members", botUrl), {
      method: "POST",
      headers: { "x-discord-sync-secret": syncSecret, Accept: "application/json" },
      cache: "no-store",
      signal: AbortSignal.timeout(240_000),
    });
  } catch (cause) {
    console.error("User sync could not reach the Discord bot service.", cause);
    return errorResponse("SERVICE_UNAVAILABLE");
  }

  if (!response.ok) {
    console.error(`User sync bot service returned HTTP ${response.status}.`);
    return errorResponse("SERVICE_UNAVAILABLE");
  }

  let result: unknown;
  try {
    result = await response.json();
  } catch (cause) {
    console.error("User sync bot service returned invalid JSON.", cause);
    return errorResponse("INVALID_RESPONSE");
  }
  if (!result || typeof result !== "object" || !("syncedCount" in result) || !("skippedCount" in result)) return errorResponse("INVALID_RESPONSE");
  return Response.json(result, { headers: { "Cache-Control": "private, no-store" } });
});
