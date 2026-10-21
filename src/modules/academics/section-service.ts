import {
  and,
  asc,
  eq,
  ilike,
  or,
  sql,
} from "drizzle-orm";
import { getDb } from "@/db/client";
import {
  sections, cohorts, departments, programs, activityEvents, sectionEnrollments,
  sectionScheduleEvents,
} from "@/db/schema";
import { z } from "zod";
import { resolveActingCollege } from "@/modules/permissions/acting-college";
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
  loadSectionScope,
  loadProgramScope,
} from "./scope";
import {
  academicPeriodIdSchema,
  cohortIdSchema,
  createSectionInputSchema,
  sectionIdSchema,
  updateSectionInputSchema,
  type CreateSectionInput,
  type UpdateSectionInput,
} from "./validation";

async function assertSectionUnique(
  cohortId: string,
  academicPeriodId: string,
  input: {
    name?: string;
    code?: string;
  },
  excludeId?: string,
) {
  const db = getDb();

  for (const [field, value, errorCode] of [
    [
      sections.name,
      input.name,
      "SECTION_NAME_CONFLICT",
    ],
    [
      sections.code,
      input.code,
      "SECTION_CODE_CONFLICT",
    ],
  ] as const) {
    if (!value) continue;

    const conditions = [
      eq(sections.cohortId, cohortId),
      ...(errorCode === "SECTION_NAME_CONFLICT" ? [] : [
        eq(sections.academicPeriodId, academicPeriodId),
      ]),
      eq(sections.status, "ACTIVE"),
      sql<boolean>`lower(${field}) = ${value.toLowerCase()}`,
    ];

    if (excludeId) {
      conditions.push(
        sql<boolean>`${sections.id} <> ${excludeId}`,
      );
    }

    const [existing] = await db
      .select({ id: sections.id })
      .from(sections)
      .where(and(...conditions))
      .limit(1);

    if (existing) {
      throw new AcademicsServiceError(
        errorCode,
      );
    }
  }
}

function mapSectionConstraint(error: unknown) {
  switch (postgresConstraintName(error)) {
    case "sections_active_cohort_period_name_uq":
      return new AcademicsServiceError(
        "SECTION_NAME_CONFLICT",
      );
    case "sections_active_cohort_period_code_uq":
      return new AcademicsServiceError(
        "SECTION_CODE_CONFLICT",
      );
    default:
      return error;
  }
}

async function assertPeriodInsideCohort(
  cohort: Awaited<
    ReturnType<typeof loadCohortScope>
  >,
  academicPeriodId: string,
) {
  const [period, startPeriod] =
    await Promise.all([
      loadAcademicPeriodScope(academicPeriodId),
      loadAcademicPeriodScope(
        cohort.startPeriodId,
      ),
    ]);

  if (
    period.collegeId !== cohort.collegeId
  ) {
    throw new AcademicsServiceError(
      "ACADEMIC_PERIOD_COLLEGE_MISMATCH",
    );
  }

  if (period.status === "CLOSED") {
    throw new AcademicsServiceError(
      "ACADEMIC_PERIOD_CLOSED",
    );
  }

  if (period.startDate < startPeriod.startDate) {
    throw new AcademicsServiceError(
      "SECTION_PERIOD_OUTSIDE_COHORT",
    );
  }

  if (cohort.expectedEndPeriodId) {
    const endPeriod =
      await loadAcademicPeriodScope(
        cohort.expectedEndPeriodId,
      );

    if (period.endDate > endPeriod.endDate) {
      throw new AcademicsServiceError(
        "SECTION_PERIOD_OUTSIDE_COHORT",
      );
    }
  }

  return period;
}

