export const eventTypeLabels = {
  MOD: "Modern",
  WW2: "WW2",
  CW: "Cold War",
  TRN: "Training",
  SP: "Special Event",
  PVP: "PVP",
  OTHER: "Other",
} as const;

export type EventTypeCode = keyof typeof eventTypeLabels;

export function eventTypeLabel(type: string): string {
  return eventTypeLabels[type as EventTypeCode] ?? eventTypeLabels.OTHER;
}