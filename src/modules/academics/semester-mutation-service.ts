import "server-only";

import { and, eq, isNull, ne, sql } from "drizzle-orm";
import { getDb } from "@/db/client";
import { cohortProgressionState, cohorts, departments, programTermCourses, programTerms, programs } from "@/db/schema";
import { recordActivityEventInTransaction } from "@/modules/activity/service";
import { ACTIVITY_EVENT_TYPES } from "@/modules/activity/taxonomy";
import type { RequestContext } from "@/modules/identity/context";
import { resolveActingCollege } from "@/modules/permissions/acting-college";
import { AuthorizationError } from "@/modules/permissions/policy";
import {
  canCreateSemesterTerm,
  createCollegeSemesterSchema,
  deleteCollegeSemesterSchema,
  semesterIdSchema,
  updateCollegeSemesterSchema,
} from "./semester-mutation-model";
import { postgresConstraintName } from "./errors";

export type SemesterMutationErrorCode =
  | "SEMESTER_NOT_FOUND" | "PROGRAM_NOT_FOUND" | "SEMESTER_NUMBER_CONFLICT"
  | "SEMESTER_OUTSIDE_PROGRAM_DURATION" | "SEMESTER_HAS_COURSES"
  | "SEMESTER_HAS_ACTIVE_COHORTS" | "SEMESTER_DEPENDENCY_CONFLICT"
  | "SEMESTER_STALE" | "SEMESTER_ACTIVE_CURRICULUM"
  | "SEMESTER_COMPLETED_IMMUTABLE";

export class SemesterMutationError extends Error {
  constructor(public readonly code: SemesterMutationErrorCode) {
    super(code);
    this.name = "SemesterMutationError";
  }
}

async function scopedCollege(context: RequestContext) {
  return resolveActingCollege(context, "academics.manage");
}

type Tx = Parameters<Parameters<ReturnType<typeof getDb>["transaction"]>[0]>[0];

async function lockProgram(tx: Tx, programId: string, collegeId: string) {
  // UPDATE lock serializes changes in this program and prevents concurrent
  // parent-key references from bypassing dependency checks.
  const [program] = await tx.select({
    id: programs.id,
    name: programs.name,
    durationTerms: programs.durationTerms,
    status: programs.status,
  }).from(programs)
    .innerJoin(departments, and(
      eq(departments.id, programs.departmentId),
      eq(departments.collegeId, collegeId),
      isNull(departments.archivedAt),
    ))
    .where(eq(programs.id, programId))
    .for("update")
    .limit(1);
  if (!program || program.status !== "ACTIVE") {
    throw new SemesterMutationError("PROGRAM_NOT_FOUND");
  }
  return program;
}

async function lockedTerm(tx: Tx, termId: string, collegeId: string) {
  const [subject] = await tx.select({
    id: programTerms.id,
    programId: programTerms.programId,
  }).from(programTerms)
    .innerJoin(programs, eq(programs.id, programTerms.programId))
    .innerJoin(departments, and(
      eq(departments.id, programs.departmentId),
      eq(departments.collegeId, collegeId),
    ))
    .where(eq(programTerms.id, termId))
    .limit(1);
  if (!subject) throw new SemesterMutationError("SEMESTER_NOT_FOUND");
  await lockProgram(tx, subject.programId, collegeId);
  const [current] = await tx.select().from(programTerms)
    .where(and(eq(programTerms.id, termId), eq(programTerms.programId, subject.programId)))
    .for("update").limit(1);
  if (!current) throw new SemesterMutationError("SEMESTER_NOT_FOUND");
  return current;
}

function mapConstraint(error: unknown): never {
  if (error instanceof SemesterMutationError || error instanceof AuthorizationError) throw error;
  const constraint = postgresConstraintName(error);
  if (constraint === "program_terms_program_number_uq") {
    throw new SemesterMutationError("SEMESTER_NUMBER_CONFLICT");
  }
  if (constraint === "program_terms_term_number_ck") {
    throw new SemesterMutationError("SEMESTER_OUTSIDE_PROGRAM_DURATION");
  }
  if (constraint === "program_term_courses_term_course_uq") {
    throw new SemesterMutationError("SEMESTER_HAS_COURSES");
  }
  // Foreign-key guard is intentionally fail closed if a concurrent child appears.
  let current: unknown = error;
  for (let i = 0; i < 5 && current && typeof current === "object"; i++) {
    if ("code" in current && current.code === "23503") {
      throw new SemesterMutationError("SEMESTER_DEPENDENCY_CONFLICT");
    }
    current = "cause" in current ? current.cause : null;
  }
  throw error;
}

