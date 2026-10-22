import { and, eq, ne } from "drizzle-orm";
import { getDb } from "@/db/client";
import {
  placementJobEligibilityPolicies,
  placementJobRounds,
} from "@/db/schema";
import type { RequestContext } from "@/modules/identity/context";
import { publishPlacementJob } from "@/modules/placements/job-service";
import { createPlacementRound } from "@/modules/placements/round-service";
import type { CreatePlacementRoundInput } from "@/modules/placements/validation";

export type PublishableJobFixtureOptions = {
  /** Round created when the draft has no evaluative (non-TALK, non-cancelled) round yet. */
  round?: CreatePlacementRoundInput;
};

/**
 * TPO-drives-42: a draft is publishable only once it has at least one
 * evaluative round and a persisted eligibility policy. Prepare a draft the
 * way a TPO would. Idempotent: an existing evaluative round or policy (for
 * example one the test created on purpose) is kept as-is. The default policy
 * row has empty audience lists and null thresholds, which the eligibility
 * evaluator treats exactly like "no restriction".
 */
export async function preparePlacementJobForPublication(
  context: RequestContext,
  jobId: string,
  options: PublishableJobFixtureOptions = {},
): Promise<void> {
  const db = getDb();
  const [evaluativeRound] = await db
    .select({ id: placementJobRounds.id })
    .from(placementJobRounds)
    .where(and(
      eq(placementJobRounds.jobId, jobId),
      ne(placementJobRounds.kind, "TALK"),
      ne(placementJobRounds.status, "CANCELLED"),
    ))
    .limit(1);
  if (!evaluativeRound) {
    await createPlacementRound(
      context,
      jobId,
      options.round ?? { kind: "INTERVIEW", name: "Interview" },
    );
  }
  await db
    .insert(placementJobEligibilityPolicies)
    .values({ jobId, updatedByUserId: context.user.id })
    .onConflictDoNothing();
}

/** Prepare (idempotently) and then publish through the production service. */
export async function publishPreparedPlacementJob(
  context: RequestContext,
  jobId: string,
  options: PublishableJobFixtureOptions = {},
): ReturnType<typeof publishPlacementJob> {
  await preparePlacementJobForPublication(context, jobId, options);
  return publishPlacementJob(context, jobId);
}
