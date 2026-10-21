import "server-only";
import { and, eq, desc, gte, lt, lte, sql } from "drizzle-orm";
import { getDb } from "@/db/client";
import {
  attendanceSessions, cohorts, collegeMemberships, departments,
  courseSectionDeliveries, courseOfferings, courses,
  programs, sectionScheduleEvents, sections, users,
} from "@/db/schema";
import type { RequestContext } from "@/modules/identity/context";
import { requirePermission } from "@/modules/permissions/policy";

/** A college dashboard day follows the product's India-local calendar. */
function indiaDayBounds(now: Date) {
  const offset = 330 * 60_000;
  const shifted = new Date(now.getTime() + offset);
  const start = new Date(Date.UTC(
    shifted.getUTCFullYear(), shifted.getUTCMonth(), shifted.getUTCDate(),
  ) - offset);
  return { start, end: new Date(start.getTime() + 86_400_000) };
}

/** COL-dashboard-03 / COL-dashboard-04. Query accurate totals separately from
 * the eight-row preview; do not discard older sessions with a fixed 2000 cap. */
export async function getCollegeDashboardAttendance(context: RequestContext, now = new Date()) {
  const member = context.membership;
  if (!member || member.status !== "ACTIVE") throw new Error("COLLEGE_MEMBERSHIP_REQUIRED");
  requirePermission(context, "academics.read", {
    organizationId: member.organizationId, collegeId: member.collegeId,
  });
  const { start, end } = indiaDayBounds(now);
  const weekStart = new Date(start.getTime() - 7 * 86_400_000);
  const db = getDb();

  const todayTotals = await db.select({
    scheduled: sql<number>`count(*)::int`,
    held: sql<number>`count(*) filter (where ${sectionScheduleEvents.endsAt} <= ${now})::int`,
    marked: sql<number>`count(*) filter (where ${attendanceSessions.status} = 'MARKED')::int`,
  }).from(sectionScheduleEvents)
    .innerJoin(sections, eq(sections.id, sectionScheduleEvents.sectionId))
    .innerJoin(cohorts, eq(cohorts.id, sections.cohortId))
    .innerJoin(programs, eq(programs.id, cohorts.programId))
    .innerJoin(departments, eq(departments.id, programs.departmentId))
    .leftJoin(attendanceSessions, eq(attendanceSessions.scheduleEventId, sectionScheduleEvents.id))
    .where(and(eq(departments.collegeId, member.collegeId),
      eq(sectionScheduleEvents.status, "SCHEDULED"),
      gte(sectionScheduleEvents.startsAt, start),
      lt(sectionScheduleEvents.startsAt, end)));

  const pendingFilter = and(
    eq(departments.collegeId, member.collegeId),
    eq(sectionScheduleEvents.status, "SCHEDULED"),
    gte(sectionScheduleEvents.startsAt, weekStart),
    lte(sectionScheduleEvents.endsAt, now),
    sql`${attendanceSessions.status} is distinct from 'MARKED'`,
  );
  const [pendingCounts, events] = await Promise.all([
    db.select({ total: sql<number>`count(*)::int` })
      .from(sectionScheduleEvents)
      .innerJoin(sections, eq(sections.id, sectionScheduleEvents.sectionId))
      .innerJoin(cohorts, eq(cohorts.id, sections.cohortId))
      .innerJoin(programs, eq(programs.id, cohorts.programId))
      .innerJoin(departments, eq(departments.id, programs.departmentId))
      .leftJoin(attendanceSessions, eq(attendanceSessions.scheduleEventId, sectionScheduleEvents.id))
      .where(pendingFilter),
    db.select({
      id: sectionScheduleEvents.id,
      title: sectionScheduleEvents.title,
      startsAt: sectionScheduleEvents.startsAt,
      sectionName: sections.name,
      facultyName: users.displayName,
      courseName: courses.name,
    }).from(sectionScheduleEvents)
      .innerJoin(sections, eq(sections.id, sectionScheduleEvents.sectionId))
      .innerJoin(cohorts, eq(cohorts.id, sections.cohortId))
      .innerJoin(programs, eq(programs.id, cohorts.programId))
      .innerJoin(departments, eq(departments.id, programs.departmentId))
      .leftJoin(attendanceSessions, eq(attendanceSessions.scheduleEventId, sectionScheduleEvents.id))
      .leftJoin(courseSectionDeliveries, eq(courseSectionDeliveries.id, sectionScheduleEvents.deliveryId))
      .leftJoin(courseOfferings, eq(courseOfferings.id, courseSectionDeliveries.offeringId))
      .leftJoin(courses, eq(courses.id, courseOfferings.courseId))
      .leftJoin(collegeMemberships, eq(collegeMemberships.id, sectionScheduleEvents.facultyMembershipId))
      .leftJoin(users, eq(users.id, collegeMemberships.userId))
      .where(pendingFilter)
      .orderBy(desc(sectionScheduleEvents.startsAt))
      .limit(8),
  ]);
  return {
    // The old Attention Board combines several independently derived
    // categories. We only queried attendance: absent values must remain
    // unknown rather than being fabricated as zero.
    attention: {
      attendancePending: pendingCounts[0]?.total ?? 0,
      attendanceRisk: null as number | null,
      gradingPending: null as number | null,
      unstaffed: null as number | null,
      timetableGaps: null as number | null,
      dueSoon: null as number | null,
      unavailableCategories: [
        "attendanceRisk", "gradingPending", "unstaffed", "timetableGaps", "dueSoon",
      ] as const,
    },
    today: {
      scheduled: todayTotals[0]?.scheduled ?? 0,
      held: todayTotals[0]?.held ?? 0,
      marked: todayTotals[0]?.marked ?? 0,
    },
    unattended: events.map(event => ({
      id: event.id, title: event.title, section: event.sectionName,
      faculty: event.facultyName || "Faculty not assigned",
      course: event.courseName || "Course not linked",
      when: event.startsAt.toISOString(),
    })),
    unattendedCount: pendingCounts[0]?.total ?? 0,
  };
}
