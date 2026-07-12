const WALL_CLOCK_DATE_TIME =
  /^(\d{4})-(\d{2})-(\d{2})[T\s](\d{2}):(\d{2})(?::(\d{2}))?/;

function toWallClockDate(value: string): Date | null {
  const match = WALL_CLOCK_DATE_TIME.exec(value);
  if (match) {
    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);
    const hour = Number(match[4]);
    const minute = Number(match[5]);
    const second = Number(match[6] ?? "0");

    return new Date(year, month - 1, day, hour, minute, second, 0);
  }

  const fallback = new Date(value);
  if (Number.isNaN(fallback.getTime())) {
    return null;
  }

  return fallback;
}

export function formatWallClockDateTime(
  value: string,
  options: Intl.DateTimeFormatOptions,
): string {
  const date = toWallClockDate(value);
  if (!date) {
    return value;
  }

  return new Intl.DateTimeFormat("fr-FR", options).format(date);
}
