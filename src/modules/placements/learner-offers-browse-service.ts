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

/** Bounded authorized history for compact callers. Pending offers are not
 * hidden by the age of the history: status filtering happens before slicing. */
export async function getOwnLearnerOfferBrowsePage(context:RequestContext,raw:{
 view?:unknown;page?:unknown;pageSize?:unknown;
}={}){
 const page=raw.page===undefined?1:Number(raw.page);
 const pageSize=raw.pageSize===undefined?15:Number(raw.pageSize);
 if(!Number.isSafeInteger(page)||page<1||page>10000||
    !Number.isSafeInteger(pageSize)||![10,15,25,50].includes(pageSize))
  throw new Error("INVALID_OFFER_PAGINATION");
 const result=await getOwnLearnerOfferBrowse(context,raw.view??"all");
 const total=result.items.length,pages=Math.max(1,Math.ceil(total/pageSize));
 const current=Math.min(page,pages);
 return {...result,items:result.items.slice((current-1)*pageSize,current*pageSize),
  total,page:current,pages,pageSize,hasMore:current<pages};
}
