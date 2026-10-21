import { withAdminSession } from "@/lib/auth/api-guard";
import { getPrisma } from "@/lib/db";
import { errorResponse } from "@/lib/errors/server";
import { synchronizeDiscordRoles } from "@/lib/discord/sync";

export const POST = withAdminSession(async () => {
  try {
    const syncedCount = await synchronizeDiscordRoles();
    const roles = await getPrisma().discordRole.findMany({
      orderBy: { name: "asc" },
      select: { id: true, discordRoleId: true, name: true, iconPath: true, updatedAt: true },
    });
    return Response.json({ roles, syncedCount }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (cause) {
    console.error("Discord role synchronization failed.", cause);
    return errorResponse("SERVICE_UNAVAILABLE");
  }
});
