import { z } from "zod";

export const tpoDriveCancelImpactSchema = z
  .object({
    submittedApplications: z.number().int().nonnegative(),
    openRounds: z.number().int().nonnegative(),
    issuedOffers: z.number().int().nonnegative(),
    acceptedOffers: z.number().int().nonnegative(),
  })
  .strict();

export type TpoDriveCancelImpact = z.infer<typeof tpoDriveCancelImpactSchema>;

export const tpoDriveCancelSchema = z
  .object({
    action: z.literal("CANCEL"),
    confirmed: z.literal(true),
    expectedUpdatedAt: z.iso
      .datetime({ offset: true })
      .transform((value) => new Date(value).toISOString()),
    expectedImpact: tpoDriveCancelImpactSchema,
    reason: z.string().trim().min(10).max(1000),
  })
  .strict();

export type TpoDriveCancelDecision =
  | "ALLOW"
  | "READ_ONLY"
  | "BLOCKED_ACCEPTED_OFFERS"
  | "PREVIEW_STALE";

/**
 * Cancellation is the audited, stronger sibling of closure: the drive moves
 * to CLOSED and every still-open round is cancelled. Still-issued offers
 * are withdrawn atomically; accepted offers are retained and not revoked.
 */
export function evaluateTpoDriveCancellation(
  status: string,
  seasonStatus: string | null,
  current: TpoDriveCancelImpact,
  expected: TpoDriveCancelImpact,
): TpoDriveCancelDecision {
  if (status !== "PUBLISHED" || seasonStatus !== "ACTIVE") return "READ_ONLY";
  if (
    current.submittedApplications !== expected.submittedApplications ||
    current.openRounds !== expected.openRounds ||
    current.issuedOffers !== expected.issuedOffers ||
    current.acceptedOffers !== expected.acceptedOffers
  ) {
    return "PREVIEW_STALE";
  }
  // Keep previously accepted offers intact; cancel stops only pending ones.
  return "ALLOW";
}

/** P-S2-12: only unaccepted issued offers are revocable during cancellation. */
export function isIssuedOfferCancelable(status: string): boolean {
  return status === "ISSUED";
}
