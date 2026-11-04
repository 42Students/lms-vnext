import "server-only";

import type { RequestContext } from "@/modules/identity/context";
import { hasMembershipRole, isSuperAdmin } from "@/modules/identity/context";
import { canOwnLearnerReceiveClassNotice } from "./learner-notification-membership-service";
import { requireStaffNotificationAudience } from "./notification-service";

/** Class IDs are not authorization tokens. The live class stream requires an
 * enrolled learner, an assigned faculty member, or an explicitly scoped admin.
 * No enrolment/assignment/existence information is returned to the caller. */
export async function canSubscribeToClassNotificationStream(
  context: RequestContext,
  classId: string,
): Promise<boolean> {
  try {
    if (hasMembershipRole(context, "LEARNER")) {
      return await canOwnLearnerReceiveClassNotice(context, classId);
    }
    if (!hasMembershipRole(context, "FACULTY") &&
        !hasMembershipRole(context, "COLLEGE_ADMIN") &&
        !isSuperAdmin(context)) {
      return false;
    }
    const { audience } = await requireStaffNotificationAudience(context, {
      title: "Scoped notification stream",
      htmlContent: "Authorization check only",
      classId,
    });
    // The platform actor may only stream a specifically selected college,
    // never infer an unrestricted campus from an arbitrary URL selector.
    const selectedCollege = context.membership?.collegeId ??
      context.adminScope?.collegeId ?? null;
    return selectedCollege !== null && selectedCollege === audience.collegeId;
  } catch {
    return false;
  }
}

function sameList(a: readonly string[], b: readonly string[]): boolean {
  if (a.length !== b.length) return false;
  const left = [...a].sort();
  const right = [...b].sort();
  return left.every((value, index) => value === right[index]);
}

/** Compare the whole selected authority, not only the user ID. A refreshed
 * request context can otherwise silently switch to a remaining stronger role
 * after the previous selected role has been revoked. */
export function notificationStreamScopeUnchanged(
  initial: RequestContext,
  current: RequestContext,
): boolean {
  if (initial.user.id !== current.user.id ||
      initial.user.identityUid !== current.user.identityUid ||
      initial.user.platformStatus !== "ACTIVE" ||
      current.user.platformStatus !== "ACTIVE" ||
      !sameList(initial.user.systemRoles, current.user.systemRoles)) {
    return false;
  }
  const oldMember = initial.membership;
  const newMember = current.membership;
  if (Boolean(oldMember) !== Boolean(newMember)) return false;
  if (oldMember && newMember &&
      (oldMember.id !== newMember.id ||
       oldMember.collegeId !== newMember.collegeId ||
       oldMember.organizationId !== newMember.organizationId ||
       oldMember.status !== "ACTIVE" || newMember.status !== "ACTIVE" ||
       oldMember.roles.length !== 1 ||
       !sameList(oldMember.roles, newMember.roles))) {
    return false;
  }
  if ((initial.adminScope?.organizationId ?? null) !==
      (current.adminScope?.organizationId ?? null) ||
      (initial.adminScope?.collegeId ?? null) !==
      (current.adminScope?.collegeId ?? null)) {
    return false;
  }
  if (Boolean(initial.recruiter) !== Boolean(current.recruiter)) return false;
  if (initial.recruiter && current.recruiter) {
    if (initial.recruiter.status !== "ACTIVE" ||
        current.recruiter.status !== "ACTIVE" ||
        initial.recruiter.companyId !== current.recruiter.companyId ||
        initial.recruiter.userId !== current.recruiter.userId) return false;
    const key = (grant: {id: string; collegeId: string; organizationId: string; companyRelationshipId: string}) =>
      [grant.id, grant.collegeId, grant.organizationId, grant.companyRelationshipId].join(":");
    if (!sameList(initial.recruiter.grants.map(key),
                  current.recruiter.grants.map(key))) return false;
  }
  return true;
}
