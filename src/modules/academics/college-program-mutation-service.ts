import "server-only";

import { and, desc, eq, isNull, sql } from "drizzle-orm";
import { getDb } from "@/db/client";
import {
  cohorts,
  cohortProgressionState,
  colleges,
  departments,
  learnerProgramEnrollments,
  organizations,
  programs,
  programTerms,
} from "@/db/schema";
import type { RequestContext } from "@/modules/identity/context";
import { resolveActingCollege } from "@/modules/permissions/acting-college";
import { AuthorizationError } from "@/modules/permissions/policy";
import { recordActivityEventInTransaction } from "@/modules/activity/service";
import { ACTIVITY_EVENT_TYPES } from "@/modules/activity/taxonomy";
import { postgresConstraintName } from "./errors";
import {
  archiveCollegeProgramSchema,
  canReduceProgramDuration,
  collegeProgramIdSchema,
  createCollegeProgramSchema,
  updateCollegeProgramSchema,
  restoreCollegeProgramSchema,
} from "./college-program-mutation-model";

export type CollegeProgramMutationErrorCode =
  | "PROGRAM_NOT_FOUND"
  | "DEPARTMENT_NOT_FOUND"
  | "PROGRAM_NAME_CONFLICT"
  | "PROGRAM_CODE_CONFLICT"
  | "PROGRAM_DURATION_HAS_DEPENDENCIES"
  | "PROGRAM_HAS_COHORTS"
  | "PROGRAM_HAS_ENROLLMENTS"
  | "PROGRAM_HAS_SEMESTERS"
  | "PROGRAM_DEPENDENCY_CONFLICT";

export class CollegeProgramMutationError extends Error {
  constructor(public readonly code: CollegeProgramMutationErrorCode) {
    const copy:Partial<Record<CollegeProgramMutationErrorCode,string>>={
      PROGRAM_NAME_CONFLICT:"A program with this name already exists in this department.",
      PROGRAM_CODE_CONFLICT:"A program with this code already exists in this department.",
      PROGRAM_NOT_FOUND:"Program not found.",
      DEPARTMENT_NOT_FOUND:"Select an active department in your college.",
      PROGRAM_DEPENDENCY_CONFLICT:"This program has existing academic records. Move or archive the linked records before changing departments.",
      PROGRAM_DURATION_HAS_DEPENDENCIES:"The duration cannot be shorter than an existing semester or batch progression.",
      PROGRAM_HAS_COHORTS:"This program has batches and cannot be archived.",
      PROGRAM_HAS_ENROLLMENTS:"This program has learner enrollments and cannot be archived.",
      PROGRAM_HAS_SEMESTERS:"This program has semesters and cannot be archived.",
    };
    super(copy[code]??code);
    this.name = "CollegeProgramMutationError";
  }
}

type Tx = Parameters<Parameters<ReturnType<typeof getDb>["transaction"]>[0]>[0];

// SA-academics-people-R01: selected Super Admin college and College Admin membership share scoped mutations.
async function ownCollege(context: RequestContext) {
  return resolveActingCollege(context, "academics.manage");
}

async function lockedDepartment(tx: Tx, departmentId: string, collegeId: string) {
  const [department] = await tx.select({ id: departments.id })
    .from(departments)
    .innerJoin(colleges, eq(colleges.id, departments.collegeId))
    .innerJoin(organizations, eq(organizations.id, colleges.organizationId))
    .where(and(
      eq(departments.id, departmentId),
      eq(departments.collegeId, collegeId),
      isNull(departments.archivedAt),
      eq(colleges.status, "ACTIVE"),
      eq(organizations.status, "ACTIVE"),
    ))
    .for("update")
    .limit(1);
  if (!department) throw new CollegeProgramMutationError("DEPARTMENT_NOT_FOUND");
  return department;
}

