import "server-only";
import { and, eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import { placementApplications, placementJobs, placementLearnerRequests } from "@/db/schema";
import { hasMembershipRole, type RequestContext } from "@/modules/identity/context";
import { AuthorizationError, can, requirePermission } from "@/modules/permissions/policy";
import { actOnPlacementRequest } from "./request-service";
import { requirePlacementManageScope } from "./scope";
import {requirePersistedTpoMembership} from "./tpo-persisted-actor-service";
import { tpoRequestDecisionSchema } from "./tpo-request-decision-model";
import { placementRequestIdSchema } from "./validation";
import { PlacementsServiceError } from "./errors";

/** Legacy TpoRequestController had only inbox and decision endpoints.
 * vNext preserves service effects through these explicit owners:
 * - createPlacementRequest in request-service validates target/effect and
 *   writes the unique PENDING request, audit event, and scoped TPO notices.
 * - actOnPlacementRequest (called here) locks decision/target, applies the
 *   approved or rejected effect, records status history, and notifies learner.
 * - Escalation/auto-settlement are scheduled or independent TPO services,
 *   never side effects of loading this route.
 * The current route narrows the membership and persisted college before
 * delegating; no legacy numeric user ID or client-supplied college scope. */
export async function decideTpoRequest(context: RequestContext, rawId: unknown, raw: unknown) {
  const membership = context.membership;
  if (!membership || !hasMembershipRole(context, "TPO"))
    throw new AuthorizationError("placements.manage");
  const collegeId = membership.collegeId;
  if (!can(context, "placements.manage", { collegeId }))
    throw new AuthorizationError("placements.manage");
  requirePermission(context, "placements.manage", { collegeId });
  const requestId = placementRequestIdSchema.parse(rawId);
  const body = tpoRequestDecisionSchema.parse(raw);
  // Reject revoked placement officers before disclosing whether a request ID exists.
  // The downstream transactional writer revalidates again before mutation.
  await requirePersistedTpoMembership(context,collegeId);
  await requirePlacementManageScope(context, collegeId);
  const [row] = await getDb().select({ id: placementLearnerRequests.id })
    .from(placementLearnerRequests)
    .innerJoin(placementApplications, eq(placementApplications.id, placementLearnerRequests.applicationId))
    .innerJoin(placementJobs, eq(placementJobs.id, placementApplications.jobId))
    .where(and(eq(placementLearnerRequests.id, requestId), eq(placementJobs.collegeId, collegeId))).limit(1);
  if (!row) throw new PlacementsServiceError("PLACEMENT_REQUEST_NOT_FOUND");
  const decision = body.action === "APPROVE"
    ? { action: "APPROVE" as const, note: body.note || null }
    : { action: "REJECT" as const, note: body.note ?? "" };
  return actOnPlacementRequest(context, requestId, decision, body.expectedUpdatedAt);
}
