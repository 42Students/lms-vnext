const INDIA_OFFSET_MS = 5.5 * 60 * 60 * 1000;
const DATE_ONLY = /^(\d{4})-(\d{2})-(\d{2})$/;
const OFFSET_DATE_TIME = /^\d{4}-\d{2}-\d{2}T.+(?:Z|[+-]\d{2}:\d{2})$/;

export type ActivityDateBoundary = "from" | "to";

/**
 * Interpret date-only filters as the full Asia/Kolkata calendar day.
 * Offset-aware datetimes are preserved exactly. Ambiguous timezone-less
 * datetimes are rejected rather than depending on the server's timezone.
 */
export function parseActivityDateBoundary(
  value: unknown,
  boundary: ActivityDateBoundary,
): Date {
  if (value instanceof Date) {
    if (!Number.isFinite(value.getTime())) {
      throw new Error("ACTIVITY_DATE_INVALID");
    }
    return new Date(value.getTime());
  }
  if (typeof value !== "string") {
    throw new Error("ACTIVITY_DATE_INVALID");
  }

  const raw = value.trim();
  const match = DATE_ONLY.exec(raw);
  if (match) {
    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);
    const utcMidnight = Date.UTC(year, month - 1, day);
    const probe = new Date(utcMidnight);
    if (
      probe.getUTCFullYear() !== year ||
      probe.getUTCMonth() !== month - 1 ||
      probe.getUTCDate() !== day
    ) {
      throw new Error("ACTIVITY_DATE_INVALID");
    }

    const indiaStart = utcMidnight - INDIA_OFFSET_MS;
    return new Date(
      boundary === "from"
        ? indiaStart
        : indiaStart + 24 * 60 * 60 * 1000 - 1,
    );
  }

  if (!OFFSET_DATE_TIME.test(raw)) {
    throw new Error("ACTIVITY_DATE_INVALID");
  }
  const parsed = new Date(raw);
  if (!Number.isFinite(parsed.getTime())) {
    throw new Error("ACTIVITY_DATE_INVALID");
  }
  return parsed;
}
