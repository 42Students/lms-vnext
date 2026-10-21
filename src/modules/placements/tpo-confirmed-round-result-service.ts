import "server-only";

import { and, eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import { placementJobRounds, placementJobs } from "@/db/schema";
import { hasMembershipRole, type RequestContext } from "@/modules/identity/context";
import { AuthorizationError, can, requirePermission } from "@/modules/permissions/policy";
import { confirmedTpoRoundResultSchema } from "./tpo-confirmed-round-result-model";
import { PlacementsServiceError } from "./errors";
import { stagePlacementRoundResult } from "./result-service";
import { requirePlacementManageScope } from "./scope";
import { placementRoundIdSchema } from "./validation";

/**
 * Only the TPO page's confirmed optimistic write reaches this adapter.
 * The existing result service performs participant/progression validation,
 * row-locked stale identity verification and transactional audit insertion.
 */
export async function confirmTpoRoundResult(
  context: RequestContext,
  rawRoundId: unknown,
  rawBody: unknown,
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
  const body = confirmedTpoRoundResultSchema.parse(rawBody);
  const [scope] = await getDb()
    .select({ roundId: placementJobRounds.id, collegeId: placementJobs.collegeId, jobStatus: placementJobs.status })
    .from(placementJobRounds)
    .innerJoin(placementJobs, eq(placementJobs.id, placementJobRounds.jobId))
    .where(and(
      eq(placementJobRounds.id, roundId),
      eq(placementJobs.collegeId, collegeId),
    ))
    .limit(1);
  if (!scope) throw new PlacementsServiceError("PLACEMENT_ROUND_NOT_FOUND");
  await requirePlacementManageScope(context, scope.collegeId);
  if (scope.jobStatus !== "PUBLISHED") throw new PlacementsServiceError("PLACEMENT_JOB_READ_ONLY");
  return stagePlacementRoundResult(
    context, roundId, body.result, body.expectedCurrentResultId,
  );
}
