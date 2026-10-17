import {
  and,
  asc,
  eq,
  sql,
} from "drizzle-orm";
import { getDb } from "@/db/client";
import {
  cohorts,
} from "@/db/schema";
import { recordActivityEventInTransaction } from "@/modules/activity/service";
import { ACTIVITY_EVENT_TYPES } from "@/modules/activity/taxonomy";
import type { RequestContext } from "@/modules/identity/context";
import { requirePermission } from "@/modules/permissions/policy";
import {
  AcademicsServiceError,
  postgresConstraintName,
} from "./errors";
import {
  loadAcademicPeriodScope,
  loadCohortScope,
  loadProgramScope,
} from "./scope";
import {
  cohortIdSchema,
  cohortTransitionSchema,
  createCohortInputSchema,
  programIdSchema,
  updateCohortInputSchema,
  type CreateCohortInput,
  type UpdateCohortInput,
} from "./validation";

async function assertCohortCodeUnique(
  programId: string,
  code: string,
  excludeId?: string,
) {
  const db = getDb();
  const conditions = [
    eq(cohorts.programId, programId),
    sql<boolean>`lower(${cohorts.code}) = ${code.toLowerCase()}`,
  ];

  if (excludeId) {
    conditions.push(
      sql<boolean>`${cohorts.id} <> ${excludeId}`,
    );
  }

  const [existing] = await db
    .select({ id: cohorts.id })
    .from(cohorts)
    .where(and(...conditions))
    .limit(1);

  if (existing) {
    throw new AcademicsServiceError(
      "COHORT_CODE_CONFLICT",
    );
  }
}

function mapCohortConstraint(error: unknown) {
  if (
    postgresConstraintName(error) ===
    "cohorts_program_code_uq"
  ) {
    return new AcademicsServiceError(
      "COHORT_CODE_CONFLICT",
    );
  }

  return error;
}

async function loadAndValidatePeriodWindow(
  collegeId: string,
  startPeriodId: string,
  expectedEndPeriodId?: string | null,
) {
  const start =
    await loadAcademicPeriodScope(startPeriodId);

  if (start.collegeId !== collegeId) {
    throw new AcademicsServiceError(
      "ACADEMIC_PERIOD_COLLEGE_MISMATCH",
    );
  }

  if (start.status === "CLOSED") {
    throw new AcademicsServiceError(
      "ACADEMIC_PERIOD_CLOSED",
    );
  }

  if (!expectedEndPeriodId) {
    return {
      start,
      expectedEnd: null,
    };
  }

  const expectedEnd =
    await loadAcademicPeriodScope(
      expectedEndPeriodId,
    );

  if (expectedEnd.collegeId !== collegeId) {
    throw new AcademicsServiceError(
      "ACADEMIC_PERIOD_COLLEGE_MISMATCH",
    );
  }

  if (expectedEnd.endDate < start.startDate) {
    throw new AcademicsServiceError(
      "COHORT_PERIOD_RANGE_INVALID",
    );
  }

  return {
    start,
    expectedEnd,
  };
}

export async function listCohorts(
  context: RequestContext,
  programIdInput: string,
) {
  const programId = programIdSchema.parse(
    programIdInput,
  );
  const program = await loadProgramScope(programId);

  requirePermission(context, "academics.read", {
    organizationId: program.organizationId,
    collegeId: program.collegeId,
  });

  const db = getDb();

  return db
    .select()
    .from(cohorts)
    .where(eq(cohorts.programId, programId))
    .orderBy(
      asc(cohorts.createdAt),
      asc(cohorts.name),
    );
}

export async function createCohort(
  context: RequestContext,
  rawInput: CreateCohortInput,
) {
  const input =
    createCohortInputSchema.parse(rawInput);
  const program = await loadProgramScope(
    input.programId,
  );

  requirePermission(context, "academics.manage", {
    organizationId: program.organizationId,
    collegeId: program.collegeId,
  });

  await loadAndValidatePeriodWindow(
    program.collegeId,
    input.startPeriodId,
    input.expectedEndPeriodId,
  );
  await assertCohortCodeUnique(
    input.programId,
    input.code,
  );

  const db = getDb();

  try {
    return await db.transaction(async (tx)=>{
    const [created] = await tx
      .insert(cohorts)
      .values({
        programId: input.programId,
        name: input.name,
        code: input.code,
        startPeriodId: input.startPeriodId,
        expectedEndPeriodId:
          input.expectedEndPeriodId ?? null,
      })
      .returning();

    if(!created)throw new Error("Unable to persist cohort mutation.");
    await recordActivityEventInTransaction(tx,context,{
      eventType:ACTIVITY_EVENT_TYPES.ACADEMICS_COHORT_CREATED,
      organizationId:program.organizationId,collegeId:program.collegeId,
      subjectType:"cohort",subjectId:created.id,subjectLabel:created.name,
      summary:"Cohort created",
      metadata:{code:created.code,status:created.status},
    });
    return created;
   });
  } catch (error) {
    throw mapCohortConstraint(error);
  }
}

