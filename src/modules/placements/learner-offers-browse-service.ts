import "server-only";

import type { RequestContext } from "@/modules/identity/context";
import { requirePermission } from "@/modules/permissions/policy";
import { listOwnPlacementOffers } from "./offer-service";
import { requireLearnerPlacementAccess } from "./learner-participation-guard";
import {
  browseOwnLearnerOffers,
  learnerOfferViewSchema,
} from "./learner-offers-browse-model";

/**
 * Only the context's verified active learner membership is used to read
 * persisted offers. The selected view filters that already scoped result.
 */
export async function getOwnLearnerOfferBrowse(
  context: RequestContext,
  rawView: unknown = "all",
) {
  const view = learnerOfferViewSchema.parse(rawView);
  const membership = await requireLearnerPlacementAccess(context);
  requirePermission(context, "placements.read", {
    collegeId: membership.collegeId,
  });
  const rows = await listOwnPlacementOffers(context);
  return { view, ...browseOwnLearnerOffers(rows, view) };
}
