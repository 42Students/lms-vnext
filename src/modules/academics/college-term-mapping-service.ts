import "server-only";

import { and, asc, eq, inArray, isNull, sql } from "drizzle-orm";
import { z } from "zod";
import { alias } from "drizzle-orm/pg-core";
import { getDb } from "@/db/client";
import {
  academicPeriods, cohortProgressionState, cohorts, courseOfferings, courses, departments,
  courseSectionDeliveries, courseTeachingAssignments, sections,
  programTermCourses, programTerms, programs,
} from "@/db/schema";
import type { RequestContext } from "@/modules/identity/context";
import { resolveActingCollege } from "@/modules/permissions/acting-college";
import { AuthorizationError } from "@/modules/permissions/policy";
import { recordActivityEventInTransaction } from "@/modules/activity/service";
import { ACTIVITY_EVENT_TYPES } from "@/modules/activity/taxonomy";
import {
  collegeTermCourseAddSchema, collegeTermCourseIdSchema,
  collegeTermCourseUnmapSchema, collegeTermCourseUpdateSchema, reorderTermCourseIds, nextTermCourseOrder,
} from "./college-term-mapping-model";

const courseDepartment = alias(departments, "college_term_course_department");

export class CollegeTermMappingError extends Error {
  constructor(public readonly code: string) { super(code); this.name = "CollegeTermMappingError"; }
}

async function ownCollege(context: RequestContext) {
  return resolveActingCollege(context, "academics.manage");
}
type Tx = Parameters<Parameters<ReturnType<typeof getDb>["transaction"]>[0]>[0];

async function lockTerm(tx: Tx, termId: string, collegeId: string) {
  const [row] = await tx.select({
    id: programTerms.id, programId: programTerms.programId,
    termNumber: programTerms.termNumber, active: programTerms.isActive,
  }).from(programTerms)
    .innerJoin(programs, eq(programs.id, programTerms.programId))
    .innerJoin(departments, and(
      eq(departments.id, programs.departmentId),
      eq(departments.collegeId, collegeId), isNull(departments.archivedAt),
    ))
    .where(and(eq(programTerms.id, termId), eq(programs.status, "ACTIVE")))
    .for("update").limit(1);
  if (!row || !row.active) throw new CollegeTermMappingError("TERM_NOT_FOUND");
  return row;
}

function mapConflict(error: unknown): never {
  if (error instanceof CollegeTermMappingError || error instanceof AuthorizationError) throw error;
  let candidate: unknown = error;
  for (let n = 0; n < 5 && candidate && typeof candidate === "object"; n++) {
    if ("constraint" in candidate && candidate.constraint === "program_term_courses_term_course_uq")
      throw new CollegeTermMappingError("TERM_COURSE_DUPLICATE");
    candidate = "cause" in candidate ? candidate.cause : null;
  }
  throw error;
}

