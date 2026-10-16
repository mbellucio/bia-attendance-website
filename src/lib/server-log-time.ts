const HOUR_MS = 60 * 60 * 1000;

/**
 * Postgres `timestamp without time zone` values are parsed by pg as Dates in
 * the Node process timezone. Re-encode their local fields as a UTC-shaped
 * value so the original server-log clock survives JSON serialization.
 */
export function serializeServerClock(value: Date): string {
  return new Date(Date.UTC(
    value.getFullYear(),
    value.getMonth(),
    value.getDate(),
    value.getHours(),
    value.getMinutes(),
    value.getSeconds(),
  )).toISOString();
}

/** Keep a database DATE's calendar fields stable across host timezones. */
export function serializeDatabaseDate(value: Date): string {
  return new Date(Date.UTC(value.getFullYear(), value.getMonth(), value.getDate())).toISOString();
}

function lastSunday(year: number, month: number): number {
  const lastDay = new Date(Date.UTC(year, month + 1, 0));
  return lastDay.getUTCDate() - lastDay.getUTCDay();
}

function serverOffsetHours(serverClock: Date): number {
  const year = serverClock.getUTCFullYear();
  const month = serverClock.getUTCMonth();
  const day = serverClock.getUTCDate();
  const hour = serverClock.getUTCHours();
  const startDay = lastSunday(year, 2);
  const endDay = lastSunday(year, 9);

  const afterSummerTimeStarts = month > 2 || (month === 2 && (day > startDay || (day === startDay && hour >= 4)));
  const beforeSummerTimeEnds = month < 9 || (month === 9 && (day < endDay || (day === endDay && hour < 4)));

  return afterSummerTimeStarts && beforeSummerTimeEnds ? 3 : 2;
}

/** Convert a UTC-shaped server-clock value to its GMT instant for display. */
export function serverClockToGmt(serverClock: Date): Date {
  return new Date(serverClock.getTime() - serverOffsetHours(serverClock) * HOUR_MS);
}

/** Convert a timestamp serialized by serializeServerClock to its GMT instant. */
export function serializedServerClockToGmt(value: string): Date {
  return serverClockToGmt(new Date(value));
}

const gmtDateTime = new Intl.DateTimeFormat("en", {
  day: "2-digit",
  month: "long",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hourCycle: "h23",
  timeZone: "UTC",
});

export function formatServerClockAsGmt(value: Date): string {
  return gmtDateTime.format(serverClockToGmt(new Date(serializeServerClock(value))));
}

export function formatSerializedServerClockAsGmt(value: string): string {
  return gmtDateTime.format(serializedServerClockToGmt(value));
}
