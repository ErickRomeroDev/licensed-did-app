const MS_PER_DAY = 86_400_000;

/** Days since the Unix epoch for a calendar date (UTC). */
export const isoDateToDays = (iso: string): number => {
  const ms = Date.parse(`${iso}T00:00:00Z`);
  if (Number.isNaN(ms)) throw new Error(`Invalid date: ${iso}`);
  return Math.floor(ms / MS_PER_DAY);
};

export const daysToIsoDate = (days: number | bigint): string =>
  new Date(Number(days) * MS_PER_DAY).toISOString().slice(0, 10);

export const todayDays = (): number => Math.floor(Date.now() / MS_PER_DAY);
