import { withAdminSession } from "@/lib/auth/api-guard";
import { getPrisma } from "@/lib/db";
import { errorResponse } from "@/lib/errors/server";

export const POST = withAdminSession(async () => {
  const botUrl = process.env.DISCORD_BOT_SYNC_URL?.trim();
  const syncSecret = process.env.DISCORD_BOT_SYNC_SECRET?.trim();
  if (!botUrl || !syncSecret) return errorResponse("SERVICE_UNAVAILABLE");

  const response = await fetch(new URL("/internal/sync/roles", botUrl), {
    method: "POST",
    headers: { "x-discord-sync-secret": syncSecret, Accept: "application/json" },
    cache: "no-store",
    signal: AbortSignal.timeout(20_000),
  });
  if (!response.ok) return errorResponse("SERVICE_UNAVAILABLE");

  const result: unknown = await response.json();
  if (!result || typeof result !== "object" || !("syncedCount" in result)) return errorResponse("INVALID_RESPONSE");
  const roles = await getPrisma().discordRole.findMany({
    orderBy: { name: "asc" },
    select: { id: true, discordRoleId: true, name: true, iconPath: true, updatedAt: true },
  });
  return Response.json({ roles, syncedCount: result.syncedCount }, { headers: { "Cache-Control": "private, no-store" } });
});