export async function createCollegeSemester(context: RequestContext, rawInput: unknown) {
  const input = createCollegeSemesterSchema.parse(rawInput);
  const member = await scopedCollege(context);
  try {
    return await getDb().transaction(async tx => {
      const program = await lockProgram(tx, input.programId, member.collegeId);
      if (!canCreateSemesterTerm(input.termNumber, program.durationTerms)) {
        throw new SemesterMutationError("SEMESTER_OUTSIDE_PROGRAM_DURATION");
      }
      // program_terms stores name and totalCredits as the vNext semester
      // contract; legacy start/end dates, status and course IDs are archival
      // source fields, not an editable new-semester payload. Do not silently
      // coerce a legacy integer ID or course list into a new UUID relation.
      const [created] = await tx.insert(programTerms).values({
        programId: program.id,
        termNumber: input.termNumber,
        name: input.name,
        totalCredits: input.totalCredits ?? null,
      }).returning();
      await recordActivityEventInTransaction(tx, context, {
        eventType: ACTIVITY_EVENT_TYPES.ACADEMICS_SEMESTER_CREATED,
        collegeId: member.collegeId,
        organizationId: member.organizationId,
        subjectType: "program_term",
        subjectId: created.id,
        subjectLabel: created.name,
        summary: "Semester created",
        metadata: { programId: created.programId, termNumber: created.termNumber },
      });
      return created;
    });
  } catch (error) {
    return mapConstraint(error);
  }
}

export async function updateCollegeSemester(
  context: RequestContext, termIdInput: unknown, rawInput: unknown,
) {
  const termId = semesterIdSchema.parse(termIdInput);
  const input = updateCollegeSemesterSchema.parse(rawInput);
  const member = await scopedCollege(context);
  try {
    return await getDb().transaction(async tx => {
      const current = await lockedTerm(tx, termId, member.collegeId);
      const [version] = await tx.select({id:programTerms.id}).from(programTerms)
        .where(and(eq(programTerms.id,current.id),
          sql`date_trunc('milliseconds',${programTerms.updatedAt}) = ${input.expectedUpdatedAt}::timestamptz`))
        .limit(1);
      if(!version)throw new SemesterMutationError("SEMESTER_STALE");
      if (current.legacyStructureStatus === "COMPLETED" && input.isActive !== current.isActive) {
        throw new SemesterMutationError("SEMESTER_COMPLETED_IMMUTABLE");
      }
      if(current.isActive && !input.isActive){
        const [[mapped],[live]] = await Promise.all([
          tx.select({id:programTermCourses.id}).from(programTermCourses)
            .where(eq(programTermCourses.programTermId,current.id)).limit(1),
          tx.select({id:cohorts.id}).from(cohorts)
            .innerJoin(cohortProgressionState,eq(cohortProgressionState.cohortId,cohorts.id))
            .where(and(eq(cohorts.programId,current.programId),
              ne(cohorts.status,"ARCHIVED"),
              eq(cohortProgressionState.currentTermNumber,current.termNumber)))
            .limit(1),
        ]);
        if(mapped||live)throw new SemesterMutationError("SEMESTER_ACTIVE_CURRICULUM");
      }
      const deactivatedSiblings: { id: string; termNumber: number }[] = [];
      if (input.isActive && !current.isActive) {
        // The parent program is locked in lockedTerm(), serializing status
        // changes for all terms of the SAME program. "Completed" import
        // history is immutable and must not be collapsed into isActive.
        const siblings = await tx.select({
          id: programTerms.id,
          termNumber: programTerms.termNumber,
          name: programTerms.name,
          legacyStructureStatus: programTerms.legacyStructureStatus,
        }).from(programTerms)
          .where(and(
            eq(programTerms.programId, current.programId),
            ne(programTerms.id, current.id),
            eq(programTerms.isActive, true),
          ))
          .for("update");
        for (const sibling of siblings) {
          if (sibling.legacyStructureStatus === "COMPLETED") continue;
          // vNext has a stricter active-curriculum dependency guard than
          // the legacy status cascade. Fail the whole transition rather than
          // disable a course-linked/current-cohort term without a decision.
          const [[mapped], [live]] = await Promise.all([
            tx.select({ id: programTermCourses.id }).from(programTermCourses)
              .where(eq(programTermCourses.programTermId, sibling.id)).limit(1),
            tx.select({ id: cohorts.id }).from(cohorts)
              .innerJoin(cohortProgressionState,
                eq(cohortProgressionState.cohortId, cohorts.id))
              .where(and(eq(cohorts.programId, current.programId),
                ne(cohorts.status, "ARCHIVED"),
                eq(cohortProgressionState.currentTermNumber, sibling.termNumber)))
              .limit(1),
          ]);
          if (mapped || live) throw new SemesterMutationError("SEMESTER_ACTIVE_CURRICULUM");
          await tx.update(programTerms)
            .set({
              isActive: false,
              updatedAt: sql<Date>`greatest(${programTerms.updatedAt}+interval '1 millisecond',clock_timestamp())`,
            })
            .where(and(eq(programTerms.id, sibling.id),
              eq(programTerms.programId, current.programId)));
          deactivatedSiblings.push({ id: sibling.id, termNumber: sibling.termNumber });
          await recordActivityEventInTransaction(tx, context, {
            eventType: ACTIVITY_EVENT_TYPES.ACADEMICS_SEMESTER_UPDATED,
            collegeId: member.collegeId,
            organizationId: member.organizationId,
            subjectType: "program_term",
            subjectId: sibling.id,
            subjectLabel: sibling.name,
            summary: "Semester marked inactive by activation",
            metadata: { programId: current.programId, termNumber: sibling.termNumber, activatedTermId: current.id },
          });
        }
      }
      const [updated] = await tx.update(programTerms).set({
        name: input.name,
        totalCredits: input.totalCredits,
        isActive: input.isActive,
        updatedAt: sql<Date>`greatest(${programTerms.updatedAt}+interval '1 millisecond',clock_timestamp())`,
      }).where(and(eq(programTerms.id, termId), eq(programTerms.programId, current.programId)))
        .returning();
      if (!updated) throw new SemesterMutationError("SEMESTER_NOT_FOUND");
      await recordActivityEventInTransaction(tx, context, {
        eventType: ACTIVITY_EVENT_TYPES.ACADEMICS_SEMESTER_UPDATED,
        collegeId: member.collegeId,
        organizationId: member.organizationId,
        subjectType: "program_term",
        subjectId: updated.id,
        subjectLabel: updated.name,
        summary: "Semester updated",
        metadata: {
          programId: updated.programId, termNumber: updated.termNumber,
          fromName: current.name, isActive: updated.isActive,
          deactivatedSiblings, activationSerializedByProgram: true,
        },
      });
      return updated;
    });
  } catch (error) {
    return mapConstraint(error);
  }
}

