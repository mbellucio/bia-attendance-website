import { withAdminSession } from "@/lib/auth/api-guard";
import { errorResponse } from "@/lib/errors/server";
import { synchronizeDiscordMembers } from "@/lib/discord/sync";

export const maxDuration = 300;

export const POST = withAdminSession(async () => {
  try {
    const result = await synchronizeDiscordMembers();
    return Response.json(result, { headers: { "Cache-Control": "private, no-store" } });
  } catch (cause) {
    console.error("Discord member synchronization failed.", cause);
    return errorResponse("SERVICE_UNAVAILABLE");
  }
});
