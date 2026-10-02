import {
  and,
  asc,
  eq,
  sql,
} from "drizzle-orm";
import { getDb } from "@/db/client";
import {
  academicPeriods,
} from "@/db/schema";
import type { RequestContext } from "@/modules/identity/context";
import { requirePermission } from "@/modules/permissions/policy";
import {
  AcademicsServiceError,
  postgresConstraintName,
} from "./errors";
import {
  loadAcademicCollegeScope,
  loadAcademicPeriodScope,
} from "./scope";
import {
  academicPeriodIdSchema,
  academicPeriodTransitionSchema,
  collegeIdSchema,
  createAcademicPeriodInputSchema,
  updateAcademicPeriodInputSchema,
  type CreateAcademicPeriodInput,
  type UpdateAcademicPeriodInput,
} from "./validation";

async function assertPeriodCodeUnique(
  collegeId: string,
  code: string,
  excludeId?: string,
) {
  const db = getDb();
  const conditions = [
    eq(academicPeriods.collegeId, collegeId),
    sql<boolean>`lower(${academicPeriods.code}) = ${code.toLowerCase()}`,
  ];

  if (excludeId) {
    conditions.push(
      sql<boolean>`${academicPeriods.id} <> ${excludeId}`,
    );
  }

  const [existing] = await db
    .select({ id: academicPeriods.id })
    .from(academicPeriods)
    .where(and(...conditions))
    .limit(1);

  if (existing) {
    throw new AcademicsServiceError(
      "ACADEMIC_PERIOD_CODE_CONFLICT",
    );
  }
}

function mapPeriodConstraint(error: unknown) {
  if (
    postgresConstraintName(error) ===
    "academic_periods_college_code_uq"
  ) {
    return new AcademicsServiceError(
      "ACADEMIC_PERIOD_CODE_CONFLICT",
    );
  }

  return error;
}

export async function listAcademicPeriods(
  context: RequestContext,
  collegeIdInput: string,
) {
  const collegeId = collegeIdSchema.parse(
    collegeIdInput,
  );
  const college = await loadAcademicCollegeScope(
    collegeId,
  );

  requirePermission(context, "academics.read", {
    organizationId: college.organizationId,
    collegeId,
  });

  const db = getDb();

  return db
    .select()
    .from(academicPeriods)
    .where(
      eq(academicPeriods.collegeId, collegeId),
    )
    .orderBy(
      asc(academicPeriods.startDate),
      asc(academicPeriods.code),
    );
}

export async function createAcademicPeriod(
  context: RequestContext,
  rawInput: CreateAcademicPeriodInput,
) {
  const input =
    createAcademicPeriodInputSchema.parse(
      rawInput,
    );
  const college = await loadAcademicCollegeScope(
    input.collegeId,
  );

  requirePermission(context, "academics.manage", {
    organizationId: college.organizationId,
    collegeId: college.id,
  });

  await assertPeriodCodeUnique(
    input.collegeId,
    input.code,
  );

  const db = getDb();

  try {
    const [created] = await db
      .insert(academicPeriods)
      .values(input)
      .returning();

    return created;
  } catch (error) {
    throw mapPeriodConstraint(error);
  }
}

export async function updateAcademicPeriod(
  context: RequestContext,
  periodIdInput: string,
  rawInput: UpdateAcademicPeriodInput,
) {
  const periodId =
    academicPeriodIdSchema.parse(periodIdInput);
  const input =
    updateAcademicPeriodInputSchema.parse(
      rawInput,
    );
  const current =
    await loadAcademicPeriodScope(periodId);

  requirePermission(context, "academics.manage", {
    organizationId: current.organizationId,
    collegeId: current.collegeId,
  });

  if (current.status !== "PLANNED") {
    throw new AcademicsServiceError(
      "INVALID_ACADEMIC_PERIOD_TRANSITION",
    );
  }

  const startDate =
    input.startDate ?? current.startDate;
  const endDate = input.endDate ?? current.endDate;

  if (endDate < startDate) {
    throw new AcademicsServiceError(
      "INVALID_ACADEMIC_PERIOD_TRANSITION",
    );
  }

  if (input.code) {
    await assertPeriodCodeUnique(
      current.collegeId,
      input.code,
      periodId,
    );
  }

  const db = getDb();

  try {
    const [updated] = await db
      .update(academicPeriods)
      .set({
        ...input,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(academicPeriods.id, periodId),
          eq(academicPeriods.status, "PLANNED"),
        ),
      )
      .returning();

    if (!updated) {
      throw new AcademicsServiceError(
        "ACADEMIC_PERIOD_NOT_FOUND",
      );
    }

    return updated;
  } catch (error) {
    if (error instanceof AcademicsServiceError) {
      throw error;
    }
    throw mapPeriodConstraint(error);
  }
}

export async function transitionAcademicPeriod(
  context: RequestContext,
  periodIdInput: string,
  rawInput: unknown,
) {
  const periodId =
    academicPeriodIdSchema.parse(periodIdInput);
  const input =
    academicPeriodTransitionSchema.parse(rawInput);
  const current =
    await loadAcademicPeriodScope(periodId);

  requirePermission(context, "academics.manage", {
    organizationId: current.organizationId,
    collegeId: current.collegeId,
  });

  const nextStatus =
    input.action === "ACTIVATE"
      ? "ACTIVE"
      : "CLOSED";
  const expectedStatus =
    input.action === "ACTIVATE"
      ? "PLANNED"
      : "ACTIVE";

  if (current.status !== expectedStatus) {
    throw new AcademicsServiceError(
      "INVALID_ACADEMIC_PERIOD_TRANSITION",
    );
  }

  const db = getDb();
  const [updated] = await db
    .update(academicPeriods)
    .set({
      status: nextStatus,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(academicPeriods.id, periodId),
        eq(
          academicPeriods.status,
          expectedStatus,
        ),
      ),
    )
    .returning();

  if (!updated) {
    throw new AcademicsServiceError(
      "INVALID_ACADEMIC_PERIOD_TRANSITION",
    );
  }

  return updated;
}