export async function listCollegeTermMappings(context: RequestContext) {
  const membership = await ownCollege(context);
  const db = getDb();
  const [terms, courseChoices, mapped] = await Promise.all([
    db.select({
      id: programTerms.id, name: programTerms.name, termNumber: programTerms.termNumber,
      programName: programs.name, programId: programs.id, departmentId: departments.id,
      isActive: programTerms.isActive,
    }).from(programTerms)
      .innerJoin(programs, eq(programs.id, programTerms.programId))
      .innerJoin(departments, and(eq(departments.id, programs.departmentId),
        eq(departments.collegeId, membership.collegeId)))
      .orderBy(asc(programs.name), asc(programTerms.termNumber)),
    db.select({ id: courses.id, name: courses.name, code: courses.code, departmentId: courses.departmentId })
      .from(courses)
      .innerJoin(departments, and(eq(departments.id, courses.departmentId),
        eq(departments.collegeId, membership.collegeId)))
      .where(eq(courses.status, "ACTIVE")).orderBy(asc(courses.name)),
    db.select({
      id: programTermCourses.id, termId: programTerms.id,
      courseId: programTermCourses.courseId,
      termNumber: programTerms.termNumber, termName: programTerms.name,
      programName: programs.name,
      // Keep a same-college mapping visible even if its linked course record is
      // unavailable or no longer resolves in the scoped course directory.
      // Never expose a different college's course name through this join.
      courseName: sql<string>`case when ${courseDepartment.id} is null
        then ('Course name unavailable (ID ' || ${programTermCourses.courseId}::text || ')')
        else ${courses.name} end`,
      courseCode: sql<string>`case when ${courseDepartment.id} is null
        then '—' else ${courses.code} end`,
      type: programTermCourses.type, credits: programTermCourses.credits,
      displayOrder: programTermCourses.displayOrder,
    }).from(programTermCourses)
      .innerJoin(programTerms, eq(programTerms.id, programTermCourses.programTermId))
      .innerJoin(programs, eq(programs.id, programTerms.programId))
      .innerJoin(departments, and(eq(departments.id, programs.departmentId),
        eq(departments.collegeId, membership.collegeId)))
      .leftJoin(courses, eq(courses.id, programTermCourses.courseId))
      .leftJoin(courseDepartment, and(
        eq(courseDepartment.id, courses.departmentId),
        eq(courseDepartment.collegeId, membership.collegeId),
      ))
      .orderBy(asc(programs.name), asc(programTerms.termNumber), asc(programTermCourses.displayOrder)),
  ]);
  // Read curriculum and course choices independently from staffing. A failed
  // staffing query must not hide a valid mapping roster or an edit action.
  // These are ACTIVE DELIVERY counts, not the legacy all-program-class report.
  let staffingAvailable = true;
  let staffingRows: Array<{
    courseId: string; deliveries: number; missing: number; uncoveredClasses: string | null;
  }> = [];
  try {
    staffingRows = await db.select({
    courseId: courses.id,
    deliveries: sql<number>`count(distinct ${courseSectionDeliveries.id})::int`,
    missing: sql<number>`count(distinct case when ${courseTeachingAssignments.id}
      is null then ${courseSectionDeliveries.id} end)::int`,
    uncoveredClasses: sql<string | null>`string_agg(distinct case when ${courseTeachingAssignments.id} is null then ${sections.name} end, ', ')`,
  }).from(courses)
    .innerJoin(departments, eq(departments.id, courses.departmentId))
    .innerJoin(courseOfferings, eq(courseOfferings.courseId, courses.id))
    .innerJoin(academicPeriods, eq(academicPeriods.id, courseOfferings.academicPeriodId))
    .innerJoin(courseSectionDeliveries, and(
      eq(courseSectionDeliveries.offeringId, courseOfferings.id),
      isNull(courseSectionDeliveries.endedAt)))
    .innerJoin(sections, and(eq(sections.id, courseSectionDeliveries.sectionId),
      eq(sections.status, "ACTIVE")))
    .leftJoin(courseTeachingAssignments, and(
      eq(courseTeachingAssignments.deliveryId, courseSectionDeliveries.id),
      isNull(courseTeachingAssignments.endedAt)))
    .where(and(eq(departments.collegeId, membership.collegeId),
      eq(academicPeriods.collegeId, membership.collegeId),
      eq(academicPeriods.status, "ACTIVE"),
      eq(courseOfferings.status, "ACTIVE"), eq(courses.status, "ACTIVE")))
    .groupBy(courses.id);
  } catch {
    // Legacy also treats the staffing endpoint as a soft dependency. The
    // unmapped curriculum still renders and can be corrected independently.
    staffingAvailable = false;
  }
  const staffByCourse = new Map(staffingRows.map(row => [row.courseId, row]));
  return { terms, courses: courseChoices, staffingAvailable,
    mapped: mapped.map(row => {
      const staffing = staffByCourse.get(row.courseId);
      const warning = !staffingAvailable ? "Faculty staffing warnings unavailable"
        : !staffing || staffing.deliveries === 0 ? "No faculty assigned"
        : staffing.missing === 0 ? null
        : staffing.missing === staffing.deliveries ? "No faculty assigned"
        : `No faculty for ${staffing.missing} of ${staffing.deliveries} classes`;
      return { ...row, staffingWarning: warning,
        staffingTooltip: !staffingAvailable
          ? "Staffing could not be loaded. Refresh to retry."
          : staffing?.uncoveredClasses || (!staffing ? "No active class deliveries" : null),
        // Supplement the legacy class-count report without conflating data
        // sources: each number here covers CURRENT active course deliveries.
        staffingSource: "ACTIVE_DELIVERIES" as const,
        staffingAvailable,
        totalClasses: staffingAvailable ? staffing?.deliveries ?? 0 : null,
        unstaffedClassCount: staffingAvailable ? staffing?.missing ?? 0 : null,
        unstaffedClasses: staffingAvailable ? staffing?.uncoveredClasses ?? null : null,
        fullyUnstaffed: staffingAvailable ? (!staffing || staffing.missing === staffing.deliveries) : null,
      };
    }),
  };
}

