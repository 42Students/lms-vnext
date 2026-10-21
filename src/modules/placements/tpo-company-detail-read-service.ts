import "server-only";
import { and, eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import { placementJobs } from "@/db/schema";
import { z } from "zod";
import { hasMembershipRole, type RequestContext } from "@/modules/identity/context";
import { AuthorizationError, can, requirePermission } from "@/modules/permissions/policy";
import { requirePlacementManageScope } from "./scope";
import {requireTpoBatchActor} from "./tpo-batch-workspace-read-service";
import { getTpoCompanyDetailView } from "./tpo-companies-view-service";
import { getTpoCompanyLifecycle } from "./tpo-company-lifecycle-service";
import { projectTpoCompanyRelationshipSummary } from "./tpo-company-relationship-summary-model";
import { projectTpoCompanyHiringPulse } from "./tpo-company-hiring-pulse-model";

/** Strictly read-only canonical company view from persisted college relationship.
 * Job-only legacy company-name memory is a DIFFERENT resource: its route must
 * resolve authorized in-college jobs/leads by normalized name, never invent a
 * canonical company UUID or require an active recruiter relationship merely
 * to show historical drives. This UUID detail route remains fail-closed.
 */
export async function getTpoCompanyDetailReadOnly(context: RequestContext, rawCompanyId: unknown) {
  const companyId = z.string().uuid().parse(rawCompanyId);
  const membership = context.membership;
  if (!membership || !hasMembershipRole(context, "TPO") ||
      membership.status !== "ACTIVE" || context.user.platformStatus !== "ACTIVE") {
    throw new AuthorizationError("placements.manage");
  }
  const collegeId = membership.collegeId;
  if (!can(context, "placements.manage", { collegeId })) throw new AuthorizationError("placements.manage");
  requirePermission(context, "placements.manage", { collegeId });
  const liveCollegeId=await requireTpoBatchActor(context);
  if(liveCollegeId!==collegeId)throw new AuthorizationError("placements.manage");
  await requirePlacementManageScope(context, collegeId);
  const [detail, stored] = await Promise.all([
    getTpoCompanyDetailView(context, { collegeId, companyId }),
    getTpoCompanyLifecycle(context, companyId),
  ]);
  if (!detail || !stored || detail.company.relationshipId !== stored.relationshipId) return null;
  const seasons = await getDb().selectDistinct({ seasonId: placementJobs.seasonId })
    .from(placementJobs).where(and(
      eq(placementJobs.collegeId, collegeId),
      eq(placementJobs.companyRelationshipId, stored.relationshipId),
    ));
  const hiringPulse = projectTpoCompanyHiringPulse({
    drives: detail.drives, offers: detail.hiringHistory, timeline: detail.timeline,
    seasonIds: seasons.map((item) => item.seasonId),
  });
  return {
    ...detail,
    relationship: projectTpoCompanyRelationshipSummary(stored),
    hiringPulse,
  };
}
