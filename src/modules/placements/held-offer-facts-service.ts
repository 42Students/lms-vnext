import { and, eq, inArray, isNull, or } from "drizzle-orm";
import { getDb } from "@/db/client";
import {
  placementApplications, placementJobs, placementOffers,
} from "@/db/schema";
import { placementExternalOffers } from "@/db/schema/placement-external";
import type { HeldPlacementOffer } from "./held-offer-policy";

type Client = ReturnType<typeof getDb>;
type Tx = Parameters<Parameters<Client["transaction"]>[0]>[0];

/**
 * P-S1-05 / T-S1-04: PG NUMERIC(10,2) in lakh -> integral INR.
 * Parse decimal text directly; floating point must not round a CTC uplift.
 * Unbounded or malformed amounts remain unknown (fail closed at capacity).
 */
export function verifiedExternalCtcInr(ctcLpa: string | null): number | null {
  if (ctcLpa === null || !/^(?:0|[1-9]\d*)(?:\.\d{1,2})?$/.test(ctcLpa)) {
    return null;
  }
  const [whole, decimal = ""] = ctcLpa.split(".");
  const rupees = BigInt(whole!) * 100_000n +
    BigInt(decimal.padEnd(2, "0")) * 1_000n;
  return rupees <= BigInt(Number.MAX_SAFE_INTEGER) ? Number(rupees) : null;
}

/**
 * A VERIFIED off-campus offer counts as held even though there is no
 * synthetic application or campus offer. SUBMITTED/REJECTED/REVOKED do not.
 * All reads are scoped by both membership AND college.
 */
export async function loadPlacementHeldOfferFacts(
  collegeId: string,
  membershipId: string,
  db: Client | Tx = getDb(),
): Promise<HeldPlacementOffer[]> {
  const internal = await db.select({
    kind: placementOffers.kind,
    status: placementOffers.status,
    annualCtcInr: placementOffers.annualCtcInr,
  }).from(placementOffers)
    .innerJoin(placementApplications,
      eq(placementApplications.id, placementOffers.applicationId))
    .innerJoin(placementJobs,
      eq(placementJobs.id, placementApplications.jobId))
    .where(and(
      eq(placementJobs.collegeId, collegeId),
      // An unaudited NULL policy cannot waive a learner's held-offer cap.
      // Only an explicit reviewed FALSE excludes this campus offer.
      or(eq(placementJobs.countsAsPlaced, true),
         isNull(placementJobs.countsAsPlaced)),
      eq(placementApplications.membershipId, membershipId),
      eq(placementOffers.kind, "OFFER"),
      inArray(placementOffers.status, ["ISSUED", "ACCEPTED"]),
    ));

  // DB08-C is registered (migration 0094). Unexpected SQL failures must fail
  // the transaction rather than weaken the held-offer gate.
  const external = await db.select({
    ctcLpa: placementExternalOffers.ctcLpa,
  }).from(placementExternalOffers).where(and(
    eq(placementExternalOffers.collegeId, collegeId),
    eq(placementExternalOffers.membershipId, membershipId),
    eq(placementExternalOffers.status, "VERIFIED"),
  ));

  return [
    ...internal,
    ...external.map((row) => ({
      kind: "OFFER",
      status: "ACCEPTED",
      annualCtcInr: verifiedExternalCtcInr(row.ctcLpa),
    })),
  ];
}
