import "server-only";

import type { RequestContext } from "@/modules/identity/context";
import { requirePermission } from "@/modules/permissions/policy";

import { listLearnerPlacementJobs } from "./learner-job-service";
import { requireLearnerPlacementAccess } from "./learner-participation-guard";
import { closingSoonIstDayEndMs } from "./learner-jobs-browse-model";

/** A single server clock snapshot keeps deadline policy and browse labels in sync. */
export async function getOwnLearnerDriveBrowse(
  context: RequestContext,
  snapshot: Date = new Date(),
) {
  const member = await requireLearnerPlacementAccess(context);
  requirePermission(context, "placements.read", { collegeId: member.collegeId });

  const rows = await listLearnerPlacementJobs(context, snapshot);
  return { rows, snapshotNowIso: snapshot.toISOString(),
    closingSoonUntilIso: new Date(closingSoonIstDayEndMs(snapshot.getTime())).toISOString(),
    closingSoonTimezone: "Asia/Kolkata" as const,
  };
}
