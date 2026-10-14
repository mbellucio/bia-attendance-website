import { SignJWT, jwtVerify } from "jose";

export const SESSION_COOKIE = "bia_attendance_session";
export const STEAM_STATE_COOKIE = "bia_steam_state";
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 14;
export const STEAM_STATE_MAX_AGE_SECONDS = 60 * 10;

function signingKey(): Uint8Array {
  const secret = process.env.AUTH_SECRET;

  if (!secret || new TextEncoder().encode(secret).length < 32) {
    throw new Error("AUTH_SECRET must contain at least 32 characters.");
  }

  return new TextEncoder().encode(secret);
}

export async function createSessionToken(steamId: string): Promise<string> {
  return new SignJWT({ steamId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("14d")
    .sign(signingKey());
}

export async function readSessionToken(token: string): Promise<{ steamId: string } | null> {
  try {
    const { payload } = await jwtVerify(token, signingKey(), {
      algorithms: ["HS256"],
    });

    if (typeof payload.steamId !== "string" || !/^\d{5,20}$/.test(payload.steamId)) {
      return null;
    }

    return { steamId: payload.steamId };
  } catch {
    return null;
  }
}
