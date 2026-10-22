import "server-only";

import { hasMembershipRole, type RequestContext } from "@/modules/identity/context";
import {
  AuthorizationError, can, requirePermission,
} from "@/modules/permissions/policy";
import { requirePlacementManageScope } from "./scope";
import { createPlacementJob } from "./job-service";
import {
  normalizedTpoDraftDeadline,
  tpoDraftDriveStepOneSchema,
} from "./tpo-draft-drive-model";

export async function createTpoDraftDriveStepOne(
  context: RequestContext,
  raw: unknown,
) {
  if (!context.membership || !hasMembershipRole(context, "TPO")) {
    throw new AuthorizationError("placements.manage");
  }
  const collegeId = context.membership.collegeId;
  if (!can(context, "placements.manage", { collegeId })) {
    throw new AuthorizationError("placements.manage");
  }
  requirePermission(context, "placements.manage", { collegeId });
  await requirePlacementManageScope(context, collegeId);
  const input = tpoDraftDriveStepOneSchema.parse(raw);
  const job = await createPlacementJob(context, {
    collegeId,
    seasonId: input.seasonId,
    companyRelationshipId: input.companyRelationshipId,
    title: input.title,
    description: input.description,
    employmentType: input.employmentType,
    jobTypeLabel: input.jobTypeLabel,
    workMode: input.workMode,
    applicationMode: "INTERNAL",
    locations: [],
    applicationDeadline: normalizedTpoDraftDeadline(input.applicationDeadline),
  });
  if (!job) throw new Error("Placement job creation returned no job");
  return { id: job.id, status: job.status };
}
