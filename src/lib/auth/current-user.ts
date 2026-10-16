import { cookies } from "next/headers";
import { readSessionToken, SESSION_COOKIE } from "@/lib/auth/session";

export async function getSteamSession(): Promise<{ steamId: string; discordId?: string } | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  return token ? readSessionToken(token) : null;
}
