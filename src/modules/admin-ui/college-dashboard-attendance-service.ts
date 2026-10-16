import "server-only";
import { and, eq, gte, lt } from "drizzle-orm";
import { getDb } from "@/db/client";
import {
  attendanceSessions, cohorts, collegeMemberships, departments,
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

/** COL-dashboard-03 / COL-dashboard-04. A held class is a scheduled,
 * non-cancelled event whose scheduled end is in the past. */
export async function getCollegeDashboardAttendance(context: RequestContext, now = new Date()) {
  const member = context.membership;
  if (!member || member.status !== "ACTIVE") throw new Error("COLLEGE_MEMBERSHIP_REQUIRED");
  requirePermission(context, "academics.read", {
    organizationId: member.organizationId, collegeId: member.collegeId,
  });
  const { start, end } = indiaDayBounds(now);
  const weekStart = new Date(start.getTime() - 6 * 86_400_000);
  const events = await getDb().select({
    id: sectionScheduleEvents.id,
    title: sectionScheduleEvents.title,
    startsAt: sectionScheduleEvents.startsAt,
    endsAt: sectionScheduleEvents.endsAt,
    sectionName: sections.name,
    facultyName: users.displayName,
    attendanceStatus: attendanceSessions.status,
  }).from(sectionScheduleEvents)
    .innerJoin(sections, eq(sections.id, sectionScheduleEvents.sectionId))
    .innerJoin(cohorts, eq(cohorts.id, sections.cohortId))
    .innerJoin(programs, eq(programs.id, cohorts.programId))
    .innerJoin(departments, eq(departments.id, programs.departmentId))
    .leftJoin(attendanceSessions, eq(attendanceSessions.scheduleEventId, sectionScheduleEvents.id))
    .leftJoin(collegeMemberships, eq(collegeMemberships.id, sectionScheduleEvents.facultyMembershipId))
    .leftJoin(users, eq(users.id, collegeMemberships.userId))
    .where(and(eq(departments.collegeId, member.collegeId),
      eq(sectionScheduleEvents.status, "SCHEDULED"),
      gte(sectionScheduleEvents.startsAt, weekStart),
      lt(sectionScheduleEvents.startsAt, end)))
    .orderBy(sectionScheduleEvents.startsAt)
    .limit(2000);
  const today = events.filter(event => event.startsAt >= start);
  const unattended = events.filter(event =>
    event.endsAt <= now && event.attendanceStatus !== "MARKED").reverse();
  return {
    today: {
      scheduled: today.length,
      held: today.filter(event => event.endsAt <= now).length,
      marked: today.filter(event => event.attendanceStatus === "MARKED").length,
    },
    unattended: unattended.slice(0, 20).map(event => ({
      id: event.id, title: event.title, section: event.sectionName,
      faculty: event.facultyName || "Faculty not assigned",
      when: event.startsAt.toISOString(),
    })),
    unattendedCount: unattended.length,
  };
}