async function lockedProgram(tx: Tx, programId: string, collegeId: string) {
  const [program] = await tx.select({
    id: programs.id,
    name: programs.name,
    code: programs.code,
    durationTerms: programs.durationTerms,
    status: programs.status,
    departmentId: programs.departmentId,
  }).from(programs)
    .innerJoin(departments, and(
      eq(departments.id, programs.departmentId),
      eq(departments.collegeId, collegeId),
      isNull(departments.archivedAt),
    ))
    .innerJoin(colleges, eq(colleges.id, departments.collegeId))
    .innerJoin(organizations, eq(organizations.id, colleges.organizationId))
    .where(and(
      eq(programs.id, programId),
      eq(colleges.status, "ACTIVE"),
      eq(organizations.status, "ACTIVE"),
    ))
    .for("update").limit(1);
  if (!program || program.status !== "ACTIVE") {
    throw new CollegeProgramMutationError("PROGRAM_NOT_FOUND");
  }
  return program;
}

async function ensureUnique(
  tx: Tx,
  departmentId: string,
  name: string,
  code: string,
  excludeId?: string,
) {
  const matches = await tx.select({
    id: programs.id, name: programs.name, code: programs.code,
  }).from(programs)
    .where(and(
      eq(programs.departmentId, departmentId),
      eq(programs.status, "ACTIVE"),
      // PostgreSQL lower() and explicit en-US folding provide predictable
      // ASCII legacy comparison; the active-name/code uniqueness is still
      // ultimately enforced by DB indexes for concurrent create/restore.
      sql`(lower(${programs.name}) = ${name.toLocaleLowerCase("en-US")} or lower(${programs.code}) = ${code.toLocaleLowerCase("en-US")})`,
    ));
  for (const row of matches) {
    if (row.id === excludeId) continue;
    if (row.name.toLocaleLowerCase("en-US") === name.toLocaleLowerCase("en-US")) {
      throw new CollegeProgramMutationError("PROGRAM_NAME_CONFLICT");
    }
    if (row.code.toLocaleLowerCase("en-US") === code.toLocaleLowerCase("en-US")) {
      throw new CollegeProgramMutationError("PROGRAM_CODE_CONFLICT");
    }
  }
}

function mapError(error: unknown): never {
  if (error instanceof CollegeProgramMutationError || error instanceof AuthorizationError) {
    throw error;
  }
  const constraint = postgresConstraintName(error);
  if (constraint === "programs_active_department_name_uq") {
    throw new CollegeProgramMutationError("PROGRAM_NAME_CONFLICT");
  }
  if (constraint === "programs_active_department_code_uq") {
    throw new CollegeProgramMutationError("PROGRAM_CODE_CONFLICT");
  }
  let cursor: unknown = error;
  for (let i = 0; i < 5 && cursor && typeof cursor === "object"; i++) {
    if ("code" in cursor && cursor.code === "23503") {
      throw new CollegeProgramMutationError("PROGRAM_DEPENDENCY_CONFLICT");
    }
    cursor = "cause" in cursor ? cursor.cause : null;
  }
  throw error;
}

export async function createCollegeProgram(context: RequestContext, raw: unknown) {
  const input = createCollegeProgramSchema.parse(raw);
  const member = await ownCollege(context);
  try {
    return await getDb().transaction(async tx => {
      await lockedDepartment(tx, input.departmentId, member.collegeId);
      await ensureUnique(tx, input.departmentId, input.name, input.code);
      const [created] = await tx.insert(programs).values(input).returning();
      await recordActivityEventInTransaction(tx, context, {
        eventType: ACTIVITY_EVENT_TYPES.ACADEMICS_PROGRAM_CREATED,
        organizationId: member.organizationId,
        collegeId: member.collegeId,
        subjectType: "program", subjectId: created.id,
        subjectLabel: created.name, summary: "Program created",
        metadata: {departmentId:created.departmentId,code:created.code,
          durationTerms:created.durationTerms,legacyProgramId:created.legacyProgramId,
          origin:"COLLEGE_PROGRAM_CREATE",visibility:"ACADEMIC_ADMIN_ONLY"},
      });
      return created;
    });
  } catch (error) { return mapError(error); }
}