export async function deleteCollegeSemester(
  context: RequestContext, termIdInput: unknown, rawInput: unknown,
) {
  const termId = semesterIdSchema.parse(termIdInput);
  deleteCollegeSemesterSchema.parse(rawInput);
  const member = await scopedCollege(context);
  try {
    return await getDb().transaction(async tx => {
      const current = await lockedTerm(tx, termId, member.collegeId);
      const [courseDependency] = await tx.select({ id: programTermCourses.id })
        .from(programTermCourses)
        .where(eq(programTermCourses.programTermId, current.id))
        .limit(1);
      if (courseDependency) throw new SemesterMutationError("SEMESTER_HAS_COURSES");
      // Cohort term progression has no direct term FK; fail closed for any live
      // cohort rather than silently sever an academic progression reference.
      const [liveCohort] = await tx.select({ id: cohorts.id }).from(cohorts)
        .where(and(eq(cohorts.programId, current.programId), ne(cohorts.status, "ARCHIVED")))
        .limit(1);
      if (liveCohort) throw new SemesterMutationError("SEMESTER_HAS_ACTIVE_COHORTS");
      const [deleted] = await tx.delete(programTerms)
        .where(and(eq(programTerms.id, current.id), eq(programTerms.programId, current.programId)))
        .returning();
      if (!deleted) throw new SemesterMutationError("SEMESTER_NOT_FOUND");
      await recordActivityEventInTransaction(tx, context, {
        eventType: ACTIVITY_EVENT_TYPES.ACADEMICS_SEMESTER_DELETED,
        collegeId: member.collegeId,
        organizationId: member.organizationId,
        subjectType: "program_term",
        subjectId: deleted.id,
        subjectLabel: deleted.name,
        summary: "Semester deleted",
        metadata: { programId: deleted.programId, termNumber: deleted.termNumber },
      });
      return { id: deleted.id };
    });
  } catch (error) {
    return mapConstraint(error);
  }
}
