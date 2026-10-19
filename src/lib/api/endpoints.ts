export const endpoints = {
  auth: { steam: "/api/auth/steam", discord: "/api/auth/discord" },
  player: {
    dashboard: "/api/player/dashboard",
    attendance: "/api/player/attendance",
    event: (eventId: string) => `/api/player/events/${encodeURIComponent(eventId)}`,
  },
  user: { modelPreference: "/api/user/model-preference" },
  admin: {
    discordRoles: "/api/admin/discord-roles",
    syncDiscordRoles: "/api/admin/discord-roles/sync",
    mapDiscordRole: "/api/admin/discord-roles/mapping",
    deleteDiscordRole: (roleId: string) => `/api/admin/discord-roles?roleId=${encodeURIComponent(roleId)}`,
  },
} as const;