export async function addCollegeTermMapping(context: RequestContext, raw: unknown) {
  const input = collegeTermCourseAddSchema.parse(raw);
  const membership = await ownCollege(context);
  try {
    return await getDb().transaction(async tx => {
      const term = await lockTerm(tx, input.programTermId, membership.collegeId);
      const [course] = await tx.select({ id: courses.id }).from(courses)
        .innerJoin(departments, and(eq(departments.id, courses.departmentId),
          eq(departments.collegeId, membership.collegeId), isNull(departments.archivedAt)))
        .where(and(eq(courses.id, input.courseId), eq(courses.status, "ACTIVE")))
        .limit(1);
      if (!course) throw new CollegeTermMappingError("COURSE_NOT_FOUND");
      const rows = await tx.select({
        id: programTermCourses.id, courseId: programTermCourses.courseId,
        displayOrder: programTermCourses.displayOrder,
      }).from(programTermCourses).where(eq(programTermCourses.programTermId, term.id));
      if (rows.some(row => row.courseId === course.id))
        throw new CollegeTermMappingError("TERM_COURSE_DUPLICATE");
      const [inserted] = await tx.insert(programTermCourses).values({
        programTermId: term.id, courseId: course.id, type: input.type,
        credits: input.credits, displayOrder: nextTermCourseOrder(rows.map(x => x.displayOrder)),
      }).returning();
      await recordActivityEventInTransaction(tx, context, {
        eventType: ACTIVITY_EVENT_TYPES.ACADEMICS_SEMESTER_UPDATED,
        collegeId: membership.collegeId, organizationId: membership.organizationId,
        subjectType: "program_term_course", subjectId: inserted.id,
        summary: "Course mapped to semester",
        metadata: { action: "SEMESTER_COURSE_ADD", termId: term.id, courseId: course.id, type: inserted.type,
          credits: inserted.credits, displayOrder: inserted.displayOrder },
      });
      return inserted;
    });
  } catch(error) { return mapConflict(error); }
}


/** Edit mapped credits/order with a single tenant-authorized, term-locked transaction.
 * Every existing mapping on the term is renumbered deterministically; other terms
 * and colleges cannot be moved or changed via caller-supplied IDs. */
