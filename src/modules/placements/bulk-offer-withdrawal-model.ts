import { z } from "zod";

export const bulkOfferWithdrawalSchema = z.object({
  confirmed: z.literal(true),
  reason: z.string().trim().min(8).max(1000),
  offers: z.array(z.object({
    id: z.string().uuid(),
    expectedStatus: z.enum(["ISSUED", "ACCEPTED"]),
  }).strict()).min(1).max(50).refine(
    (items) => new Set(items.map((item) => item.id)).size === items.length,
    "Duplicate offers are not allowed",
  ),
}).strict();

export type BulkOfferWithdrawalResult = {
  offerId: string;
  status: "withdrawn" | "already-withdrawn" | "ineligible";
  reason?: string;
};

export function classifyBulkOfferWithdrawal(
  offerId: string,
  current: { status: string; joiningStatus: string | null } | null,
  expectedStatus: "ISSUED" | "ACCEPTED",
): BulkOfferWithdrawalResult {
  if (!current) {
    return { offerId, status: "ineligible", reason: "Offer is unavailable for this drive" };
  }
  if (current.status === "WITHDRAWN") {
    return { offerId, status: "already-withdrawn" };
  }
  if (current.status !== expectedStatus ||
    !["ISSUED", "ACCEPTED"].includes(current.status)) {
    return { offerId, status: "ineligible", reason: "Offer status changed; review it again" };
  }
  if (current.status === "ACCEPTED" &&
    current.joiningStatus !== null &&
    current.joiningStatus !== "PENDING") {
    return { offerId, status: "ineligible", reason: "Joining outcome is already recorded" };
  }
  return { offerId, status: "withdrawn" };
}

export function summarizeBulkOfferWithdrawal(rows: readonly BulkOfferWithdrawalResult[]) {
  return {
    withdrawn: rows.filter((row) => row.status === "withdrawn").length,
    alreadyWithdrawn: rows.filter((row) => row.status === "already-withdrawn").length,
    ineligible: rows.filter((row) => row.status === "ineligible").length,
  };
}
