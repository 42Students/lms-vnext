/**
 * The platform's default locale and time zone, written once. Every formatter, day boundary and schedule calculation reads
 * these (directly or through src/lib/format-date.ts) so the product's calendar is changed in one place. A college-specific
 * zone is resolved through `timeZoneForCollege` in src/lib/clock.ts, which falls back to this default.
 */
export const DEFAULT_LOCALE = "en-IN";
export const DEFAULT_TIME_ZONE = "Asia/Kolkata";
