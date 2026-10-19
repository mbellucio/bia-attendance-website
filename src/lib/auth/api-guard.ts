import { getSteamSession } from "./current-user";
import { errorResponse, handleApiError } from "@/lib/errors/server";
import { getPrisma } from "@/lib/db";

export type SteamSession = { steamId: string };
type Handler<Context> = (request: Request, context: Context, session: SteamSession) => Promise<Response>;

export function withSteamSession<Context = unknown>(handler: Handler<Context>) {
  return async (request: Request, context: Context): Promise<Response> => {
    try {
      const session = await getSteamSession();
      if (!session) return errorResponse("AUTH_REQUIRED");
      if (!session.discordLinked) return errorResponse("DISCORD_LINK_REQUIRED");
      return await handler(request, context, session);
    } catch (cause) {
      return handleApiError(cause);
    }
  };
}

export function withAdminSession<Context = unknown>(handler: Handler<Context>) {
  return withSteamSession<Context>(async (request, context, session) => {
    const user = await getPrisma().user.findUnique({
      where: { steamId: session.steamId },
      select: { admin: true },
    });
    if (!user?.admin) return errorResponse("FORBIDDEN");
    return handler(request, context, session);
  });
}
