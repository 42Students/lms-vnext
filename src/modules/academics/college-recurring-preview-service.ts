import "server-only";
import { and, asc, eq, gt, lt, or } from "drizzle-orm";
import { getDb } from "@/db/client";
import {
  academicPeriods, cohorts, collegeMemberships, departments, lectureHalls,
  membershipRoles, programs, sectionScheduleEvents, sections, users,
} from "@/db/schema";
import { hasMembershipRole, type RequestContext } from "@/modules/identity/context";
import { AuthorizationError, can, requirePermission } from "@/modules/permissions/policy";
import {
  expandIstSessions, findPreviewConflicts, recurringPreviewSchema,
} from "./college-recurring-preview-model";

export class RecurringPreviewNotFoundError extends Error {
  constructor() { super("SCHEDULE_PREVIEW_SCOPE_NOT_FOUND"); this.name = "RecurringPreviewNotFoundError"; }
}

export async function previewCollegeRecurringSchedule(context: RequestContext, raw: unknown) {
  const input = recurringPreviewSchema.parse(raw);
  const member = context.membership;
  if (!member || !hasMembershipRole(context, "COLLEGE_ADMIN") ||
    !can(context, "academics.manage", {
      collegeId: member.collegeId, organizationId: member.organizationId,
    })) throw new AuthorizationError("academics.manage");
  requirePermission(context, "academics.manage", {
    collegeId: member.collegeId, organizationId: member.organizationId,
  });
  const db = getDb();
  const [section] = await db.select({
    id: sections.id, status: sections.status,
    periodStart: academicPeriods.startDate, periodEnd: academicPeriods.endDate,
  }).from(sections)
    .innerJoin(cohorts, eq(cohorts.id, sections.cohortId))
    .innerJoin(programs, eq(programs.id, cohorts.programId))
    .innerJoin(departments, and(
      eq(departments.id, programs.departmentId),
      eq(departments.collegeId, member.collegeId),
    ))
    .innerJoin(academicPeriods, and(
      eq(academicPeriods.id, sections.academicPeriodId),
      eq(academicPeriods.collegeId, member.collegeId),
    ))
    .where(eq(sections.id, input.sectionId)).limit(1);
  if (!section || section.status !== "ACTIVE") throw new RecurringPreviewNotFoundError();
  if (input.from < section.periodStart || input.to > section.periodEnd)
    throw new RecurringPreviewNotFoundError();

  if (input.lectureHallId) {
    const [hall] = await db.select({ id: lectureHalls.id }).from(lectureHalls)
      .where(and(eq(lectureHalls.id, input.lectureHallId),
        eq(lectureHalls.collegeId, member.collegeId), eq(lectureHalls.status, "ACTIVE"))).limit(1);
    if (!hall) throw new RecurringPreviewNotFoundError();
  }
  if (input.facultyMembershipId) {
    const [faculty] = await db.select({ id: collegeMemberships.id }).from(collegeMemberships)
      .innerJoin(membershipRoles, and(
        eq(membershipRoles.membershipId, collegeMemberships.id),
        eq(membershipRoles.role, "FACULTY"),
      ))
      .where(and(
        eq(collegeMemberships.id, input.facultyMembershipId),
        eq(collegeMemberships.collegeId, member.collegeId),
        eq(collegeMemberships.status, "ACTIVE"),
      )).limit(1);
    if (!faculty) throw new RecurringPreviewNotFoundError();
  }
  const slots = expandIstSessions(input);
  if (!slots.length) return { slots: [], ready: 0, blocked: 0, notice: "No matching weekdays in this date range" };
  const first = new Date(slots[0].startsAt);
  const last = new Date(slots[slots.length - 1].endsAt);
  const existing = await db.select({
    sectionId: sectionScheduleEvents.sectionId,
    facultyMembershipId: sectionScheduleEvents.facultyMembershipId,
    lectureHallId: sectionScheduleEvents.lectureHallId,
    startsAt: sectionScheduleEvents.startsAt,
    endsAt: sectionScheduleEvents.endsAt,
  }).from(sectionScheduleEvents)
    .innerJoin(sections, eq(sections.id, sectionScheduleEvents.sectionId))
    .innerJoin(cohorts, eq(cohorts.id, sections.cohortId))
    .innerJoin(programs, eq(programs.id, cohorts.programId))
    .innerJoin(departments, and(
      eq(departments.id, programs.departmentId),
      eq(departments.collegeId, member.collegeId),
    ))
    .where(and(
      eq(sectionScheduleEvents.status, "SCHEDULED"),
      lt(sectionScheduleEvents.startsAt, last),
      gt(sectionScheduleEvents.endsAt, first),
      or(eq(sectionScheduleEvents.sectionId, input.sectionId),
        input.facultyMembershipId ? eq(sectionScheduleEvents.facultyMembershipId, input.facultyMembershipId) : undefined,
        input.lectureHallId ? eq(sectionScheduleEvents.lectureHallId, input.lectureHallId) : undefined),
    ));
  const result = slots.map((slot) => ({ ...slot, conflicts: findPreviewConflicts(slot, input, existing) }));
  return {
    slots: result,
    ready: result.filter((slot) => slot.conflicts.length === 0).length,
    blocked: result.filter((slot) => slot.conflicts.length > 0).length,
    notice: "Preview only: no sessions were created; conflicts must be revalidated on commit",
  };
}

/** Selectable options are scoped and safe for College Admin only. */
export async function listRecurringPreviewOptions(context: RequestContext) {
  const member = context.membership;
  if (!member || !hasMembershipRole(context, "COLLEGE_ADMIN") ||
    !can(context, "academics.read", {
      collegeId: member.collegeId, organizationId: member.organizationId,
    })) throw new AuthorizationError("academics.read");
  requirePermission(context, "academics.read", {
    collegeId: member.collegeId, organizationId: member.organizationId,
  });
  const db = getDb();
  const [classes, halls, faculty] = await Promise.all([
    db.select({ id: sections.id, name: sections.name, cohortName: cohorts.name,
      periodStart: academicPeriods.startDate, periodEnd: academicPeriods.endDate })
      .from(sections)
      .innerJoin(cohorts, eq(cohorts.id, sections.cohortId))
      .innerJoin(programs, eq(programs.id, cohorts.programId))
      .innerJoin(departments, and(eq(departments.id, programs.departmentId),
        eq(departments.collegeId, member.collegeId)))
      .innerJoin(academicPeriods, and(eq(academicPeriods.id, sections.academicPeriodId),
        eq(academicPeriods.collegeId, member.collegeId)))
      .where(eq(sections.status, "ACTIVE"))
      .orderBy(asc(sections.name), asc(sections.id)),
    db.select({ id: lectureHalls.id, name: lectureHalls.name })
      .from(lectureHalls)
      .where(and(eq(lectureHalls.collegeId, member.collegeId), eq(lectureHalls.status, "ACTIVE")))
      .orderBy(asc(lectureHalls.name), asc(lectureHalls.id)),
    db.select({ id: collegeMemberships.id, displayName: users.displayName })
      .from(collegeMemberships)
      .innerJoin(users, eq(users.id, collegeMemberships.userId))
      .innerJoin(membershipRoles, and(eq(membershipRoles.membershipId, collegeMemberships.id),
        eq(membershipRoles.role, "FACULTY")))
      .where(and(eq(collegeMemberships.collegeId, member.collegeId),
        eq(collegeMemberships.status, "ACTIVE")))
      .orderBy(asc(users.displayName), asc(collegeMemberships.id)),
  ]);
  return { classes, halls, faculty };
}