export async function listSections(
  context: RequestContext,
  cohortIdInput: string,
  academicPeriodIdInput?: string | null,
) {
  const cohortId =
    cohortIdSchema.parse(cohortIdInput);
  const cohort = await loadCohortScope(
    cohortId,
  );

  requirePermission(context, "academics.read", {
    organizationId: cohort.organizationId,
    collegeId: cohort.collegeId,
  });

  const academicPeriodId =
    academicPeriodIdInput
      ? academicPeriodIdSchema.parse(
          academicPeriodIdInput,
        )
      : null;

  if (academicPeriodId) {
    const period =
      await loadAcademicPeriodScope(
        academicPeriodId,
      );
    if (period.collegeId !== cohort.collegeId) {
      throw new AcademicsServiceError(
        "ACADEMIC_PERIOD_COLLEGE_MISMATCH",
      );
    }
  }

  const db = getDb();
  const conditions = [
    eq(sections.cohortId, cohortId),
    eq(sections.status, "ACTIVE"),
  ];

  if (academicPeriodId) {
    conditions.push(
      eq(
        sections.academicPeriodId,
        academicPeriodId,
      ),
    );
  }

  return db
    .select()
    .from(sections)
    .where(and(...conditions))
    .orderBy(
      asc(sections.academicPeriodId),
      asc(sections.name),
    );
}


/**
 * Cross-cohort class picker. Legacy discovery could search all batches, but
 * this still resolves one acting college before reading any names. A global
 * Super Admin must deliberately select a college in vNext.
 *
 * Search is read-only. This must never be reused as cache refresh authority.
 */
export async function searchSections(
  context: RequestContext,
  raw: { q?: string; programId?: string; limit?: number },
) {
  const input = z.object({
    q: z.string().trim().max(100).default(""),
    programId: z.string().uuid().optional(),
    limit: z.number().int().min(1).max(100).default(20),
  }).strict().parse(raw);
  const acting = await resolveActingCollege(context, "academics.read");
  if(input.programId){
    const program=await loadProgramScope(input.programId);
    requirePermission(context,"academics.read",{
      organizationId:program.organizationId,collegeId:program.collegeId,
    });
    if(program.collegeId!==acting.collegeId)
      throw new AcademicsServiceError("PROGRAM_NOT_FOUND");
  }
  const pattern = "%" + input.q.replace(/[\\%_]/g, "\\$&") + "%";
  return getDb().select({
    id: sections.id, name: sections.name, code: sections.code,
    legacyClassId: sections.legacyClassId,
    description: sections.description,
    startsOn: sections.startsOn, endsOn: sections.endsOn,
    cohortId: cohorts.id, cohortName: cohorts.name,
    programId: programs.id, programName: programs.name,
    collegeId: departments.collegeId,
    academicPeriodId: sections.academicPeriodId,
  }).from(sections)
    .innerJoin(cohorts, eq(cohorts.id, sections.cohortId))
    .innerJoin(programs, eq(programs.id, cohorts.programId))
    .innerJoin(departments, eq(departments.id, programs.departmentId))
    .where(and(
      eq(departments.collegeId, acting.collegeId),
      eq(sections.status, "ACTIVE"),
      input.programId ? eq(programs.id, input.programId) : undefined,
      input.q ? or(ilike(sections.name, pattern), ilike(sections.code, pattern),
        ilike(cohorts.name, pattern), ilike(programs.name, pattern),
        sql<boolean>`${sections.legacyClassId}::text ilike ${pattern}`) : undefined,
    ))
    // Blank search is the legacy Popular classes picker. Track durable,
    // college-owned usage rather than a process-global mutable counter.
    .orderBy(input.q ? asc(programs.name) : sql`(
      select count(*) from ${activityEvents} selections
      where selections.event_type = 'academics.class.selected'
        and selections.subject_id = ${sections.id}::text
        and selections.college_id = ${acting.collegeId}::uuid
    ) desc`,asc(cohorts.name), asc(sections.name), asc(sections.id))
    .limit(input.limit);
}


/** Legacy /getClassesByProgram and /v2/classes/program/{programId} reader.
 * The DTO uses UUID values deliberately: numeric source IDs can only cross
 * the boundary through a privileged migrated-ID adapter.
 */
export async function listClassesByProgram(
  context:RequestContext,programIdInput:unknown,
  raw:{q?:string;limit?:number}={},
){
  const programId=z.uuid().parse(programIdInput);
  const rows=await searchSections(context,{
    programId,q:raw.q??"",limit:raw.limit??50,
  });
  return rows.map(row=>({
    value:row.id,label:row.name,id:row.id,name:row.name,
    description:row.description,programId:row.programId,
    programName:row.programName,batchId:row.cohortId,
    batchName:row.cohortName,
    startsOn:row.startsOn,endsOn:row.endsOn,
    academicPeriodId:row.academicPeriodId,
  }));
}

