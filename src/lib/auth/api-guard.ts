import { getSteamSession } from "./current-user";
import { errorResponse, handleApiError } from "@/lib/errors/server";

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
