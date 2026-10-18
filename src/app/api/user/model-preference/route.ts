import { getSteamSession } from "@/lib/auth/current-user";
import { getPrisma } from "@/lib/db";

const modelPaths = {
  US: "/models/ww2/us-rifleman.glb",
  GERMANY: "/models/ww2/german-rifleman.glb",
  SOVIET_UNION: "/models/ww2/soviet-rifleman.glb",
} as const;
type Faction = keyof typeof modelPaths;

export async function PUT(request: Request) {
  const session = await getSteamSession();
  if (!session) return Response.json({ error: "Sign in to update your preference." }, { status: 401 });

  let body: unknown;
  try { body = await request.json(); } catch { return Response.json({ error: "Invalid request body." }, { status: 400 }); }
  if (!body || typeof body !== "object" || !("faction" in body)) {
    return Response.json({ error: "Choose a valid faction." }, { status: 400 });
  }
  const faction = (body as { faction?: unknown }).faction;
  if (typeof faction !== "string" || !Object.hasOwn(modelPaths, faction)) {
    return Response.json({ error: "Choose a valid faction." }, { status: 400 });
  }

  const selectedFaction = faction as Faction;
  const prisma = getPrisma();
  const user = await prisma.user.findUnique({ where: { steamId: session.steamId }, select: { id: true } });
  if (!user) return Response.json({ error: "Account not found." }, { status: 404 });

  const preference = await prisma.userModelPreference.upsert({
    where: { userId: user.id },
    create: { userId: user.id, faction: selectedFaction, modelPath: modelPaths[selectedFaction] },
    update: { faction: selectedFaction, modelPath: modelPaths[selectedFaction] },
    select: { faction: true, modelPath: true },
  });
  return Response.json(preference, { headers: { "Cache-Control": "private, no-store" } });
}