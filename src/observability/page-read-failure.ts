import { AuthorizationError } from "@/modules/permissions/policy";
import { logError } from "@/observability/logger";

type PageReadFailure = {
  /** A stable operational event name, never request-controlled. */
  event: string;
  /** Static Next.js route template; never a concrete URL or query string. */
  route: string;
  /** Fixed reader name so operations can identify the failing section. */
  stage: string;
};

/**
 * Log a recoverable page-read failure without revealing a user's query,
 * college ID, job ID or object identifier in structured metadata.
 *
 * Authorization failure is never recoverable by silently replacing the data
 * with an empty list/placeholder. Keep the existing framework permission
 * boundary so a denied reader cannot appear to be a successful empty page.
 */
export function reportPageReadFailure(
  context: PageReadFailure,
  error: unknown,
): void {
  if (error instanceof AuthorizationError) throw error;
  logError(context.event, error, {
    component: "page",
    route: context.route,
    stage: context.stage,
  });
}
