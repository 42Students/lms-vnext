import { can } from "@/modules/permissions/policy";
import type { RequestContext } from "@/modules/identity/context";

/** Pure projection of central permissions; keep unauthorized and nonexistent jobs indistinguishable. */
export function isRecruiterJobVisible(
  context: RequestContext,
  collegeId: string,
  relationshipId: string,
): boolean {
  return Boolean(
    context.recruiter?.grants.some(grant =>
      grant.collegeId === collegeId && grant.companyRelationshipId === relationshipId
    ) && can(context, "placements.recruiter.read", {
      collegeId, placementCompanyRelationshipId: relationshipId,
    }),
  );
}