export async function updateCollegeProgram(
  context: RequestContext, programIdInput: unknown, raw: unknown,
) {
  const programId = collegeProgramIdSchema.parse(programIdInput);
  const input = updateCollegeProgramSchema.parse(raw);
  const member = await ownCollege(context);
  try {
    return await getDb().transaction(async tx => {
      const current = await lockedProgram(tx, programId, member.collegeId);
      const nextDepartmentId = input.departmentId ?? current.departmentId;
      if (nextDepartmentId !== current.departmentId) {
        await lockedDepartment(tx, nextDepartmentId, member.collegeId);
        const [term, cohort, enrollment] = await Promise.all([
          tx.select({ id: programTerms.id }).from(programTerms).where(eq(programTerms.programId, current.id)).limit(1),
          tx.select({ id: cohorts.id }).from(cohorts).where(eq(cohorts.programId, current.id)).limit(1),
          tx.select({ id: learnerProgramEnrollments.id }).from(learnerProgramEnrollments).where(eq(learnerProgramEnrollments.programId, current.id)).limit(1),
        ]);
        if (term.length || cohort.length || enrollment.length)
          throw new CollegeProgramMutationError("PROGRAM_DEPENDENCY_CONFLICT");
      }
      await ensureUnique(tx, nextDepartmentId, input.name, input.code, current.id);
      if (input.durationTerms < current.durationTerms) {
        const [highestTerm] = await tx.select({ term: programTerms.termNumber }).from(programTerms)
          .where(eq(programTerms.programId, current.id))
          .orderBy(desc(programTerms.termNumber)).limit(1);
        const [highestCohort] = await tx.select({ term: cohortProgressionState.currentTermNumber })
          .from(cohortProgressionState)
          .innerJoin(cohorts, eq(cohorts.id, cohortProgressionState.cohortId))
          .where(eq(cohorts.programId, current.id))
          .orderBy(desc(cohortProgressionState.currentTermNumber)).limit(1);
        const highestReference = Math.max(highestTerm?.term ?? 0, highestCohort?.term ?? 0);
        if (!canReduceProgramDuration(input.durationTerms, highestReference)) {
          throw new CollegeProgramMutationError("PROGRAM_DURATION_HAS_DEPENDENCIES");
        }
      }
      const [updated] = await tx.update(programs).set({
        name: input.name, code: input.code, departmentId: nextDepartmentId, durationTerms: input.durationTerms,
        updatedAt: new Date(),
      }).where(and(eq(programs.id, current.id), eq(programs.status, "ACTIVE"))).returning();
      if (!updated) throw new CollegeProgramMutationError("PROGRAM_NOT_FOUND");
      await recordActivityEventInTransaction(tx, context, {
        eventType: ACTIVITY_EVENT_TYPES.ACADEMICS_PROGRAM_UPDATED,
        organizationId: member.organizationId, collegeId: member.collegeId,
        subjectType: "program", subjectId: updated.id,
        subjectLabel: updated.name, summary: "Program updated",
        metadata: {
          departmentId: updated.departmentId,
          previousDepartmentId: current.departmentId,
          fromName: current.name, fromCode: current.code,
          fromDurationTerms: current.durationTerms,
          toCode: updated.code, toDurationTerms: updated.durationTerms,
          legacyProgramId:updated.legacyProgramId,departmentMoveGuarded:true,
        },
      });
      return updated;
    });
  } catch (error) { return mapError(error); }
}

