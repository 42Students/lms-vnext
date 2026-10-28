import "server-only";
import { and, asc, eq, gt, lt, isNull, or, ne } from "drizzle-orm";
import { getDb } from "@/db/client";
import {
  academicPeriods, cohorts, collegeMemberships, departments, lectureHalls,
  membershipRoles, programs, sectionScheduleEvents, sections, users,
  courseSectionDeliveries, courseOfferings, courses,
} from "@/db/schema";
import type { RequestContext } from "@/modules/identity/context";
import { listFutureElectiveLearnerOverlaps } from "./schedule-service";
import { resolveActingCollege } from "@/modules/permissions/acting-college";
import {
  expandIstSessions, findPreviewConflicts, recurringPreviewSchema,
} from "./college-recurring-preview-model";

export class RecurringPreviewNotFoundError extends Error {
  constructor() { super("SCHEDULE_PREVIEW_SCOPE_NOT_FOUND"); this.name = "RecurringPreviewNotFoundError"; }
}

export async function previewCollegeRecurringSchedule(context: RequestContext, raw: unknown) {
  const input = recurringPreviewSchema.parse(raw);
  const member = await resolveActingCollege(context, "academics.manage");
  const db = getDb();
  const [section] = await db.select({
    id: sections.id, status: sections.status,
    periodStart: academicPeriods.startDate, periodEnd: academicPeriods.endDate,
    periodStatus: academicPeriods.status,
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
  if (!section || section.status !== "ACTIVE" || section.periodStatus === "CLOSED")
    throw new RecurringPreviewNotFoundError();
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
  if (input.deliveryId) {
    const [delivery] = await db.select({ id: courseSectionDeliveries.id })
      .from(courseSectionDeliveries)
      .innerJoin(courseOfferings, eq(courseOfferings.id, courseSectionDeliveries.offeringId))
      .innerJoin(courses, eq(courses.id, courseOfferings.courseId))
      .innerJoin(departments, eq(departments.id, courses.departmentId))
      .where(and(eq(courseSectionDeliveries.id, input.deliveryId),
        eq(courseSectionDeliveries.sectionId, input.sectionId),
        isNull(courseSectionDeliveries.endedAt),
        eq(courseOfferings.status, "ACTIVE"), eq(courses.status, "ACTIVE"),
        eq(departments.collegeId, member.collegeId))).limit(1);
    if (!delivery) throw new RecurringPreviewNotFoundError();
  }
  const slots = expandIstSessions(input);
  if (!slots.length) return { slots: [], ready: 0, blocked: 0, notice: "No matching weekdays in this date range" };
  const firstSlot = slots[0];
  const lastSlot = slots[slots.length - 1];
  if (!firstSlot || !lastSlot) throw new RecurringPreviewNotFoundError();
  const first = new Date(firstSlot.startsAt);
  const last = new Date(lastSlot.endsAt);
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
  const electiveOverlaps=await listFutureElectiveLearnerOverlaps(
    context,input.sectionId,first,last);
  const result=slots.map(slot=>{
    const start=new Date(slot.startsAt).getTime();
    const end=new Date(slot.endsAt).getTime();
    const warnings=electiveOverlaps.some(row=>
      start < row.endsAt.getTime() && row.startsAt.getTime() < end)
      ? ["ELECTIVE_LEARNER_OVERLAP"] : [];
    return {...slot,conflicts:findPreviewConflicts(slot,input,existing),warnings};
  });
  return {
    slots: result,
    ready: result.filter((slot) => slot.conflicts.length === 0).length,
    blocked: result.filter((slot) => slot.conflicts.length > 0).length,
    notice: "Preview only: no sessions were created; conflicts must be revalidated on commit",
  };
}

/** Selectable options are scoped and safe for College Admin only. */
export async function listRecurringPreviewOptions(context: RequestContext) {
  const member = await resolveActingCollege(context, "academics.read");
  const db = getDb();
  const [classResult, hallResult, facultyResult, deliveryResult] = await Promise.allSettled([
    db.select({ id: sections.id, name: sections.name, updatedAt: sections.updatedAt, cohortName: cohorts.name,
      periodStart: academicPeriods.startDate, periodEnd: academicPeriods.endDate })
      .from(sections)
      .innerJoin(cohorts, eq(cohorts.id, sections.cohortId))
      .innerJoin(programs, eq(programs.id, cohorts.programId))
      .innerJoin(departments, and(eq(departments.id, programs.departmentId),
        eq(departments.collegeId, member.collegeId)))
      .innerJoin(academicPeriods, and(eq(academicPeriods.id, sections.academicPeriodId),
        eq(academicPeriods.collegeId, member.collegeId)))
      .where(and(eq(sections.status, "ACTIVE"), ne(academicPeriods.status, "CLOSED")))
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
    db.select({
      id: courseSectionDeliveries.id, sectionId: courseSectionDeliveries.sectionId,
      name: courses.name, code: courses.code,
    }).from(courseSectionDeliveries)
      .innerJoin(courseOfferings, eq(courseOfferings.id, courseSectionDeliveries.offeringId))
      .innerJoin(courses, eq(courses.id, courseOfferings.courseId))
      .innerJoin(departments, eq(departments.id, courses.departmentId))
      .innerJoin(sections, eq(sections.id, courseSectionDeliveries.sectionId))
      .where(and(eq(departments.collegeId, member.collegeId),
        eq(sections.status, "ACTIVE"), isNull(courseSectionDeliveries.endedAt),
        eq(courses.status, "ACTIVE"), eq(courseOfferings.status, "ACTIVE")))
      .orderBy(asc(courses.name)).limit(1000),
  ]);
  const classes = classResult.status === "fulfilled" ? classResult.value : [];
  const halls = hallResult.status === "fulfilled" ? hallResult.value : [];
  const faculty = facultyResult.status === "fulfilled" ? facultyResult.value : [];
  const deliveries = deliveryResult.status === "fulfilled" ? deliveryResult.value : [];
  return { classes, halls, faculty, deliveries, errors: {
    classes: classResult.status === "rejected",
    halls: hallResult.status === "rejected",
    faculty: facultyResult.status === "rejected",
    deliveries: deliveryResult.status === "rejected",
  } };
}
