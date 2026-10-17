/**
 * GR-55: best-effort job isolation so a scheduled task cannot leak
 * provider exceptions to a customer request.
 * Usage: await runBackgroundJob("email.delivery", () => deliver(), {
 *   idempotent: true, maxAttempts: 3,
 * }); // Returns a result, never a thrown background exception.
 */
import { createRequestId } from "@/lib/request-id";
import { logError, logInfo } from "@/observability/logger";

export type BackgroundJobResult<T> =
  | { ok: true; data: T; requestId: string }
  | { ok: false; requestId: string };

export async function runBackgroundJob<T>(
  name: string,
  operation: () => Promise<T>,
  options: { idempotent?: boolean; maxAttempts?: number; delayMs?: number } = {},
): Promise<BackgroundJobResult<T>> {
  const requestId = createRequestId();
  const attempts = options.idempotent
    ? Math.max(1, Math.min(5, options.maxAttempts ?? 3)) : 1;
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      const data = await operation();
      logInfo("job.completed", { requestId, name, attempt });
      return { ok: true, data, requestId };
    } catch (error: unknown) {
      logError("job.failed", error, { requestId, name, attempt });
      if (attempt === attempts) return { ok: false, requestId };
      const backoff = Math.min(4_000, (options.delayMs ?? 100) * 2 ** (attempt - 1));
      await new Promise<void>((resolve) => setTimeout(resolve, backoff));
    }
  }
  return { ok: false, requestId };
}
