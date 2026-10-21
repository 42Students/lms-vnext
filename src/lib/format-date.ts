/**
 * Deterministic date formatting for components rendered on both server and
 * client. Runtime-default locale/timezone differ between Node and the browser
 * and cause hydration mismatches, so locale, hour cycle and timezone are fixed.
 */
const LOCALE = "en-IN";
const TIME_ZONE = "Asia/Kolkata";

const dateTimeFormat = new Intl.DateTimeFormat(LOCALE, {
  dateStyle: "medium",
  timeStyle: "short",
  hour12: true,
  timeZone: TIME_ZONE,
});

const dateFormat = new Intl.DateTimeFormat(LOCALE, {
  dateStyle: "medium",
  timeZone: TIME_ZONE,
});

const INVALID_DATE_LABEL = "—";
type DateInput = string | number | Date | null | undefined;

/** Safe on server and browser: invalid API fields never crash a whole table. */
function validDate(value: DateInput): Date | null {
  if (value === null || value === undefined || value === "") return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isFinite(date.getTime()) ? date : null;
}

export function formatDateTimeIst(value: DateInput): string {
  const date = validDate(value);
  return date ? dateTimeFormat.format(date) : INVALID_DATE_LABEL;
}

export function formatDateIst(value: DateInput): string {
  const date = validDate(value);
  return date ? dateFormat.format(date) : INVALID_DATE_LABEL;
}

const IST_OFFSET_MILLISECONDS = 330 * 60 * 1000;
const DAY_MILLISECONDS = 24 * 60 * 60 * 1000;

/** Inclusive IST calendar dates become a UTC half-open interval.
 * Example: 2026-10-22 selects 2026-10-21T18:30Z through, but not including,
 * 2026-10-22T18:30Z. Use >= startsAt and < endsBefore in SQL filters.
 */
export function istInclusiveDateWindow(
  startDay: string, endDay: string,
): { startsAt: Date; endsBefore: Date } | null {
  const dayStartUtc = (day: string): number | null => {
    if (!/^\\d{4}-\\d{2}-\\d{2}$/.test(day)) return null;
    const timestamp = Date.parse(day + "T00:00:00.000Z");
    if (!Number.isFinite(timestamp)) return null;
    return new Date(timestamp).toISOString().slice(0, 10) === day
      ? timestamp : null;
  };
  const start = dayStartUtc(startDay);
  const end = dayStartUtc(endDay);
  if (start === null || end === null || end < start) return null;
  return {
    startsAt: new Date(start - IST_OFFSET_MILLISECONDS),
    endsBefore: new Date(end + DAY_MILLISECONDS - IST_OFFSET_MILLISECONDS),
  };
}
