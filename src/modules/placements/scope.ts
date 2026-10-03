import { eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import { colleges } from "@/db/schema";
import type { RequestContext } from "@/modules/identity/context";
import { requirePermission } from "@/modules/permissions/policy";
import { PlacementsServiceError } from "./errors";

export async function loadPlacementCollegeScope(
  collegeId: string,
) {
  const [college] = await getDb()
    .select({
      id: colleges.id,
      organizationId: colleges.organizationId,
      status: colleges.status,
    })
    .from(colleges)
    .where(eq(colleges.id, collegeId))
    .limit(1);

  if (!college || college.status !== "ACTIVE") {
    throw new PlacementsServiceError("COLLEGE_NOT_FOUND");
  }

  return college;
}

export async function requirePlacementManageScope(
  context: RequestContext,
  collegeId: string,
) {
  const college = await loadPlacementCollegeScope(collegeId);
  requirePermission(context, "placements.manage", {
    organizationId: college.organizationId,
    collegeId: college.id,
  });
  return college;
}
