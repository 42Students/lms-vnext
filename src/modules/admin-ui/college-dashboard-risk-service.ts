import "server-only";
import { and, eq, gte, lte, sql } from "drizzle-orm";
import { getDb } from "@/db/client";
import {
  attendanceRecords, attendanceSessions, cohorts, collegeMemberships,
  departments, programs, sectionScheduleEvents, sections, users,
} from "@/db/schema";
import type { RequestContext } from "@/modules/identity/context";
import { requirePermission } from "@/modules/permissions/policy";
import { getCollegeAttendancePolicy } from "@/modules/attendance/policy-service";

/** Marked sessions only, over the previous 30 days. Never count UNMARKED
 * sessions or future classes as absences. A learner with no marks is omitted. */
export async function getCollegeDashboardLowAttendance(
  context: RequestContext, now = new Date(),
) {
  const member = context.membership;
  if (!member || member.status !== "ACTIVE")
    throw new Error("COLLEGE_MEMBERSHIP_REQUIRED");
  requirePermission(context, "academics.read", {
    organizationId: member.organizationId, collegeId: member.collegeId,
  });
  const { policy } = await getCollegeAttendancePolicy(context, member.collegeId);
  const threshold = policy.eligibilityThresholdPercent;
  const total = sql<number>`count(*)::int`;
  const present = sql<number>`sum(case when ${attendanceRecords.status} in ('PRESENT', 'LATE')
    then 1 else 0 end)::int`;
  const rows = await getDb().select({
    membershipId: attendanceRecords.membershipId,
    displayName: users.displayName,
    marked: total, attended: present,
  }).from(attendanceRecords)
    .innerJoin(attendanceSessions, and(
      eq(attendanceSessions.scheduleEventId, attendanceRecords.scheduleEventId),
      eq(attendanceSessions.status, "MARKED")))
    .innerJoin(sectionScheduleEvents,
      eq(sectionScheduleEvents.id, attendanceRecords.scheduleEventId))
    .innerJoin(sections, eq(sections.id, sectionScheduleEvents.sectionId))
    .innerJoin(cohorts, eq(cohorts.id, sections.cohortId))
    .innerJoin(programs, eq(programs.id, cohorts.programId))
    .innerJoin(departments, eq(departments.id, programs.departmentId))
    .innerJoin(collegeMemberships, eq(collegeMemberships.id, attendanceRecords.membershipId))
    .innerJoin(users, eq(users.id, collegeMemberships.userId))
    .where(and(eq(departments.collegeId, member.collegeId),
      eq(collegeMemberships.status, "ACTIVE"),
      gte(sectionScheduleEvents.startsAt, new Date(now.getTime() - 30 * 86_400_000)),
      lte(sectionScheduleEvents.startsAt, now)))
    .groupBy(attendanceRecords.membershipId, users.displayName)
    .having(sql`100 * ${present} < ${threshold} * ${total}`)
    .orderBy(sql`100.0 * ${present} / nullif(${total}, 0)`)
    .limit(200);
  return {
    threshold,
    rows: rows.map(row => ({
      membershipId: row.membershipId,
      displayName: row.displayName,
      attended: row.attended,
      marked: row.marked,
      percent: row.marked ? Math.round(1000 * row.attended / row.marked) / 10 : 0,
    })),
  };
}
