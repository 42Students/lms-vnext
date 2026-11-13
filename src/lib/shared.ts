/**
 * Small helpers that were copied into dozens of files. One definition each, tested once (tests/unit/sec-shared-utils.test.ts).
 * Anything that differs in meaning between its old copies is NOT here: it keeps its own name until the behaviour is decided.
 */

/** Next.js search params arrive as string | string[]; routes want the first value. */
export function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

const PG_UNIQUE_VIOLATION = "23505";

/** True when a PostgreSQL unique violation is the error or sits anywhere in its cause chain (drivers and ORMs wrap it). */
export function isUniqueViolation(error: unknown): boolean {
  const seen = new Set<unknown>();
  let cursor: unknown = error;
  for (let depth = 0; depth < 6; depth++) {
    if (!cursor || typeof cursor !== "object" || seen.has(cursor)) return false;
    seen.add(cursor);
    const value = cursor as { code?: unknown; cause?: unknown };
    if (value.code === PG_UNIQUE_VIOLATION) return true;
    cursor = value.cause;
  }
  return false;
}

/** "PENDING_REVIEW" -> "Pending Review": the label every status/enum chip used to build for itself. */
export function humanize(value: string): string {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
