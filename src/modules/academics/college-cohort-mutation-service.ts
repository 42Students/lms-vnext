import "server-only";

import { and, eq, isNull, sql } from "drizzle-orm";
import { getDb } from "@/db/client";
import {
  academicPeriods,
  cohorts,
  cohortProgressionEvents,
  courseOfferings,
  departments,
  learnerProgramEnrollments,
  organizations,
  colleges,
  programs,
  sections,
} from "@/db/schema";
import { recordActivityEventInTransaction } from "@/modules/activity/service";
import { ACTIVITY_EVENT_TYPES } from "@/modules/activity/taxonomy";
import type { RequestContext } from "@/modules/identity/context";
import { resolveActingCollege } from "@/modules/permissions/acting-college";
import { AuthorizationError } from "@/modules/permissions/policy";
import { postgresConstraintName } from "./errors";
import {
  collegeCohortIdSchema,
  createCollegeCohortSchema,
  updateCollegeCohortSchema,
  validCohortPeriodRange,batchAcademicYearFromDates,
} from "./college-cohort-mutation-model";

export type CollegeCohortMutationCode =
  | "BATCH_PROGRAM_NOT_FOUND"
  | "BATCH_NOT_FOUND"
  | "BATCH_PERIOD_INVALID"
  | "BATCH_NAME_CONFLICT"
  | "BATCH_CODE_CONFLICT"
  | "BATCH_NOT_EDITABLE"
  | "BATCH_HAS_DEPENDENCIES";

export class CollegeCohortMutationError extends Error {
  constructor(public readonly code: CollegeCohortMutationCode) {
    super(code);
    this.name = "CollegeCohortMutationError";
  }
}

type Tx = Parameters<Parameters<ReturnType<typeof getDb>["transaction"]>[0]>[0];

async function ownCollege(context: RequestContext) {
  return resolveActingCollege(context, "academics.manage");
}

async function lockProgram(tx: Tx, programId: string, collegeId: string) {
  const [program] = await tx.select({
    id: programs.id,
    status: programs.status,
  }).from(programs)
    .innerJoin(departments, and(
      eq(departments.id, programs.departmentId),
      eq(departments.collegeId, collegeId),
      isNull(departments.archivedAt),
    ))
    .innerJoin(colleges, and(
      eq(colleges.id, departments.collegeId),
      eq(colleges.status, "ACTIVE"),
    ))
    .innerJoin(organizations, and(
      eq(organizations.id, colleges.organizationId),
      eq(organizations.status, "ACTIVE"),
    ))
    .where(eq(programs.id, programId)).for("update").limit(1);
  if (!program || program.status !== "ACTIVE") {
    throw new CollegeCohortMutationError("BATCH_PROGRAM_NOT_FOUND");
  }
  return program;
}

async function periodInCollege(tx: Tx, periodId: string, collegeId: string) {
  const [period] = await tx.select({
    id: academicPeriods.id, startDate: academicPeriods.startDate,
    endDate: academicPeriods.endDate, status: academicPeriods.status,
  }).from(academicPeriods)
    .where(and(eq(academicPeriods.id, periodId), eq(academicPeriods.collegeId, collegeId)))
    .for("share").limit(1);
  if (!period || period.status === "CLOSED") {
    throw new CollegeCohortMutationError("BATCH_PERIOD_INVALID");
  }
  return period;
}

async function ensureUnique(
  tx: Tx, programId: string, name: string, code: string, excludeId?: string,
) {
  const rows = await tx.select({
    id: cohorts.id, name: cohorts.name, code: cohorts.code,
  }).from(cohorts).where(and(
    eq(cohorts.programId, programId),
    sql`(lower(${cohorts.name}) = ${name.toLowerCase()} or lower(${cohorts.code}) = ${code.toLowerCase()})`,
  ));
  for (const row of rows) {
    if (row.id === excludeId) continue;
    if (row.name.toLowerCase() === name.toLowerCase()) {
      throw new CollegeCohortMutationError("BATCH_NAME_CONFLICT");
    }
    if (row.code.toLowerCase() === code.toLowerCase()) {
      throw new CollegeCohortMutationError("BATCH_CODE_CONFLICT");
    }
  }
}

