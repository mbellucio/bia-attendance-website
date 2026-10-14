"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE, STEAM_STATE_COOKIE } from "@/lib/auth/session";

export async function signOut() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
  cookieStore.delete(STEAM_STATE_COOKIE);
  redirect("/");
}
