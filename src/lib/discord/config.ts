export function appOrigin(requestUrl: string): string {
  if (process.env.APP_URL) return new URL(process.env.APP_URL).origin;
  if (process.env.NODE_ENV === "production") throw new Error("APP_URL must be configured in production.");
  return new URL(requestUrl).origin;
}

export const DISCORD_STATE_MAX_AGE_SECONDS = 600;
