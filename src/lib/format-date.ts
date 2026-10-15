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

export function formatDateTimeIst(value: string | number | Date): string {
  return dateTimeFormat.format(new Date(value));
}

export function formatDateIst(value: string | number | Date): string {
  return dateFormat.format(new Date(value));
}
