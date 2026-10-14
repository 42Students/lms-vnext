import "server-only";

import { and, asc, eq, isNull } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { getDb } from "@/db/client";
import {
  cohortProgressionState, cohorts, courseOfferings, courses, departments,
  programTermCourses, programTerms, programs,
} from "@/db/schema";
import { hasMembershipRole, type RequestContext } from "@/modules/identity/context";
import { AuthorizationError, can, requirePermission } from "@/modules/permissions/policy";
import { recordActivityEventInTransaction } from "@/modules/activity/service";
import { ACTIVITY_EVENT_TYPES } from "@/modules/activity/taxonomy";
import {
  collegeTermCourseAddSchema, collegeTermCourseIdSchema,
  collegeTermCourseUnmapSchema, nextTermCourseOrder,
} from "./college-term-mapping-model";

const courseDepartment = alias(departments, "college_term_course_department");

export class CollegeTermMappingError extends Error {
  constructor(public readonly code: string) { super(code); this.name = "CollegeTermMappingError"; }
}

function ownCollege(context: RequestContext) {
  const membership = context.membership;
  if (!membership || !hasMembershipRole(context, "COLLEGE_ADMIN") ||
      !can(context, "academics.manage", {
        collegeId: membership.collegeId, organizationId: membership.organizationId,
      })) throw new AuthorizationError("academics.manage");
  requirePermission(context, "academics.manage", {
    collegeId: membership.collegeId, organizationId: membership.organizationId,
  });
  return membership;
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
  const membership = ownCollege(context);
  const db = getDb();
  const [terms, courseChoices, mapped] = await Promise.all([
    db.select({
      id: programTerms.id, name: programTerms.name, termNumber: programTerms.termNumber,
      programName: programs.name, programId: programs.id, isActive: programTerms.isActive,
    }).from(programTerms)
      .innerJoin(programs, eq(programs.id, programTerms.programId))
      .innerJoin(departments, and(eq(departments.id, programs.departmentId),
        eq(departments.collegeId, membership.collegeId)))
      .orderBy(asc(programs.name), asc(programTerms.termNumber)),
    db.select({ id: courses.id, name: courses.name, code: courses.code })
      .from(courses)
      .innerJoin(departments, and(eq(departments.id, courses.departmentId),
        eq(departments.collegeId, membership.collegeId)))
      .where(eq(courses.status, "ACTIVE")).orderBy(asc(courses.name)),
    db.select({
      id: programTermCourses.id, termId: programTerms.id,
      termNumber: programTerms.termNumber, termName: programTerms.name,
      programName: programs.name, courseName: courses.name, courseCode: courses.code,
      type: programTermCourses.type, credits: programTermCourses.credits,
      displayOrder: programTermCourses.displayOrder,
    }).from(programTermCourses)
      .innerJoin(programTerms, eq(programTerms.id, programTermCourses.programTermId))
      .innerJoin(programs, eq(programs.id, programTerms.programId))
      .innerJoin(departments, and(eq(departments.id, programs.departmentId),
        eq(departments.collegeId, membership.collegeId)))
      .innerJoin(courses, eq(courses.id, programTermCourses.courseId))
      .innerJoin(courseDepartment, and(
        eq(courseDepartment.id, courses.departmentId),
        eq(courseDepartment.collegeId, membership.collegeId),
      ))
      .orderBy(asc(programs.name), asc(programTerms.termNumber), asc(programTermCourses.displayOrder)),
  ]);
  return { terms, courses: courseChoices, mapped };
}

export async function addCollegeTermMapping(context: RequestContext, raw: unknown) {
  const input = collegeTermCourseAddSchema.parse(raw);
  const membership = ownCollege(context);
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
        metadata: { termId: term.id, courseId: course.id, type: inserted.type,
          credits: inserted.credits, displayOrder: inserted.displayOrder },
      });
      return inserted;
    });
  } catch(error) { return mapConflict(error); }
}

export async function removeCollegeTermMapping(
  context: RequestContext, mappingIdRaw: unknown, raw: unknown,
) {
  const mappingId = collegeTermCourseIdSchema.parse(mappingIdRaw);
  collegeTermCourseUnmapSchema.parse(raw);
  const member = ownCollege(context);
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
      if (activeOffering) throw new CollegeTermMappingError("TERM_COURSE_IN_USE");
      const [removed] = await tx.delete(programTermCourses).where(eq(programTermCourses.id, row.id)).returning();
      await recordActivityEventInTransaction(tx, context, {
        eventType: ACTIVITY_EVENT_TYPES.ACADEMICS_SEMESTER_UPDATED,
        collegeId: member.collegeId, organizationId: member.organizationId,
        subjectType: "program_term_course", subjectId: removed.id,
        summary: "Course unmapped from semester",
        metadata: { termId: term.id, courseId: removed.courseId },
      });
      return { id: removed.id };
    });
  } catch(error) { return mapConflict(error); }
}
