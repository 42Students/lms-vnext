import { AppError } from "@/lib/error-registry";

/**
 * Optimistic concurrency, in one place. An editor loads a row with its version, edits, and sends the version back; the write
 * is refused with the same 409 VERSION_CONFLICT if someone else saved in between, so the person is told to refresh instead
 * of silently overwriting. Versions are compared as given (number, string or timestamp), never coerced.
 */
export type RowVersion = number | string | Date | null | undefined;

function same(a: RowVersion, b: RowVersion): boolean {
  if (a instanceof Date || b instanceof Date) {
    return a instanceof Date && b instanceof Date && a.getTime() === b.getTime();
  }
  return a !== null && a !== undefined && a === b;
}

export class VersionConflictError extends AppError {
  constructor(details?: Record<string, unknown>) {
    super("VERSION_CONFLICT", {
      status: 409,
      safeMessage: "This record changed since you opened it. Refresh and try again.",
      retryable: false,
      ...(details ? { details } : {}),
    });
    this.name = "VersionConflictError";
  }
}

export function versionMatches(current: RowVersion, expected: RowVersion): boolean {
  return same(current, expected);
}

/** Throws VersionConflictError unless the row's current version is exactly the one the editor started from. */
export function requireCurrentVersion(current: RowVersion, expected: RowVersion): void {
  if (!same(current, expected)) throw new VersionConflictError();
}