function mapError(error: unknown): never {
  if (error instanceof CollegeCohortMutationError || error instanceof AuthorizationError) throw error;
  if (postgresConstraintName(error) === "cohorts_program_code_uq") {
    throw new CollegeCohortMutationError("BATCH_CODE_CONFLICT");
  }
  let cursor: unknown = error;
  for (let i = 0; i < 5 && cursor && typeof cursor === "object"; i++) {
    if ("code" in cursor && (cursor.code === "23503" || cursor.code === "23514")) {
      throw new CollegeCohortMutationError("BATCH_HAS_DEPENDENCIES");
    }
    cursor = "cause" in cursor ? cursor.cause : null;
  }
  throw error;
}

export async function createCollegeCohort(context: RequestContext, raw: unknown) {
  const input = createCollegeCohortSchema.parse(raw);
  const member = await ownCollege(context);
  try {
    return await getDb().transaction(async (tx) => {
      await lockProgram(tx, input.programId, member.collegeId);
      const start = await periodInCollege(tx, input.startPeriodId, member.collegeId);
      const expected = input.expectedEndPeriodId
        ? await periodInCollege(tx, input.expectedEndPeriodId, member.collegeId)
        : null;
      if (!validCohortPeriodRange(start.startDate, expected?.endDate ?? null)) {
        throw new CollegeCohortMutationError("BATCH_PERIOD_INVALID");
      }
      if(input.startDate&&input.endDate&&input.endDate<input.startDate)throw new CollegeCohortMutationError("BATCH_PERIOD_INVALID");
      await ensureUnique(tx, input.programId, input.name, input.code);
      const resolvedStart=input.startDate??start.startDate;
      const resolvedEnd=input.endDate??expected?.endDate??null;
      if(resolvedEnd&&resolvedEnd<resolvedStart)throw new CollegeCohortMutationError("BATCH_PERIOD_INVALID");
      const [created] = await tx.insert(cohorts).values({...input,
       startDate:resolvedStart,endDate:resolvedEnd,
       // Match legacy immediate activation for a live first term. The vNext
       // planned state remains mandatory for a future academic period.
       status:start.status==="ACTIVE"?"ACTIVE":"PLANNED",
       academicYear:input.academicYear??batchAcademicYearFromDates(resolvedStart,resolvedEnd),
      }).returning();
      // Registered DB-0051 trigger initializes the cohort progression row.
      await recordActivityEventInTransaction(tx, context, {
        eventType: ACTIVITY_EVENT_TYPES.ACADEMICS_BATCH_CREATED,
        collegeId: member.collegeId, organizationId: member.organizationId,
        subjectType: "cohort", subjectId: created.id,
        subjectLabel: created.name, summary: "Batch created",
        metadata: {
          programId: created.programId, code: created.code,
          startPeriodId: created.startPeriodId,
          expectedEndPeriodId: created.expectedEndPeriodId,
          academicYear:created.academicYear,startDate:created.startDate,endDate:created.endDate,
          initialTermNumber:1,initialStatus:created.status,
        },
      });
      return created;
    });
  } catch (error) { return mapError(error); }
}

