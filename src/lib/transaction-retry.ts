/**
 * GR-52: call inside a DB service boundary to retry a complete transaction:
 * await withTransactionRetry(() => db.transaction(async (tx) => { ... }));
 * Only serialization, deadlock and connection errors are retried.
 * Constraint violations and all other business errors fail immediately.
 */
import { logInfo } from "@/observability/logger";
import { createRequestId } from "@/lib/request-id";

const TRANSIENT_CODES = new Set(["40001", "40P01", "08000", "08003", "08006", "08001", "57P01"]);
export function isRetryableTransactionError(error: unknown): boolean {
  let current: unknown = error;
  for (let depth = 0; depth < 4; depth++) {
    if (!current || typeof current !== "object") return false;
    const value = current as { code?: unknown; cause?: unknown };
    if (typeof value.code === "string") {
      if (value.code.startsWith("23")) return false;
      if (TRANSIENT_CODES.has(value.code)) return true;
    }
    current = value.cause;
  }
  return false;
}
export async function withTransactionRetry<T>(
  operation: () => Promise<T>,
  options: { maxAttempts?: number; baseDelayMs?: number } = {},
): Promise<T> {
  const attempts = Math.min(5, Math.max(1, options.maxAttempts ?? 3));
  const delayMs = Math.max(0, options.baseDelayMs ?? 75);
  const requestId = createRequestId();
  for (let attempt = 1; ; attempt++) {
    try { return await operation(); }
    catch (error: unknown) {
      if (attempt >= attempts || !isRetryableTransactionError(error)) throw error;
      logInfo("db.transaction.retry", { requestId, attempt });
      await new Promise<void>((resolve) =>
        setTimeout(resolve, Math.min(1_000, delayMs * 2 ** (attempt - 1))));
    }
  }
}
