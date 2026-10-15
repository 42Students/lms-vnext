import "server-only";
import { and, asc, eq, isNotNull, lte } from "drizzle-orm";
import { getDb } from "@/db/client";
import { placementOffers, placementOfferStatusHistory } from "@/db/schema";
import { isIssuedPlacementOfferDue } from "./placement-offer-sweep-policy";

/**
 * P-S1-07: transaction-bound batch primitive for the 15-minute expiry job.
 *
 * NOT INVOKED until the approved EXPIRED-status migration is registered.
 * The orchestration/scheduler and downstream application effects must be
 * installed by their owning lane after schema replay.
 */
export async function sweepExpiredPlacementOffers(
  actorUserId: string,
  now: Date,
  limit = 100,
): Promise<number> {
  if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
    throw new Error("Invalid offer sweep batch size");
  }
  return getDb().transaction(async (tx) => {
    const candidates = await tx.select({
      id: placementOffers.id,
      status: placementOffers.status,
      expiresAt: placementOffers.expiresAt,
    }).from(placementOffers).where(and(
      eq(placementOffers.status, "ISSUED"),
      isNotNull(placementOffers.expiresAt),
      lte(placementOffers.expiresAt, now),
    )).orderBy(asc(placementOffers.expiresAt), asc(placementOffers.id))
      .limit(limit).for("update");

    let expired = 0;
    for (const row of candidates) {
      if (!isIssuedPlacementOfferDue(row, now)) continue;
      const [updated] = await tx.update(placementOffers).set({
        status: "EXPIRED",
        updatedAt: now,
      }).where(and(
        eq(placementOffers.id, row.id),
        eq(placementOffers.status, "ISSUED"),
      )).returning({ id: placementOffers.id });
      if (!updated) continue;
      await tx.insert(placementOfferStatusHistory).values({
        offerId: row.id,
        fromStatus: "ISSUED",
        toStatus: "EXPIRED",
        actorUserId,
      });
      expired += 1;
    }
    return expired;
  });
}
