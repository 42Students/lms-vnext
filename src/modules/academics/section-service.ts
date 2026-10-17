import {
  and,
  asc,
  eq,
  sql,
} from "drizzle-orm";
import { getDb } from "@/db/client";
import {
  sections,
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
  loadSectionScope,
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
      eq(
        sections.academicPeriodId,
        academicPeriodId,
      ),
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
