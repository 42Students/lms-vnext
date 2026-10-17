/**
 * GR-18: classify PostgreSQL connectivity failures without printing
 * connection strings, SQL, or driver exception text to customers.
 * Usage: if (isDatabaseUnavailableError(error)) return apiErrorResponse(error);
 */
const DB_CONNECTION_CODES = new Set(["08000", "08001", "08003", "08006", "57P01", "57P03", "53300"]);
export function isDatabaseUnavailableError(error: unknown): boolean {
  let cause = error;
  for (let level = 0; level < 5; level++) {
    if (!cause || typeof cause !== "object") return false;
    const entry = cause as { code?: unknown; cause?: unknown };
    if (typeof entry.code === "string" && DB_CONNECTION_CODES.has(entry.code)) return true;
    cause = entry.cause;
  }
  return false;
}
