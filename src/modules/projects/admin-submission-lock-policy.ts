import { hasMembershipRole, type RequestContext } from "@/modules/identity/context";

import { ROLE } from "@/modules/identity/roles";
/**
 * A platform Super Admin may manage projects in an explicitly selected college,
 * but that does not make an unrelated College Admin membership a valid actor
 * for membership-bound delivery events. The event FK records the REAL actor.
 */
export function mayRecordCollegeAdminDeliveryLock(
  context: RequestContext,
  collegeId: string,
  organizationId: string,
): boolean {
  return (
    context.user.platformStatus === "ACTIVE" &&
    hasMembershipRole(context, ROLE.COLLEGE_ADMIN) &&
    context.membership?.collegeId === collegeId &&
    context.membership?.organizationId === organizationId
  );
}
