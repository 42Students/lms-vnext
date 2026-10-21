import "server-only";

import { and, eq, inArray } from "drizzle-orm";
import { getDb } from "@/db/client";
import { placementJobRounds, placementJobs, placementRoundResults } from "@/db/schema";
import { hasMembershipRole, type RequestContext } from "@/modules/identity/context";
import { AuthorizationError, can, requirePermission } from "@/modules/permissions/policy";
import { confirmedTpoRoundResultSchema } from "./tpo-confirmed-round-result-model";
import { confirmTpoRoundResult } from "./tpo-confirmed-round-result-service";
import {
  bulkTpoRoundResultSchema,
  summarizeBulkRoundResults,
  type TpoBulkRoundResultOutcome,
} from "./tpo-bulk-round-result-model";
import { PlacementsServiceError } from "./errors";
import { requirePlacementManageScope } from "./scope";
import { placementRoundIdSchema } from "./validation";

/**
 * Bulk STAGING only. Each successful entry goes through the existing
 * row-locked, audited single-result transaction. This is not an atomic
 * whole-batch transaction; partial successes are explicitly reported.
 * TPO must separately confirm APPLY after a round is completed.
 */
export async function confirmTpoBulkRoundResults(
  context: RequestContext,
  rawRoundId: unknown,
  rawInput: unknown,
) {
  if (!context.membership ||
      !(hasMembershipRole(context, "TPO") || hasMembershipRole(context, "COLLEGE_ADMIN"))) {
    throw new AuthorizationError("placements.manage");
  }
  const collegeId = context.membership.collegeId;
  if (!can(context, "placements.manage", { collegeId })) {
    throw new AuthorizationError("placements.manage");
  }
  requirePermission(context, "placements.manage", { collegeId });
  const roundId = placementRoundIdSchema.parse(rawRoundId);
  const input = bulkTpoRoundResultSchema.parse(rawInput);

  // Scope resolution occurs before any mutation; a foreign round and an
  // unknown round both fail without processing a single submitted entry.
  const [round] = await getDb()
    .select({ id: placementJobRounds.id, collegeId: placementJobs.collegeId })
    .from(placementJobRounds)
    .innerJoin(placementJobs, eq(placementJobs.id, placementJobRounds.jobId))
    .where(and(
      eq(placementJobRounds.id, roundId),
      eq(placementJobs.collegeId, collegeId),
    ))
    .limit(1);
  if (!round) throw new PlacementsServiceError("PLACEMENT_ROUND_NOT_FOUND");
  await requirePlacementManageScope(context, round.collegeId);

  const requestedRanks=input.entries.filter(x=>x.result.outcome==="HOLD")
   .map(x=>x.result.waitlistRank).filter((x):x is number=>typeof x==="number");
  if(requestedRanks.length){
   const taken=await getDb().select({rank:placementRoundResults.waitlistRank})
    .from(placementRoundResults).where(and(eq(placementRoundResults.roundId,roundId),
     eq(placementRoundResults.outcome,"HOLD"),
     inArray(placementRoundResults.status,["STAGED","APPLIED"]),
     inArray(placementRoundResults.waitlistRank,requestedRanks)));
   if(taken.length)throw new PlacementsServiceError("PLACEMENT_RESULT_WAITLIST_RANK_TAKEN");
  }

  const results: TpoBulkRoundResultOutcome[] = [];
  for (const entry of input.entries) {
    try {
      // Reuse the confirmed adapter, not a new unguarded insert path.
      const confirmed = confirmedTpoRoundResultSchema.parse({
        confirmed: true,
        expectedCurrentResultId: entry.expectedCurrentResultId,
        result: entry.result,
      });
      const saved = await confirmTpoRoundResult(context, roundId, confirmed);
      results.push({
        applicationId: entry.result.applicationId,
        status: "staged",
        resultId: saved.id,
      });
    } catch (error) {
      if (!(error instanceof PlacementsServiceError)) throw error;
      results.push({
        applicationId: entry.result.applicationId,
        status: "ineligible",
        reason: error.code,
      });
    }
  }
  return {
    results,
    counts: summarizeBulkRoundResults(results),
  };
}
