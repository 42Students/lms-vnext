/**
 * GR-08: wrap route handlers and server actions at their boundary.
 * Usage: export const POST = withApiGuard(async (request: Request) => { ... });
 * For server actions, call guardServerAction(async () => { ... }) for a
 * serializable result; never propagate an unknown exception into the UI.
 */
import { apiErrorResponse } from "@/lib/api-error";
import { createRequestId } from "@/lib/request-id";
import { friendlyApiError } from "@/lib/friendly-error";
import { logError } from "@/observability/logger";

export function withApiGuard<Args extends unknown[]>(
  handler: (...args: Args) => Response | Promise<Response>,
): (...args: Args) => Promise<Response> {
  return async (...args: Args): Promise<Response> => {
    try {
      return await handler(...args);
    } catch (error: unknown) {
      return apiErrorResponse(error);
    }
  };
}

export type GuardedActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; message: string; requestId: string };

export async function guardServerAction<T>(action: () => Promise<T>): Promise<GuardedActionResult<T>> {
  try {
    return { ok: true, data: await action() };
  } catch (error: unknown) {
    const requestId = createRequestId();
    logError("action.unhandled_error", error, { requestId });
    return { ok: false, message: friendlyApiError({ status: 500 }), requestId };
  }
}