/** Legacy name-exists applies normalization to all college-owned classes,
 * not just the first 20 autocomplete results. */
export async function collegeClassNameExists(
  context:RequestContext,nameInput:unknown,programIdInput?:unknown,
){
  const name=z.string().trim().min(1).max(255).parse(nameInput);
  const programId=programIdInput===undefined?undefined:z.uuid().parse(programIdInput);
  const acting=await resolveActingCollege(context,"academics.read");
  const [row]=await getDb().select({id:sections.id}).from(sections)
    .innerJoin(cohorts,eq(cohorts.id,sections.cohortId))
    .innerJoin(programs,eq(programs.id,cohorts.programId))
    .innerJoin(departments,eq(departments.id,programs.departmentId))
    .where(and(eq(departments.collegeId,acting.collegeId),
      programId?eq(programs.id,programId):undefined,
      sql<boolean>`lower(trim(${sections.name})) = ${name.toLocaleLowerCase("en-IN")}`))
    .limit(1);
  return {exists:Boolean(row)};
}

/** Popular classes are the same exact tenant-scoped directory search with
 * blank q and a deterministic usage-based top ten, not an unscoped cache. */
export async function listPopularClasses(
  context:RequestContext,programId?:string,limit=10,
){
  return searchSections(context,{programId,q:"",
    limit:Math.max(1,Math.min(Math.trunc(limit)||10,50))});
}

/** Increment the durable, per-college autocomplete usage signal ONLY after
 * validating the class is still active in the selected college.
 */
export async function recordClassSearchSelection(
  context:RequestContext,classIdInput:unknown,idempotencyKeyInput:unknown,
){
  const idempotencyKey=z.uuid().parse(idempotencyKeyInput);
  const id=z.uuid().parse(classIdInput);
  const acting=await resolveActingCollege(context,"academics.read");
  const [row]=await getDb().select({
    id:sections.id,name:sections.name,
  }).from(sections)
    .innerJoin(cohorts,eq(cohorts.id,sections.cohortId))
    .innerJoin(programs,eq(programs.id,cohorts.programId))
    .innerJoin(departments,and(eq(departments.id,programs.departmentId),
      eq(departments.collegeId,acting.collegeId)))
    .where(and(eq(sections.id,id),eq(sections.status,"ACTIVE"))).limit(1);
  if(!row)throw new AcademicsServiceError("SECTION_NOT_FOUND");
  const inserted=await getDb().insert(activityEvents).values({
    organizationId:acting.organizationId,collegeId:acting.collegeId,
    actorUserId:context.user.id,
    module:"ACADEMICS",eventType:"academics.class.selected",
    importance:"LOW",subjectType:"section",subjectId:row.id,
    subjectLabel:row.name,summary:"Class selected from search",
    metadata:{origin:"COLLEGE_CLASS_AUTOCOMPLETE"},
    dedupeKey:`academics:class-select:${context.user.id}:${idempotencyKey}`,
  }).onConflictDoNothing().returning({id:activityEvents.id});
  return {recorded:inserted.length>0,replayed:inserted.length===0};
}

export async function createSection(
  context: RequestContext,
  rawInput: CreateSectionInput,
) {
  const input =
    createSectionInputSchema.parse(rawInput);
  const cohort = await loadCohortScope(
    input.cohortId,
  );

  requirePermission(context, "academics.manage", {
    organizationId: cohort.organizationId,
    collegeId: cohort.collegeId,
  });

  if (
    cohort.status !== "PLANNED" &&
    cohort.status !== "ACTIVE"
  ) {
    throw new AcademicsServiceError(
      "COHORT_NOT_MUTABLE",
    );
  }

  await assertPeriodInsideCohort(
    cohort,
    input.academicPeriodId,
  );
  await assertSectionUnique(
    input.cohortId,
    input.academicPeriodId,
    input,
  );

  const db = getDb();

  try {
    return await db.transaction(async (tx)=>{
    const [created] = await tx
      .insert(sections)
      .values({
        cohortId: input.cohortId,
        academicPeriodId:
          input.academicPeriodId,
        name: input.name,
        code: input.code,
        capacity: input.capacity ?? null,
      })
      .returning();

    if(!created)throw new Error("Unable to persist section mutation.");
    await recordActivityEventInTransaction(tx,context,{
      eventType:ACTIVITY_EVENT_TYPES.ACADEMICS_SECTION_CREATED,
      organizationId:cohort.organizationId,collegeId:cohort.collegeId,
      subjectType:"section",subjectId:created.id,subjectLabel:created.name,
      summary:"Section created",
      metadata:{code:created.code,status:created.status},
    });
    return created;
   });
  } catch (error) {
    throw mapSectionConstraint(error);
  }
}

