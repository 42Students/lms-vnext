import "server-only";

import type { RequestContext } from "@/modules/identity/context";
import { getCollegeSetupChecklist } from "./college-setup-checklist-service";
import {
  collegeDashboardCardsProjection,
  collegeDashboardCardsQuerySchema,
} from "./college-dashboard-cards-model";

/** One authoritative registered-table count source. It already enforces
 * central can()/requirePermission() and own-college membership scope.
 * A database error rejects the entire response rather than fabricating 0. */
export async function getCollegeDashboardCards(
  context: RequestContext, rawQuery: unknown = {},
) {
  collegeDashboardCardsQuerySchema.parse(rawQuery);
  const result = await getCollegeSetupChecklist(context, {});
  return { setup: result, cards: collegeDashboardCardsProjection(result.counts) };
}
