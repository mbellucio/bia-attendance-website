import { cookies } from "next/headers";
import { readSessionToken, SESSION_COOKIE } from "@/lib/auth/session";

export async function getSteamSession(): Promise<{ steamId: string; discordLinked: boolean } | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return readSessionToken(token);
}
