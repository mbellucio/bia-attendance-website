import { withSteamSession } from "@/lib/auth/api-guard";
import { errorResponse } from "@/lib/errors/server";
import { getPrisma } from "@/lib/db";

const modelPaths = {
  US: "/models/ww2/us-rifleman.glb",
  GERMANY: "/models/ww2/german-rifleman.glb",
  SOVIET_UNION: "/models/ww2/soviet-rifleman.glb",
} as const;
type Faction = keyof typeof modelPaths;

export const PUT = withSteamSession(async (request, _context, session) => {
  let body: unknown;
  try { body = await request.json(); } catch { return errorResponse("INVALID_REQUEST"); }
  if (!body || typeof body !== "object" || !("faction" in body)) {
    return errorResponse("INVALID_FACTION");
  }
  const faction = (body as { faction?: unknown }).faction;
  if (typeof faction !== "string" || !Object.hasOwn(modelPaths, faction)) {
    return errorResponse("INVALID_FACTION");
  }

  const selectedFaction = faction as Faction;
  const prisma = getPrisma();
  const user = await prisma.user.findUnique({ where: { steamId: session.steamId }, select: { id: true } });
  if (!user) return errorResponse("ACCOUNT_NOT_FOUND");

  const preference = await prisma.userModelPreference.upsert({
    where: { userId: user.id },
    create: { userId: user.id, faction: selectedFaction, modelPath: modelPaths[selectedFaction] },
    update: { faction: selectedFaction, modelPath: modelPaths[selectedFaction] },
    select: { faction: true, modelPath: true },
  });
  return Response.json(preference, { headers: { "Cache-Control": "private, no-store" } });
});