export async function archiveCollegeProgram(
  context: RequestContext, programIdInput: unknown, raw: unknown,
) {
  const programId = collegeProgramIdSchema.parse(programIdInput);
  archiveCollegeProgramSchema.parse(raw);
  const member = await ownCollege(context);
  try {
    return await getDb().transaction(async tx => {
      const current = await lockedProgram(tx, programId, member.collegeId);
      // Each SELECT returns a row ARRAY; [] is truthy. Destructure the first
      // matching row from each result, so an empty result permits archive.
      const [[cohort], [enrollment], [semester]] = await Promise.all([
        tx.select({ id: cohorts.id }).from(cohorts)
          .where(eq(cohorts.programId, current.id)).limit(1),
        tx.select({ id: learnerProgramEnrollments.id }).from(learnerProgramEnrollments)
          .where(eq(learnerProgramEnrollments.programId, current.id)).limit(1),
        tx.select({ id: programTerms.id }).from(programTerms)
          .where(eq(programTerms.programId, current.id)).limit(1),
      ]);
      // Fail closed even on archived/completed children: historical references persist.
      if (cohort) throw new CollegeProgramMutationError("PROGRAM_HAS_COHORTS");
      if (enrollment) throw new CollegeProgramMutationError("PROGRAM_HAS_ENROLLMENTS");
      if (semester) throw new CollegeProgramMutationError("PROGRAM_HAS_SEMESTERS");
      const [archived] = await tx.update(programs)
        .set({ status: "ARCHIVED", updatedAt: new Date() })
        .where(and(eq(programs.id, current.id), eq(programs.status, "ACTIVE"))).returning();
      if (!archived) throw new CollegeProgramMutationError("PROGRAM_NOT_FOUND");
      await recordActivityEventInTransaction(tx, context, {
        eventType: ACTIVITY_EVENT_TYPES.ACADEMICS_PROGRAM_ARCHIVED,
        organizationId: member.organizationId, collegeId: member.collegeId,
        subjectType: "program", subjectId: archived.id,
        subjectLabel: archived.name, summary: "Program archived",
        metadata: { departmentId: archived.departmentId, code: archived.code },
      });
      return archived;
    });
  } catch (error) { return mapError(error); }
}

/** Restoration is an explicit, confirmed action. Previously archived rows
 * stay in history; their names/codes cannot silently shadow live programs. */
export async function restoreCollegeProgram(
  context: RequestContext, programIdInput: unknown, raw: unknown,
) {
  const programId = collegeProgramIdSchema.parse(programIdInput);
  restoreCollegeProgramSchema.parse(raw);
  const member = await ownCollege(context);
  try {
    return await getDb().transaction(async tx => {
      const [current] = await tx.select({
        id: programs.id, departmentId: programs.departmentId,
        name: programs.name, code: programs.code, status: programs.status,
      }).from(programs)
        .innerJoin(departments, and(
          eq(departments.id, programs.departmentId),
          eq(departments.collegeId, member.collegeId),
          isNull(departments.archivedAt),
        ))
        .innerJoin(colleges, and(
          eq(colleges.id, departments.collegeId), eq(colleges.status, "ACTIVE"),
        ))
        .innerJoin(organizations, and(
          eq(organizations.id, colleges.organizationId),
          eq(organizations.status, "ACTIVE"),
        ))
        .where(eq(programs.id, programId))
        .for("update", { of: programs }).limit(1);
      if (!current || current.status !== "ARCHIVED")
        throw new CollegeProgramMutationError("PROGRAM_NOT_FOUND");
      // Archived rows do not reserve their old name/code, unlike hard-delete
      // era uniqueness. Restore is revalidated against every ACTIVE row.
      await ensureUnique(tx, current.departmentId, current.name, current.code, current.id);
      const [restored] = await tx.update(programs).set({
        status: "ACTIVE", updatedAt: new Date(),
      }).where(and(eq(programs.id, programId), eq(programs.status, "ARCHIVED")))
        .returning();
      if (!restored) throw new CollegeProgramMutationError("PROGRAM_NOT_FOUND");
      await recordActivityEventInTransaction(tx, context, {
        eventType: ACTIVITY_EVENT_TYPES.ACADEMICS_PROGRAM_UPDATED,
        collegeId: member.collegeId, organizationId: member.organizationId,
        subjectType: "program", subjectId: restored.id, subjectLabel: restored.name,
        summary: "College program restored",
        metadata: { action: "RESTORE", departmentId: restored.departmentId,
          fromStatus: "ARCHIVED", toStatus: "ACTIVE" },
      });
      return restored;
    });
  } catch (error) { return mapError(error); }
}

export async function listArchivedCollegePrograms(context: RequestContext) {
  const member = await ownCollege(context);
  return getDb().select({
    id: programs.id, name: programs.name, code: programs.code,
    departmentName: departments.name,
  }).from(programs).innerJoin(departments, and(
    eq(departments.id, programs.departmentId),
    eq(departments.collegeId, member.collegeId),
    isNull(departments.archivedAt),
  )).where(eq(programs.status, "ARCHIVED"))
    .orderBy(programs.name, programs.id).limit(100);
}