export async function updateCohort(
  context: RequestContext,
  cohortIdInput: string,
  rawInput: UpdateCohortInput,
) {
  const cohortId =
    cohortIdSchema.parse(cohortIdInput);
  const input =
    updateCohortInputSchema.parse(rawInput);
  const current = await loadCohortScope(
    cohortId,
  );

  requirePermission(context, "academics.manage", {
    organizationId: current.organizationId,
    collegeId: current.collegeId,
  });

  if (current.status !== "PLANNED") {
    throw new AcademicsServiceError(
      "COHORT_NOT_MUTABLE",
    );
  }

  if (input.code) {
    await assertCohortCodeUnique(
      current.programId,
      input.code,
      cohortId,
    );
  }

  if (
    input.expectedEndPeriodId !== undefined
  ) {
    await loadAndValidatePeriodWindow(
      current.collegeId,
      current.startPeriodId,
      input.expectedEndPeriodId,
    );
  }

  const db = getDb();

  try {
    return await db.transaction(async (tx)=>{
    const [updated] = await tx
      .update(cohorts)
      .set({
        ...input,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(cohorts.id, cohortId),
          eq(cohorts.status, "PLANNED"),
        ),
      )
      .returning();

    if (!updated) {
      throw new AcademicsServiceError(
        "COHORT_NOT_FOUND",
      );
    }

    if(!updated)throw new Error("Unable to persist cohort mutation.");
    await recordActivityEventInTransaction(tx,context,{
      eventType:ACTIVITY_EVENT_TYPES.ACADEMICS_COHORT_UPDATED,
      organizationId:current.organizationId,collegeId:current.collegeId,
      subjectType:"cohort",subjectId:updated.id,subjectLabel:updated.name,
      summary:"Cohort updated",
      metadata:{previousStatus:current.status,code:updated.code},
    });
    return updated;
   });
  } catch (error) {
    if (error instanceof AcademicsServiceError) {
      throw error;
    }
    throw mapCohortConstraint(error);
  }
}

export async function transitionCohort(
  context: RequestContext,
  cohortIdInput: string,
  rawInput: unknown,
) {
  const cohortId =
    cohortIdSchema.parse(cohortIdInput);
  const input =
    cohortTransitionSchema.parse(rawInput);
  const current = await loadCohortScope(
    cohortId,
  );

  requirePermission(context, "academics.manage", {
    organizationId: current.organizationId,
    collegeId: current.collegeId,
  });

  let expectedStatus:
    | "PLANNED"
    | "ACTIVE"
    | "COMPLETED";
  let nextStatus:
    | "ACTIVE"
    | "COMPLETED"
    | "ARCHIVED";

  switch (input.action) {
    case "ACTIVATE":
      expectedStatus = "PLANNED";
      nextStatus = "ACTIVE";
      break;
    case "COMPLETE":
      expectedStatus = "ACTIVE";
      nextStatus = "COMPLETED";
      break;
    case "ARCHIVE":
      if (
        current.status !== "PLANNED" &&
        current.status !== "COMPLETED"
      ) {
        throw new AcademicsServiceError(
          "INVALID_COHORT_TRANSITION",
        );
      }
      expectedStatus = current.status;
      nextStatus = "ARCHIVED";
      break;
  }

  if (current.status !== expectedStatus) {
    throw new AcademicsServiceError(
      "INVALID_COHORT_TRANSITION",
    );
  }

  const db = getDb();
  return await db.transaction(async (tx)=>{
    const [updated] = await tx
    .update(cohorts)
    .set({
      status: nextStatus,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(cohorts.id, cohortId),
        eq(cohorts.status, expectedStatus),
      ),
    )
    .returning();

  if (!updated) {
    throw new AcademicsServiceError(
      "INVALID_COHORT_TRANSITION",
    );
  }

  if(!updated)throw new Error("Unable to persist cohort mutation.");
    await recordActivityEventInTransaction(tx,context,{
      eventType:ACTIVITY_EVENT_TYPES.ACADEMICS_COHORT_STATUS_CHANGED,
      organizationId:current.organizationId,collegeId:current.collegeId,
      subjectType:"cohort",subjectId:updated.id,subjectLabel:updated.name,
      summary:"Cohort status changed",
      metadata:{previousStatus:current.status,nextStatus:updated.status},
    });
    return updated;
   });
}
