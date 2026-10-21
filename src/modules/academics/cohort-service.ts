import {
  and,
  asc,
  desc,
  count,
  eq,
  sql,
} from "drizzle-orm";
import { getDb } from "@/db/client";
import { z } from "zod";
import {
  cohorts,
  cohortProgressionState,
  programs,
  departments,
} from "@/db/schema";
import { recordActivityEventInTransaction } from "@/modules/activity/service";
import { ACTIVITY_EVENT_TYPES } from "@/modules/activity/taxonomy";
import type { RequestContext } from "@/modules/identity/context";
import { requirePermission } from "@/modules/permissions/policy";
import { resolveActingCollege } from "@/modules/permissions/acting-college";
import { batchAcademicYearWithStartMonth } from "./college-cohort-mutation-model";
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

/** Legacy batch names are unique per program, ignoring case. */
async function assertCohortNameUnique(programId: string, name: string, excludeId?: string) {
  const conditions = [
    eq(cohorts.programId, programId),
    sql<boolean>`lower(${cohorts.name}) = ${name.toLocaleLowerCase("en-IN")}`,
    sql<boolean>`${cohorts.status} <> 'ARCHIVED'`,
    ...(excludeId ? [sql<boolean>`${cohorts.id} <> ${excludeId}`] : []),
  ];
  const [existing] = await getDb().select({ id: cohorts.id })
    .from(cohorts).where(and(...conditions)).limit(1);
  if (existing) throw new z.ZodError([{
    code: "custom", path: ["name"],
    message: `A batch named ${name} already exists for this program`,
  }]);
}

