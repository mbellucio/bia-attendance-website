import { redirect } from "next/navigation";
import { getSteamSession } from "@/lib/auth/current-user";
import { getPrisma } from "@/lib/db";

export async function requireAdminPage() {
  const session = await getSteamSession();
  if (!session) redirect("/");
  if (!session.discordLinked) redirect("/discord-login");
  const user = await getPrisma().user.findUnique({ where: { steamId: session.steamId }, select: { admin: true } });
  if (!user?.admin) redirect("/player-dashboard");
}
