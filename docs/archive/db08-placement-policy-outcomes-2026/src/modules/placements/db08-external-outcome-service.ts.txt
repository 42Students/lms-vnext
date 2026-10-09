import { and, eq, isNull } from "drizzle-orm";
import { getDb } from "@/db/client";
import {
  collegeMemberships,
  membershipRoles,
  placementApplications,
  placementExternalOutcomes,
  placementJobs,
  placementOffers,
} from "@/db/schema";
import type { RequestContext } from "@/modules/identity/context";
import { PlacementsServiceError } from "./errors";
import { requirePlacementManageScope } from "./scope";
import {
  placementExternalOutcomeInputSchema,
  placementExternalOutcomeRevokeSchema,
} from "./db08-lifecycle-validation";

/**
 * Evidence paths are private object keys, NOT URLs or shared download links.
 * DB04's final receipt/access-control service must verify the object exists
 * and belongs to the learner before public API integration.
 */
function assertPrivatePlacementEvidencePath(
  collegeId: string,
  path: string | null | undefined,
) {
  if (!path) return;
  const prefix = `colleges/${collegeId}/private/placement-offers/`;
  if (
    !path.startsWith(prefix) ||
    path.includes("..") ||
    path.includes("\\") ||
    path.includes("?") ||
    path.includes("#")
  ) {
    throw new PlacementsServiceError(
      "PLACEMENT_EXTERNAL_PRIVATE_EVIDENCE_REQUIRED",
    );
  }
}

async function assertLearnerScope(
  collegeId: string,
  membershipId: string,
) {
  const [learner] = await getDb()
    .select({ id: collegeMemberships.id })
    .from(collegeMemberships)
    .innerJoin(
      membershipRoles,
      eq(membershipRoles.membershipId, collegeMemberships.id),
    )
    .where(and(
      eq(collegeMemberships.id, membershipId),
      eq(collegeMemberships.collegeId, collegeId),
      eq(membershipRoles.role, "LEARNER"),
    ))
    .limit(1);
  if (!learner) {
    throw new PlacementsServiceError("PLACEMENT_EXTERNAL_SCOPE_MISMATCH");
  }
}

export async function verifyPlacementExternalOutcome(
  context: RequestContext,
  rawInput: unknown,
) {
  const input = placementExternalOutcomeInputSchema.parse(rawInput);
  await requirePlacementManageScope(context, input.collegeId);
  assertPrivatePlacementEvidencePath(input.collegeId, input.letterObjectPath);
  await assertLearnerScope(input.collegeId, input.membershipId);

  // vNext placement_learner_requests only supports application withdrawal,
  // round reschedule and offer extension. It does NOT yet represent legacy
  // EXTERNAL_OFFER requests. Do not associate unrelated request IDs.
  if (input.requestId) {
    throw new PlacementsServiceError(
      "PLACEMENT_EXTERNAL_REQUEST_NOT_SUPPORTED",
    );
  }

  const [row] = await getDb().insert(placementExternalOutcomes)
    .values({
      collegeId: input.collegeId,
      membershipId: input.membershipId,
      companyName: input.companyName,
      annualCtcInr: input.annualCtcInr ?? null,
      letterObjectPath: input.letterObjectPath ?? null,
      verifiedByUserId: context.user.id,
    })
    .returning();
  return row;
}

export async function revokePlacementExternalOutcome(
  context: RequestContext,
  rawInput: unknown,
) {
  const input = placementExternalOutcomeRevokeSchema.parse(rawInput);
  await requirePlacementManageScope(context, input.collegeId);
  return getDb().transaction(async (tx) => {
    const [outcome] = await tx.select().from(placementExternalOutcomes)
      .where(and(
        eq(placementExternalOutcomes.id, input.outcomeId),
        eq(placementExternalOutcomes.collegeId, input.collegeId),
      ))
      .for("update")
      .limit(1);
    if (!outcome) {
      throw new PlacementsServiceError("PLACEMENT_EXTERNAL_NOT_FOUND");
    }
    if (outcome.revokedAt) {
      throw new PlacementsServiceError("PLACEMENT_EXTERNAL_ALREADY_REVOKED");
    }
    const [row] = await tx.update(placementExternalOutcomes)
      .set({
        revokedAt: new Date(),
        revokedByUserId: context.user.id,
        revocationReason: input.reason,
      })
      .where(eq(placementExternalOutcomes.id, input.outcomeId))
      .returning();
    return row;
  });
}

export type PlacementHeldOfferEvidence = {
  source: "CAMPUS_ACCEPTED" | "EXTERNAL_VERIFIED";
  evidenceId: string;
  annualCtcInr: number | null;
};

/**
 * A policy-neutral, provenance-preserving union for the placement cascade.
 * This does NOT define college placed/uplift/held-offer rules (owned by DB09).
 * Use the same downstream policy function for both sources once wired.
 */
export async function listPlacementHeldOfferEvidence(
  context: RequestContext,
  collegeId: string,
  membershipId: string,
): Promise<PlacementHeldOfferEvidence[]> {
  await requirePlacementManageScope(context, collegeId);
  await assertLearnerScope(collegeId, membershipId);
  const db = getDb();
  const [campus, external] = await Promise.all([
    db.select({
      id: placementOffers.id,
      annualCtcInr: placementOffers.annualCtcInr,
    }).from(placementOffers)
      .innerJoin(
        placementApplications,
        eq(placementApplications.id, placementOffers.applicationId),
      )
      .innerJoin(
        placementJobs,
        eq(placementJobs.id, placementApplications.jobId),
      )
      .where(and(
        eq(placementJobs.collegeId, collegeId),
        eq(placementApplications.membershipId, membershipId),
        eq(placementOffers.status, "ACCEPTED"),
      )),
    db.select({
      id: placementExternalOutcomes.id,
      annualCtcInr: placementExternalOutcomes.annualCtcInr,
    }).from(placementExternalOutcomes)
      .where(and(
        eq(placementExternalOutcomes.collegeId, collegeId),
        eq(placementExternalOutcomes.membershipId, membershipId),
        isNull(placementExternalOutcomes.revokedAt),
      )),
  ]);
  return [
    ...campus.map((row) => ({
      source: "CAMPUS_ACCEPTED" as const,
      evidenceId: row.id,
      annualCtcInr: row.annualCtcInr,
    })),
    ...external.map((row) => ({
      source: "EXTERNAL_VERIFIED" as const,
      evidenceId: row.id,
      annualCtcInr: row.annualCtcInr,
    })),
  ];
}