async function assertCohortCodeUnique(
  programId: string,
  code: string,
  excludeId?: string,
) {
  const db = getDb();
  const conditions = [
    eq(cohorts.programId, programId),
    sql<boolean>`lower(${cohorts.code}) = ${code.toLocaleLowerCase("en-IN")}`,
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

function mapCohortConstraint(error: unknown, name?: string) {
  if (postgresConstraintName(error) === "cohorts_program_active_name_uq") {
    return new z.ZodError([{ code: "custom", path: ["name"],
      message: `A batch named ${name ?? "this"} already exists for this program` }]);
  }
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
      desc(cohorts.createdAt),
      asc(cohorts.name),
      asc(cohorts.id),
    );
}

/** Authenticated batch-detail read for old /batches/{id} deep links.
 * Numeric imported IDs must be resolved via a trusted college-scoped map. */
export async function getCohortDetails(context:RequestContext,rawId:unknown){
  const id=cohortIdSchema.parse(rawId);
  const scope=await loadCohortScope(id);
  requirePermission(context,"academics.read",{
    organizationId:scope.organizationId,collegeId:scope.collegeId,
  });
  const [row]=await getDb().select({
    id:cohorts.id,legacyBatchId:cohorts.legacyBatchId,
    name:cohorts.name,code:cohorts.code,status:cohorts.status,
    academicYear:cohorts.academicYear,startDate:cohorts.startDate,endDate:cohorts.endDate,
    programId:cohorts.programId,programName:programs.name,
    startPeriodId:cohorts.startPeriodId,
    expectedEndPeriodId:cohorts.expectedEndPeriodId,
    currentTerm:cohortProgressionState.currentTermNumber,
    currentAcademicYearStart:cohortProgressionState.currentAcademicYearStart,
  }).from(cohorts).innerJoin(programs,eq(programs.id,cohorts.programId))
    .innerJoin(departments,eq(departments.id,programs.departmentId))
    .leftJoin(cohortProgressionState,eq(cohortProgressionState.cohortId,cohorts.id))
    .where(and(eq(cohorts.id,id),eq(departments.collegeId,scope.collegeId)))
    .limit(1);
  if(!row)throw new AcademicsServiceError("COHORT_NOT_FOUND");
  return row;
}

/** Super Admin and College Admin share the explicit acting-college directory.
 * Do not infer a target from any untrusted legacy organization/college ID. */
export async function listCollegeCohortsPage(
  context:RequestContext,raw:{programId?:string;page?:number;pageSize?:number}={},
){
  const input=z.strictObject({
    programId:z.uuid().optional(),
    page:z.number().int().min(1).max(10000).default(1),
    pageSize:z.number().int().refine(v=>[10,25,50,100].includes(v)).default(25),
  }).parse(raw);
  const acting=await resolveActingCollege(context,"academics.read");
  const where=and(eq(departments.collegeId,acting.collegeId),
    input.programId?eq(cohorts.programId,input.programId):undefined);
  const db=getDb();
  const [rows,totals]=await Promise.all([
    db.select({
      id:cohorts.id,name:cohorts.name,code:cohorts.code,
      status:cohorts.status,academicYear:cohorts.academicYear,
      programId:programs.id,programName:programs.name,
      legacyBatchId:cohorts.legacyBatchId,createdAt:cohorts.createdAt,
    }).from(cohorts).innerJoin(programs,eq(programs.id,cohorts.programId))
      .innerJoin(departments,eq(departments.id,programs.departmentId))
      .where(where).orderBy(desc(cohorts.createdAt),asc(cohorts.name),asc(cohorts.id))
      .limit(input.pageSize).offset((input.page-1)*input.pageSize),
    db.select({total:count()}).from(cohorts)
      .innerJoin(programs,eq(programs.id,cohorts.programId))
      .innerJoin(departments,eq(departments.id,programs.departmentId))
      .where(where),
  ]);
  return {data:rows,batches:rows,total:totals[0]?.total??0,
    page:input.page,pageSize:input.pageSize,
    totalPages:Math.max(1,Math.ceil((totals[0]?.total??0)/input.pageSize))};
}

export async function createCohort(
  context: RequestContext,
  rawInput: CreateCohortInput,
) {
  const input = createCohortInputSchema.parse(rawInput);
  // These optional historical fields preserve the legacy BatchDTO data without
  // pretending an academic period and a calendar year are the same identity.
  const legacy = z.object({
    academicYear: z.string().trim().regex(/^\d{4}-\d{2}$/).optional(),
    startDate: z.iso.date().nullable().optional(),
    endDate: z.iso.date().nullable().optional(),
    status: z.enum(["PLANNED","ACTIVE"]).optional(),
  }).parse(rawInput);
  if (legacy.academicYear) {
    const start = Number(legacy.academicYear.slice(0,4));
    if (Number(legacy.academicYear.slice(5)) !== (start + 1) % 100)
      throw new z.ZodError([{code:"custom",path:["academicYear"],
        message:"Use consecutive years, e.g. 2026-27"}]);
  }
  if (legacy.startDate && legacy.endDate && legacy.startDate > legacy.endDate)
    throw new z.ZodError([{code:"custom",path:["endDate"],
      message:"Batch end date cannot precede start date"}]);
  const program = await loadProgramScope(
    input.programId,
  );

  requirePermission(context, "academics.manage", {
    organizationId: program.organizationId,
    collegeId: program.collegeId,
  });

  const periodWindow = await loadAndValidatePeriodWindow(
    program.collegeId,
    input.startPeriodId,
    input.expectedEndPeriodId,
  );
  if (legacy.startDate && legacy.startDate < periodWindow.start.startDate ||
      legacy.endDate && legacy.endDate > (periodWindow.expectedEnd?.endDate ?? periodWindow.start.endDate))
    throw new z.ZodError([{code:"custom",path:["startDate"],
      message:"Batch dates must follow the selected academic period range"}]);
  await assertCohortNameUnique(input.programId, input.name);
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
        status: legacy.status ?? "PLANNED",
        academicYear: legacy.academicYear ?? null,
        startDate: legacy.startDate ?? null,
        endDate: legacy.endDate ?? null,
        startPeriodId: input.startPeriodId,
        expectedEndPeriodId:
          input.expectedEndPeriodId ?? null,
      })
      .returning();

    if(!created)throw new Error("Unable to persist cohort mutation.");
    const yearLabel=legacy.academicYear??
      batchAcademicYearWithStartMonth(periodWindow.start.startDate,7);
    await tx.insert(cohortProgressionState).values({
      cohortId:created.id,currentTermNumber:1,
      currentAcademicYearStart:Number(yearLabel.slice(0,4)),
      currentPeriodId:input.startPeriodId,
      version:0,updatedByUserId:context.user.id,
    });
    await recordActivityEventInTransaction(tx,context,{
      eventType:ACTIVITY_EVENT_TYPES.ACADEMICS_COHORT_CREATED,
      organizationId:program.organizationId,collegeId:program.collegeId,
      subjectType:"cohort",subjectId:created.id,subjectLabel:created.name,
      summary:"Cohort created",
      metadata:{code:created.code,status:created.status,
        initialTerm:1,currentAcademicYearStart:Number(yearLabel.slice(0,4)),
        legacyBatchId:created.legacyBatchId,academicPeriodId:input.startPeriodId},
    });
    return created;
   });
  } catch (error) {
    throw mapCohortConstraint(error, input.name);
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

  if (input.name) await assertCohortNameUnique(current.programId, input.name, cohortId);
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
    throw mapCohortConstraint(error, input.name);
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