export async function updateCollegeTermMapping(
  context: RequestContext, mappingIdRaw: unknown, raw: unknown,
) {
  const mappingId = collegeTermCourseIdSchema.parse(mappingIdRaw);
  const input = collegeTermCourseUpdateSchema.parse(raw);
  const member = await ownCollege(context);
  try {
    return await getDb().transaction(async tx => {
      const [subject] = await tx.select({
        id: programTermCourses.id, termId: programTermCourses.programTermId,
      }).from(programTermCourses)
        .innerJoin(programTerms, eq(programTerms.id, programTermCourses.programTermId))
        .innerJoin(programs, eq(programs.id, programTerms.programId))
        .innerJoin(departments, and(
          eq(departments.id, programs.departmentId),
          eq(departments.collegeId, member.collegeId),
        )).where(eq(programTermCourses.id, mappingId)).limit(1);
      if (!subject) throw new CollegeTermMappingError("TERM_COURSE_NOT_FOUND");
      await lockTerm(tx, subject.termId, member.collegeId);
      const before = await tx.select({
        id: programTermCourses.id,
        displayOrder: programTermCourses.displayOrder,
        credits: programTermCourses.credits,
      }).from(programTermCourses)
        .where(eq(programTermCourses.programTermId, subject.termId))
        .orderBy(asc(programTermCourses.displayOrder), asc(programTermCourses.id))
        .for("update");
      const current = before.find(row => row.id === mappingId);
      if (!current) throw new CollegeTermMappingError("TERM_COURSE_NOT_FOUND");
      if (input.position > before.length)
        throw new CollegeTermMappingError("TERM_COURSE_POSITION_INVALID");
      const order = reorderTermCourseIds(before.map(row => row.id), mappingId, input.position);
      for (const [index, id] of order.entries()) {
        const row = before.find(item => item.id === id)!;
        if (row.displayOrder !== index + 1 || (id === mappingId && row.credits !== input.credits)) {
          await tx.update(programTermCourses)
            .set({
              displayOrder: index + 1,
              ...(id === mappingId ? { credits: input.credits } : {}),
              updatedAt: new Date(),
            })
            .where(and(eq(programTermCourses.id, id),
              eq(programTermCourses.programTermId, subject.termId)));
        }
      }
      await recordActivityEventInTransaction(tx, context, {
        eventType: ACTIVITY_EVENT_TYPES.ACADEMICS_SEMESTER_UPDATED,
        collegeId: member.collegeId, organizationId: member.organizationId,
        subjectType: "program_term_course", subjectId: mappingId,
        summary: "Semester course mapping updated",
        metadata: {
          action: current.displayOrder !== input.position ? "SEMESTER_COURSE_REORDER" : "SEMESTER_COURSE_UPDATE",
          termId: subject.termId,
          fromCredits: current.credits,
          toCredits: input.credits,
          fromOrder: current.displayOrder,
          toOrder: input.position,
        },
      });
      return { id: mappingId, credits: input.credits, displayOrder: input.position };
    });
  } catch (error) { return mapConflict(error); }
}

export async function removeCollegeTermMapping(
  context: RequestContext, mappingIdRaw: unknown, raw: unknown,
) {
  const mappingId = collegeTermCourseIdSchema.parse(mappingIdRaw);
  collegeTermCourseUnmapSchema.parse(raw);
  const member = await ownCollege(context);
  try {
    return await getDb().transaction(async tx => {
      const [subject] = await tx.select({
        id: programTermCourses.id, termId: programTermCourses.programTermId,
      }).from(programTermCourses)
        .innerJoin(programTerms, eq(programTerms.id, programTermCourses.programTermId))
        .innerJoin(programs, eq(programs.id, programTerms.programId))
        .innerJoin(departments, and(eq(departments.id, programs.departmentId),
          eq(departments.collegeId, member.collegeId)))
        .where(eq(programTermCourses.id, mappingId)).limit(1);
      if (!subject) throw new CollegeTermMappingError("TERM_COURSE_NOT_FOUND");
      const term = await lockTerm(tx, subject.termId, member.collegeId);
      const [row] = await tx.select().from(programTermCourses)
        .where(and(eq(programTermCourses.id, mappingId),
          eq(programTermCourses.programTermId, term.id)))
        .for("update").limit(1);
      if (!row) throw new CollegeTermMappingError("TERM_COURSE_NOT_FOUND");
      const [activeOffering] = await tx.select({ id: courseOfferings.id }).from(courseOfferings)
        .innerJoin(cohorts, and(eq(cohorts.id, courseOfferings.cohortId),
          eq(cohorts.programId, term.programId), eq(cohorts.status, "ACTIVE")))
        .innerJoin(cohortProgressionState, and(
          eq(cohortProgressionState.cohortId, cohorts.id),
          eq(cohortProgressionState.currentTermNumber, term.termNumber),
        ))
        .where(and(eq(courseOfferings.courseId, row.courseId),
          eq(courseOfferings.status, "ACTIVE")))
        .limit(1);
      // Legacy allowed deletion despite current usage. vNext deliberately
      // preserves live batch offering integrity: reject before deletion and
      // show TERM_COURSE_IN_USE in the caller's confirmation workflow.
      if (activeOffering) throw new CollegeTermMappingError("TERM_COURSE_IN_USE");
      const [removed] = await tx.delete(programTermCourses).where(eq(programTermCourses.id, row.id)).returning();
      await recordActivityEventInTransaction(tx, context, {
        eventType: ACTIVITY_EVENT_TYPES.ACADEMICS_SEMESTER_UPDATED,
        collegeId: member.collegeId, organizationId: member.organizationId,
        subjectType: "program_term_course", subjectId: removed.id,
        summary: "Course unmapped from semester",
        metadata: { action: "SEMESTER_COURSE_REMOVE", termId: term.id, courseId: removed.courseId },
      });
      return { id: removed.id };
    });
  } catch(error) { return mapConflict(error); }
}