export async function updateSection(
  context: RequestContext,
  sectionIdInput: string,
  rawInput: UpdateSectionInput,
) {
  const sectionId =
    sectionIdSchema.parse(sectionIdInput);
  const input =
    updateSectionInputSchema.parse(rawInput);
  const current = await loadSectionScope(
    sectionId,
  );

  requirePermission(context, "academics.manage", {
    organizationId: current.organizationId,
    collegeId: current.collegeId,
  });

  if (current.status !== "ACTIVE") {
    throw new AcademicsServiceError(
      "SECTION_NOT_FOUND",
    );
  }

  await assertSectionUnique(
    current.cohortId,
    current.academicPeriodId,
    input,
    sectionId,
  );

  const db = getDb();

  try {
    return await db.transaction(async (tx)=>{
    const [updated] = await tx
      .update(sections)
      .set({
        ...input,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(sections.id, sectionId),
          eq(sections.status, "ACTIVE"),
        ),
      )
      .returning();

    if (!updated) {
      throw new AcademicsServiceError(
        "SECTION_NOT_FOUND",
      );
    }

    if(!updated)throw new Error("Unable to persist section mutation.");
    await recordActivityEventInTransaction(tx,context,{
      eventType:ACTIVITY_EVENT_TYPES.ACADEMICS_SECTION_UPDATED,
      organizationId:current.organizationId,collegeId:current.collegeId,
      subjectType:"section",subjectId:updated.id,subjectLabel:updated.name,
      summary:"Section updated",
      metadata:{previousStatus:current.status,code:updated.code},
    });
    return updated;
   });
  } catch (error) {
    if (error instanceof AcademicsServiceError) {
      throw error;
    }
    throw mapSectionConstraint(error);
  }
}

export async function archiveSection(
  context: RequestContext,
  sectionIdInput: string,
) {
  const sectionId =
    sectionIdSchema.parse(sectionIdInput);
  const current = await loadSectionScope(
    sectionId,
  );

  requirePermission(context, "academics.manage", {
    organizationId: current.organizationId,
    collegeId: current.collegeId,
  });

  const db = getDb();
  return await db.transaction(async (tx)=>{
    const [enrolled] = await tx.select({ id: sectionEnrollments.id }).from(sectionEnrollments)
      .where(and(eq(sectionEnrollments.sectionId, sectionId),
        eq(sectionEnrollments.status, "ACTIVE"))).limit(1);
    if (enrolled) throw new AcademicsServiceError("SECTION_HAS_STUDENTS");
    const [scheduled] = await tx.select({ id: sectionScheduleEvents.id }).from(sectionScheduleEvents)
      .where(eq(sectionScheduleEvents.sectionId, sectionId)).limit(1);
    if (scheduled) throw new AcademicsServiceError("SECTION_HAS_SCHEDULE");
    const [archived] = await tx
    .update(sections)
    .set({
      status: "ARCHIVED",
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(sections.id, sectionId),
        eq(sections.status, "ACTIVE"),
      ),
    )
    .returning();

  if (!archived) {
    throw new AcademicsServiceError(
      "SECTION_NOT_FOUND",
    );
  }

  if(!archived)throw new Error("Unable to persist section mutation.");
    await recordActivityEventInTransaction(tx,context,{
      eventType:ACTIVITY_EVENT_TYPES.ACADEMICS_SECTION_ARCHIVED,
      organizationId:current.organizationId,collegeId:current.collegeId,
      subjectType:"section",subjectId:archived.id,subjectLabel:archived.name,
      summary:"Section archived",
      metadata:{previousStatus:current.status,nextStatus:archived.status},
    });
    return archived;
   });
}