export async function updateCollegeCohort(
  context: RequestContext, cohortIdInput: unknown, raw: unknown,
) {
  const cohortId = collegeCohortIdSchema.parse(cohortIdInput);
  const input = updateCollegeCohortSchema.parse(raw);
  const member = await ownCollege(context);
  try {
    return await getDb().transaction(async (tx) => {
      // Resolve parent before locking it, to serialize with program archive/edits.
      const [reference] = await tx.select({
        programId: cohorts.programId,
      }).from(cohorts)
        .innerJoin(programs, eq(programs.id, cohorts.programId))
        .innerJoin(departments, and(
          eq(departments.id, programs.departmentId),
          eq(departments.collegeId, member.collegeId),
        ))
        .where(eq(cohorts.id, cohortId)).limit(1);
      if (!reference) throw new CollegeCohortMutationError("BATCH_NOT_FOUND");
      await lockProgram(tx, reference.programId, member.collegeId);
      const [current] = await tx.select().from(cohorts)
        .where(and(eq(cohorts.id, cohortId), eq(cohorts.programId, reference.programId)))
        .for("update").limit(1);
      if (!current) throw new CollegeCohortMutationError("BATCH_NOT_FOUND");
      if (current.status === "ARCHIVED") {
        throw new CollegeCohortMutationError("BATCH_NOT_EDITABLE");
      }
      // A planned cohort may be edited only before any child/history exists.
      // SELECT returns ARRAYS: destructure each actual matching row.
      const [[section], [enrollment], [offering], [history]] = await Promise.all([
        tx.select({ id: sections.id }).from(sections)
          .where(eq(sections.cohortId, cohortId)).limit(1),
        tx.select({ id: learnerProgramEnrollments.id }).from(learnerProgramEnrollments)
          .where(eq(learnerProgramEnrollments.cohortId, cohortId)).limit(1),
        tx.select({ id: courseOfferings.id }).from(courseOfferings)
          .where(eq(courseOfferings.cohortId, cohortId)).limit(1),
        tx.select({ id: cohortProgressionEvents.id }).from(cohortProgressionEvents)
          .where(eq(cohortProgressionEvents.cohortId, cohortId)).limit(1),
      ]);
      // Labels may be corrected while a batch is in use. Changing a recorded
      // end period still requires an untouched batch to preserve academic history.
      if ((section || enrollment || offering || history) &&
          (input.expectedEndPeriodId !== current.expectedEndPeriodId ||
           (input.startDate!==undefined&&input.startDate!==current.startDate)||
           (input.endDate!==undefined&&input.endDate!==current.endDate))) {
        throw new CollegeCohortMutationError("BATCH_HAS_DEPENDENCIES");
      }
      const start = await periodInCollege(tx, current.startPeriodId, member.collegeId);
      const expected = input.expectedEndPeriodId
        ? await periodInCollege(tx, input.expectedEndPeriodId, member.collegeId)
        : null;
      if (!validCohortPeriodRange(start.startDate, expected?.endDate ?? null)) {
        throw new CollegeCohortMutationError("BATCH_PERIOD_INVALID");
      }
      if((input.startDate??current.startDate)&&(input.endDate??current.endDate)&&
         (input.endDate??current.endDate)! < (input.startDate??current.startDate)!)
        throw new CollegeCohortMutationError("BATCH_PERIOD_INVALID");
      await ensureUnique(tx, current.programId, input.name, input.code, cohortId);
      const [updated] = await tx.update(cohorts).set({
        name: input.name, code: input.code,
        expectedEndPeriodId: input.expectedEndPeriodId,
        startDate:input.startDate===undefined?(current.startDate??start.startDate):input.startDate,
        endDate:input.endDate===undefined?(expected?.endDate??current.endDate??null):input.endDate,
        academicYear:input.academicYear===undefined
          ?batchAcademicYearFromDates(input.startDate??current.startDate??start.startDate,input.endDate??expected?.endDate??current.endDate??null)
          :input.academicYear,
        updatedAt: new Date(),
      }).where(and(eq(cohorts.id, cohortId), eq(cohorts.programId, current.programId),
        eq(cohorts.status, current.status))).returning();
      if (!updated) throw new CollegeCohortMutationError("BATCH_NOT_FOUND");
      await recordActivityEventInTransaction(tx, context, {
        eventType: ACTIVITY_EVENT_TYPES.ACADEMICS_BATCH_UPDATED,
        collegeId: member.collegeId, organizationId: member.organizationId,
        subjectType: "cohort", subjectId: updated.id,
        subjectLabel: updated.name, summary: "Batch updated",
        metadata: {
          programId: updated.programId, fromName: current.name, fromCode: current.code,
          toCode: updated.code, expectedEndPeriodId: updated.expectedEndPeriodId,
          academicYear:updated.academicYear,startDate:updated.startDate,endDate:updated.endDate,
        },
      });
      return updated;
    });
  } catch (error) { return mapError(error); }
}
