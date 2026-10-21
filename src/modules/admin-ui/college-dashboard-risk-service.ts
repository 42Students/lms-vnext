import "server-only";
import { and, count, desc, eq, gte, lte, sql } from "drizzle-orm";
import { getDb } from "@/db/client";
import {
  attendanceRecords, attendanceSessions, cohorts, collegeMemberships,
  departments, learnerProfiles, learnerProgramEnrollments, programs,
  sectionEnrollments, sectionScheduleEvents, sections, users,
} from "@/db/schema";
import type { RequestContext } from "@/modules/identity/context";
import { requirePermission } from "@/modules/permissions/policy";
import { getCollegeAttendancePolicy } from "@/modules/attendance/policy-service";

/** Marked sessions are the denominator, not saved attendance exceptions.
 * Faculty records are sparse: no row for a learner in a MARKED session
 * means PRESENT. Unmarked/cancelled sessions never enter the risk calculation.
 * The 30-day window starts at India-local midnight, as in the old dashboard. */
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
  const offset = 330 * 60_000;
  const indiaNow = new Date(now.getTime() + offset);
  const monthStart = new Date(Date.UTC(
    indiaNow.getUTCFullYear(), indiaNow.getUTCMonth(), indiaNow.getUTCDate() - 30,
  ) - offset);

  // Begin at the marked event and expand its *eligible active roster*.
  // Starting from attendanceRecords omits implicit PRESENT learners and
  // incorrectly makes every learner with one absence look 0% present.
  const marked = sql<number>`count(*)::int`;
  const attended = sql<number>`sum(case
    when ${attendanceRecords.id} is null
      or ${attendanceRecords.status} in ('PRESENT', 'LATE')
    then 1 else 0 end)::int`;
  const atRisk = getDb().select({
    membershipId: collegeMemberships.id,
    displayName: users.displayName,
    rollNumber: learnerProfiles.rollNumber,
    className: sql<string>`min(${sections.name})`.as("class_name"),
    marked: marked.as("marked"),
    attended: attended.as("attended"),
  }).from(sectionScheduleEvents)
    .innerJoin(attendanceSessions, and(
      eq(attendanceSessions.scheduleEventId, sectionScheduleEvents.id),
      eq(attendanceSessions.status, "MARKED")))
    .innerJoin(sections, eq(sections.id, sectionScheduleEvents.sectionId))
    .innerJoin(cohorts, eq(cohorts.id, sections.cohortId))
    .innerJoin(programs, eq(programs.id, cohorts.programId))
    .innerJoin(departments, eq(departments.id, programs.departmentId))
    .innerJoin(sectionEnrollments, and(
      eq(sectionEnrollments.sectionId, sections.id),
      eq(sectionEnrollments.academicPeriodId, sections.academicPeriodId),
      eq(sectionEnrollments.status, "ACTIVE")))
    .innerJoin(learnerProgramEnrollments, and(
      eq(learnerProgramEnrollments.id, sectionEnrollments.learnerEnrollmentId),
      eq(learnerProgramEnrollments.status, "ACTIVE")))
    .innerJoin(collegeMemberships, and(
      eq(collegeMemberships.id, learnerProgramEnrollments.membershipId),
      eq(collegeMemberships.collegeId, member.collegeId),
      eq(collegeMemberships.status, "ACTIVE")))
    .innerJoin(users, and(
      eq(users.id, collegeMemberships.userId),
      eq(users.platformStatus, "ACTIVE")))
    .leftJoin(learnerProfiles, eq(learnerProfiles.membershipId, collegeMemberships.id))
    .leftJoin(attendanceRecords, and(
      eq(attendanceRecords.scheduleEventId, sectionScheduleEvents.id),
      eq(attendanceRecords.membershipId, collegeMemberships.id)))
    .where(and(
      eq(departments.collegeId, member.collegeId),
      eq(sectionScheduleEvents.status, "SCHEDULED"),
      gte(sectionScheduleEvents.startsAt, monthStart),
      lte(sectionScheduleEvents.startsAt, now)))
    .groupBy(collegeMemberships.id, users.displayName, learnerProfiles.rollNumber)
    .having(sql`${marked} > 0 and 100 * ${attended} < ${threshold} * ${marked}`)
    .as("college_dashboard_at_risk");

  // Count independently of the eight-row legacy preview. Never describe a
  // limited result set as the total number of learners at risk.
  const [rows, counts] = await Promise.all([
    getDb().select().from(atRisk)
      .orderBy(sql`100.0 * ${atRisk.attended} / nullif(${atRisk.marked}, 0)`,
        desc(atRisk.marked))
      .limit(8),
    getDb().select({ total: count() }).from(atRisk),
  ]);
  return {
    threshold,
    total: counts[0]?.total ?? 0,
    rows: rows.map(row => ({
      membershipId: row.membershipId,
      displayName: row.displayName,
      rollNumber: row.rollNumber,
      className: row.className,
      attended: row.attended,
      marked: row.marked,
      percent: row.marked ? Math.round(1000 * row.attended / row.marked) / 10 : 0,
    })),
  };
}
