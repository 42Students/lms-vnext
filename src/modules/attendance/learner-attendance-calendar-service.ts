import "server-only";

import { and, eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import { collegeMemberships, colleges, membershipRoles, users } from "@/db/schema";
import { hasActiveMembership, hasMembershipRole, type RequestContext } from "@/modules/identity/context";
import { AuthorizationError, can } from "@/modules/permissions/policy";
import { getLearnerAttendanceWorkspace } from "@/modules/attendance/learner-service";
import {
  attendanceCalendarSummary, learnerAttendanceMonthWindow, parseAttendanceCalendarQuery,
  selectAttendanceCalendarRecords,
} from "./learner-attendance-calendar-model";

/**
 * Read-only timeline: verify the actual active Learner role and tenant before
 * using the canonical delivery/attendance reader. No caller supplies an owner.
 */
export async function getOwnLearnerAttendanceCalendar(
  context: RequestContext, rawQuery: unknown, now = new Date(),
) {
  const query = parseAttendanceCalendarQuery(rawQuery, now);
  const membership = context.membership;
  if (!membership || !hasActiveMembership(context) ||
      !hasMembershipRole(context, "LEARNER") ||
      !can(context, "academics.read", {
        organizationId: membership.organizationId, collegeId: membership.collegeId,
      })) throw new AuthorizationError("academics.read");

  const [persisted] = await getDb().select({ id:collegeMemberships.id })
    .from(collegeMemberships)
    .innerJoin(users,eq(users.id,collegeMemberships.userId))
    .innerJoin(colleges,eq(colleges.id,collegeMemberships.collegeId))
    .innerJoin(membershipRoles,and(
      eq(membershipRoles.membershipId,collegeMemberships.id),
      eq(membershipRoles.role,"LEARNER"),
    )).where(and(
      eq(collegeMemberships.id,membership.id),
      eq(collegeMemberships.userId,context.user.id),
      eq(collegeMemberships.collegeId,membership.collegeId),
      eq(colleges.organizationId,membership.organizationId),
      eq(collegeMemberships.status,"ACTIVE"),
      eq(users.platformStatus,"ACTIVE"),
    )).limit(1);
  if(!persisted) throw new AuthorizationError("academics.read");

  const workspace = await getLearnerAttendanceWorkspace(context, {
    window: learnerAttendanceMonthWindow(query.month),
  });
  const courses = workspace.courses.map(row => ({
    deliveryId:row.deliveryId,courseName:row.courseName,courseCode:row.courseCode,
  }));
  // Fail closed rather than treating a foreign/non-rostered delivery as a valid
  // no-data selection. Only current accessible course delivery IDs are allowed.
  if(query.deliveryId !== "ALL" &&
      !courses.some(row => row.deliveryId === query.deliveryId)) {
    throw new AuthorizationError("academics.read");
  }
  const matching = selectAttendanceCalendarRecords(workspace.records,query);
  return {
    query,courses,rows:matching,summary:attendanceCalendarSummary(matching),
    // Calendar read is scoped to the selected IST month, never full history.
    hasAnyRecords:workspace.records.length > 0,
  };
}