/** Atomically add several courses to one semester, preserving display order.
 * A failed eligibility or duplicate check rolls back all selected courses.
 * This intentionally differs from old partial-success duplicate skipping:
 * return a clear conflict rather than silently omitting selected courses.
 * The UI/route must surface the all-or-nothing contract before confirmation.
 */
export async function addCollegeTermMappings(context: RequestContext, raw: unknown) {
  const inputs = z.array(collegeTermCourseAddSchema).min(1).max(100).parse(raw);
  const targetTerm = inputs[0]!.programTermId;
  if (inputs.some(input => input.programTermId !== targetTerm))
    throw new CollegeTermMappingError("TERM_BULK_MIXED_SEMESTERS");
  const courseIds = inputs.map(input => input.courseId);
  if (new Set(courseIds).size !== courseIds.length)
    throw new CollegeTermMappingError("TERM_COURSE_DUPLICATE");
  const member = await ownCollege(context);
  try {
    return await getDb().transaction(async tx => {
      const term = await lockTerm(tx, targetTerm, member.collegeId);
      const available = await tx.select({ id: courses.id }).from(courses)
        .innerJoin(departments, and(eq(departments.id, courses.departmentId),
          eq(departments.collegeId, member.collegeId), isNull(departments.archivedAt)))
        .where(and(inArray(courses.id, courseIds), eq(courses.status, "ACTIVE")));
      if (available.length !== courseIds.length)
        throw new CollegeTermMappingError("COURSE_NOT_FOUND");
      const existing = await tx.select({ courseId: programTermCourses.courseId,
        displayOrder: programTermCourses.displayOrder }).from(programTermCourses)
        .where(eq(programTermCourses.programTermId, term.id)).for("update");
      if (existing.some(row => courseIds.includes(row.courseId)))
        throw new CollegeTermMappingError("TERM_COURSE_DUPLICATE");
      let next = nextTermCourseOrder(existing.map(row => row.displayOrder));
      const inserted = [];
      for (const input of inputs) {
        const [row] = await tx.insert(programTermCourses).values({
          programTermId: term.id, courseId: input.courseId, type: input.type,
          credits: input.credits, displayOrder: next++,
        }).returning();
        if (!row) throw new CollegeTermMappingError("TERM_COURSE_INSERT_FAILED");
        inserted.push(row);
      }
      await recordActivityEventInTransaction(tx, context, {
        eventType: ACTIVITY_EVENT_TYPES.ACADEMICS_SEMESTER_UPDATED,
        collegeId: member.collegeId, organizationId: member.organizationId,
        subjectType: "program_term", subjectId: term.id,
        summary: "Courses mapped to semester",
        metadata: { action: "SEMESTER_COURSE_ADD", courseIds, count: inserted.length, atomic: true },
      });
      return inserted;
    });
  } catch (error) { return mapConflict(error); }
}
