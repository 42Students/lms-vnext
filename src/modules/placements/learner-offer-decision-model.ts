import { z } from "zod";
import { learnerOfferAcceptancePreview } from "./learner-offer-acceptance-preview";
export const learnerOfferDecisionDraftSchema = z.object({
  offerId:z.string().uuid(),
  action:z.enum(["ACCEPT","DECLINE"]),
  confirmed:z.literal(true),
  reason:z.string().trim().max(2000).nullable().optional(),
}).strict();

export function learnerOfferDecisionReady(
  rawOffer: Parameters<typeof learnerOfferAcceptancePreview>[0],
  rawDecision: unknown,
  now: Date = new Date(),
) {
  const decision = learnerOfferDecisionDraftSchema.parse(rawDecision);
  const preview = learnerOfferAcceptancePreview(rawOffer, now);
  return decision.offerId === preview.offerId && preview.canConfirm;
}
