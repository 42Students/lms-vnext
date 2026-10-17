import "server-only";

import { and, eq, isNull } from "drizzle-orm";
import { getDb } from "@/db/client";
import {
  collegeMemberships, membershipRoles, users,
  courseTeachingAssignments, sectionFacultyAssignments,
} from "@/db/schema";
import { recordActivityEventInTransaction } from "@/modules/activity/service";
import { ACTIVITY_EVENT_TYPES } from "@/modules/activity/taxonomy";
import { hasMembershipRole, type RequestContext } from "@/modules/identity/context";
import { AuthorizationError, can, requirePermission } from "@/modules/permissions/policy";
import {assertMutableMembershipTarget} from "./membership-protection";
import {
  collegeFacultyIdSchema, collegeFacultyLifecycleSchema,
} from "./college-faculty-lifecycle-model";

export class CollegeFacultyLifecycleError extends Error {
  constructor(public readonly code:
    "FACULTY_NOT_FOUND" | "FACULTY_STATUS_CHANGED" |
    "FACULTY_HAS_ACTIVE_ASSIGNMENTS") {
    super(code);
    this.name = "CollegeFacultyLifecycleError";
  }
}

export async function transitionCollegeFaculty(
  context: RequestContext, idRaw: unknown, raw: unknown,
) {
  const membershipId = collegeFacultyIdSchema.parse(idRaw);
  const input = collegeFacultyLifecycleSchema.parse(raw);
  const own = context.membership;
  if (!own || !hasMembershipRole(context, "COLLEGE_ADMIN") ||
      !can(context, "membership.lifecycle.manage", {
        collegeId: own.collegeId, organizationId: own.organizationId,
      })) throw new AuthorizationError("membership.lifecycle.manage");
  requirePermission(context, "membership.lifecycle.manage", {
    collegeId: own.collegeId, organizationId: own.organizationId,
  });
  return getDb().transaction(async tx => {
    const [faculty] = await tx.select({
      id: collegeMemberships.id, userId:collegeMemberships.userId, status: collegeMemberships.status,
      name: users.displayName, userStatus: users.platformStatus,
    }).from(collegeMemberships)
      .innerJoin(users, eq(users.id, collegeMemberships.userId))
      .where(and(
        eq(collegeMemberships.id, membershipId),
        eq(collegeMemberships.collegeId, own.collegeId),
      )).for("update", { of: collegeMemberships }).limit(1);
    if (!faculty) throw new CollegeFacultyLifecycleError("FACULTY_NOT_FOUND");
    const [facultyRole] = await tx.select({ id: membershipRoles.id })
      .from(membershipRoles).where(and(
        eq(membershipRoles.membershipId, membershipId),
        eq(membershipRoles.role, "FACULTY"),
      )).for("share").limit(1);
    if (!facultyRole) throw new CollegeFacultyLifecycleError("FACULTY_NOT_FOUND");
    const targetRoles=await tx.select({role:membershipRoles.role})
      .from(membershipRoles).where(eq(membershipRoles.membershipId,membershipId))
      .for("share");
    assertMutableMembershipTarget(context,{userId:faculty.userId,
      roles:targetRoles.map(item=>item.role)},
      input.action==="DEACTIVATE"?"SUSPEND":"REACTIVATE");
    if (faculty.status !== input.expectedStatus)
      throw new CollegeFacultyLifecycleError("FACULTY_STATUS_CHANGED");
    if (input.action === "DEACTIVATE") {
      const [teaching] = await tx.select({ id: courseTeachingAssignments.id })
        .from(courseTeachingAssignments).where(and(
          eq(courseTeachingAssignments.membershipId, membershipId),
          isNull(courseTeachingAssignments.endedAt),
        )).limit(1);
      const [advising] = await tx.select({ id: sectionFacultyAssignments.id })
        .from(sectionFacultyAssignments).where(and(
          eq(sectionFacultyAssignments.membershipId, membershipId),
          isNull(sectionFacultyAssignments.endedAt),
        )).limit(1);
      if (teaching || advising)
        throw new CollegeFacultyLifecycleError("FACULTY_HAS_ACTIVE_ASSIGNMENTS");
    }
    const now = new Date();
    const action = input.action === "DEACTIVATE" ? "SUSPENDED" : "ACTIVE";
    const [updated] = await tx.update(collegeMemberships).set({
      status: action,
      suspendedAt: action === "SUSPENDED" ? now : null,
      suspensionReason: input.action === "DEACTIVATE" ? input.reason : null,
      updatedAt: now,
    }).where(and(
      eq(collegeMemberships.id, membershipId),
      eq(collegeMemberships.status, input.expectedStatus),
      eq(collegeMemberships.collegeId, own.collegeId),
    )).returning({ id: collegeMemberships.id, status: collegeMemberships.status });
    if (!updated) throw new CollegeFacultyLifecycleError("FACULTY_STATUS_CHANGED");
    await recordActivityEventInTransaction(tx, context, {
      eventType: input.action === "DEACTIVATE"
        ? ACTIVITY_EVENT_TYPES.IDENTITY_MEMBERSHIP_SUSPENDED
        : ACTIVITY_EVENT_TYPES.IDENTITY_MEMBERSHIP_REACTIVATED,
      organizationId: own.organizationId, collegeId: own.collegeId,
      subjectType: "college_membership", subjectId: membershipId,
      subjectLabel: faculty.name,
      summary: input.action === "DEACTIVATE"
        ? "College Admin deactivated faculty membership"
        : "College Admin reactivated faculty membership",
      metadata: {
        role: "FACULTY", fromStatus: faculty.status,
        toStatus: action,
        reason: input.action === "DEACTIVATE" ? input.reason : null,
      },
    });
    return updated;
  });
}
