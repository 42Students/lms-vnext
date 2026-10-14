import { z } from "zod";

/** Preview is informational only: the POST service rechecks all authorization,
 * status, expiry and acceptance constraints transactionally. */
export const learnerAcceptancePreviewSchema = z.object({
  offerId: z.string().uuid(),
  companyName: z.string().min(1),
  roleTitle: z.string().min(1),
  jobTitle: z.string().min(1),
  annualCtcInr: z.number().int().nonnegative().nullable(),
  joiningDate: z.string().nullable(),
  expiresAt: z.string().datetime({ offset: true }).nullable(),
  status: z.enum(["ISSUED", "ACCEPTED", "DECLINED", "WITHDRAWN"]),
}).strict();

export function learnerOfferAcceptancePreview(raw: unknown, now: Date = new Date()) {
  const offer = learnerAcceptancePreviewSchema.parse(raw);
  const expiresAt = offer.expiresAt ? new Date(offer.expiresAt) : null;
  return {
    ...offer,
    expired: expiresAt !== null && now.getTime() > expiresAt.getTime(),
    canConfirm: offer.status === "ISSUED" &&
      (expiresAt === null || now.getTime() <= expiresAt.getTime()),
  };
}
