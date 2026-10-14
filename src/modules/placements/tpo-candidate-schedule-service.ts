import "server-only";
import { hasMembershipRole, type RequestContext } from "@/modules/identity/context";
import { AuthorizationError, can, requirePermission } from "@/modules/permissions/policy";
import { getPlacementDriveDay } from "./drive-day-service";
import { requirePlacementManageScope } from "./scope";
import { getTpoScheduleConflicts } from "./tpo-schedule-conflicts-service";
import { projectTpoDriveScheduleWarnings } from "./tpo-drive-schedule-warnings-model";
import {
  candidateScheduleJobIdSchema, projectTpoCandidateScheduleReadiness,
} from "./tpo-candidate-schedule-model";

/** TPO/college-owned read of persisted shared-round schedule only. */
export async function getTpoCandidateScheduleReadiness(
  context: RequestContext,
  rawJobId: unknown,
) {
  const membership = context.membership;
  if (!membership || !hasMembershipRole(context, "TPO")) {
    throw new AuthorizationError("placements.manage");
  }
  const collegeId = membership.collegeId;
  if (!can(context, "placements.manage", { collegeId })) {
    throw new AuthorizationError("placements.manage");
  }
  requirePermission(context, "placements.manage", { collegeId });
  await requirePlacementManageScope(context, collegeId);
  const jobId = candidateScheduleJobIdSchema.parse(rawJobId);
  const drive = await getPlacementDriveDay(context, jobId);
  const assessment = await getTpoScheduleConflicts(context, { days: 90 })
    .catch(() => null);
  return {
    drive,
    readiness: projectTpoCandidateScheduleReadiness(drive.rounds),
    warning: projectTpoDriveScheduleWarnings(
      assessment, drive.rounds.map(round => round.id),
    ),
  };
}
