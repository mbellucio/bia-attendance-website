export type AttendanceRecord = {
  id: string;
  title: string;
  eventCode: string;
  eventType: string;
  game: string | null;
  eventDate: string;
  participants: {
    attendanceGranted: boolean;
    attendanceOverride: boolean | null;
    totalConnectedSeconds: number | null;
  }[];
};

export type AttendanceResponse = {
  user: {
    steamId: string;
    displayName: string | null;
    isAdmin: boolean;
    player: { nickname: string | null } | null;
  };
  events: AttendanceRecord[];
};

export type EventDetails = {
  player: { nickname: string | null };
  event: {
    title: string;
    eventCode: string;
    eventType: string;
    game: string | null;
    eventDate: string;
    minimumAttendanceMinutes: number | null;
  };
  attended: boolean;
  attendanceGranted: boolean;
  attendanceOverride: boolean | null;
  totalConnectedSeconds: number | null;
  sessions: {
    connectedAt: string;
    disconnectedAt: string | null;
    durationSeconds: number | null;
  }[];
};

export type SoldierFaction = "US" | "GERMANY" | "SOVIET_UNION";
export type ModelPreference = { faction: SoldierFaction; modelPath: string };
export type DashboardResponse = {
  steamId: string;
  isAdmin: boolean;
  name: string;
  nickname: string | null;
  rosterLinked: boolean;
  rank: { name: string; iconPath: string | null } | null;
  departments: { name: string; iconPath: string | null }[];
  ribbons: { name: string; iconPath: string | null }[];
  timeServed: { name: string; iconPath: string | null } | null;
  competences: { name: string; iconPath: string | null }[];
  selectedFaction: SoldierFaction;
  modelPath: string;
};
