export const endpoints = {
  auth: { steam: "/api/auth/steam", discord: "/api/auth/discord" },
  player: {
    dashboard: "/api/player/dashboard",
    attendance: "/api/player/attendance",
    event: (eventId: string) => `/api/player/events/${encodeURIComponent(eventId)}`,
  },
  user: { modelPreference: "/api/user/model-preference" },
} as const;
