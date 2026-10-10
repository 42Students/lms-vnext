import {
  and,
  asc,
  eq,
  isNull,
  ne,
  sql,
} from "drizzle-orm";
import { getDb } from "@/db/client";
import { recordActivityEventInTransaction } from "@/modules/activity/service";
import { ACTIVITY_EVENT_TYPES } from "@/modules/activity/taxonomy";
import {
  cohorts,
  departments,
  programs,
} from "@/db/schema";
import type { RequestContext } from "@/modules/identity/context";
import { requirePermission } from "@/modules/permissions/policy";
import {
  AcademicsServiceError,
  postgresConstraintName,
} from "./errors";
import {
  loadAcademicCollegeScope,
  loadAcademicDepartmentScope,
  loadProgramScope,
} from "./scope";
import {
  collegeIdSchema,
  createProgramInputSchema,
  departmentIdSchema,
  programIdSchema,
  updateProgramInputSchema,
  type CreateProgramInput,
  type UpdateProgramInput,
} from "./validation";

export function normalizeProgramDurationTerms(input: {
  durationTerms?: number;
  durationYears?: number;
}) {
  if (input.durationYears !== undefined) {
    return input.durationYears * 2;
  }
  if (input.durationTerms !== undefined) {
    return input.durationTerms;
  }
  throw new AcademicsServiceError("PROGRAM_NOT_FOUND");
}

export function programDurationYears(durationTerms: number) {
  return durationTerms / 2;
}

function withLegacyProgramDuration<
  T extends { durationTerms: number },
>(program: T) {
  return {
    ...program,
    durationYears: programDurationYears(
      program.durationTerms,
    ),
  };
}

async function assertProgramUnique(
  departmentId: string,
  input: {
    name?: string;
    code?: string;
  },
  excludeProgramId?: string,
) {
  const db = getDb();

  if (input.name) {
    const conditions = [
      eq(programs.departmentId, departmentId),
      eq(programs.status, "ACTIVE"),
      sql<boolean>`lower(${programs.name}) = ${input.name.toLowerCase()}`,
    ];
    if (excludeProgramId) {
      conditions.push(ne(programs.id, excludeProgramId));
    }

    const [existing] = await db
      .select({ id: programs.id })
      .from(programs)
      .where(and(...conditions))
      .limit(1);

    if (existing) {
      throw new AcademicsServiceError(
        "PROGRAM_NAME_CONFLICT",
      );
    }
  }

  if (input.code) {
    const conditions = [
      eq(programs.departmentId, departmentId),
      eq(programs.status, "ACTIVE"),
      sql<boolean>`lower(${programs.code}) = ${input.code.toLowerCase()}`,
    ];
    if (excludeProgramId) {
      conditions.push(ne(programs.id, excludeProgramId));
    }

    const [existing] = await db
      .select({ id: programs.id })
      .from(programs)
      .where(and(...conditions))
      .limit(1);

    if (existing) {
      throw new AcademicsServiceError(
        "PROGRAM_CODE_CONFLICT",
      );
    }
  }
}

function mapProgramConstraint(error: unknown) {
  switch (postgresConstraintName(error)) {
    case "programs_active_department_name_uq":
      return new AcademicsServiceError(
        "PROGRAM_NAME_CONFLICT",
      );
    case "programs_active_department_code_uq":
      return new AcademicsServiceError(
        "PROGRAM_CODE_CONFLICT",
      );
    default:
      return error;
  }
}

export async function listPrograms(
  context: RequestContext,
  collegeIdInput: string,
  departmentIdInput?: string | null,
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

  const departmentId = departmentIdInput
    ? departmentIdSchema.parse(departmentIdInput)
    : null;

  if (departmentId) {
    const department =
      await loadAcademicDepartmentScope(departmentId);
    if (department.collegeId !== collegeId) {
      throw new AcademicsServiceError(
        "DEPARTMENT_NOT_FOUND",
      );
    }
  }

  const db = getDb();
  const conditions = [
    eq(departments.collegeId, collegeId),
    isNull(departments.archivedAt),
    eq(programs.status, "ACTIVE"),
  ];

  if (departmentId) {
    conditions.push(
      eq(programs.departmentId, departmentId),
    );
  }

  const rows = await db
    .select({
      id: programs.id,
      departmentId: programs.departmentId,
      departmentName: departments.name,
      name: programs.name,
      code: programs.code,
      durationTerms: programs.durationTerms,
      status: programs.status,
      createdAt: programs.createdAt,
      updatedAt: programs.updatedAt,
    })
    .from(programs)
    .innerJoin(
      departments,
      eq(departments.id, programs.departmentId),
    )
    .where(and(...conditions))
    .orderBy(
      asc(departments.name),
      asc(programs.name),
    );

  return rows.map(withLegacyProgramDuration);
}

export async function createProgram(
  context: RequestContext,
  rawInput: CreateProgramInput,
) {
  const input = createProgramInputSchema.parse(
    rawInput,
  );
  const department =
    await loadAcademicDepartmentScope(
      input.departmentId,
    );

  requirePermission(context, "academics.manage", {
    organizationId: department.organizationId,
    collegeId: department.collegeId,
  });

  await assertProgramUnique(input.departmentId, input);

  const db = getDb();

  try {
    return await db.transaction(async (tx) => {
      const [created] = await tx
        .insert(programs)
        .values({
          departmentId: input.departmentId,
          name: input.name,
          code: input.code,
          durationTerms:
            normalizeProgramDurationTerms(input),
        })
        .returning();

      await recordActivityEventInTransaction(
        tx,
        context,
        {
          eventType:
            ACTIVITY_EVENT_TYPES.ACADEMICS_PROGRAM_CREATED,
          collegeId: department.collegeId,
          organizationId:
            department.organizationId,
          subjectType: "program",
          subjectId: created.id,
          subjectLabel: created.name,
          summary:
            `Program ${created.name} created`,
          metadata: {
            code: created.code,
            departmentId:
              created.departmentId,
            durationTerms:
              created.durationTerms,
          },
          groupKey:
            `academics-program:${created.id}`,
          dedupeKey:
            `academics-program:${created.id}:created`,
        },
      );

      return withLegacyProgramDuration(created);
    });
  } catch (error) {
    throw mapProgramConstraint(error);
  }
}

export async function updateProgram(
  context: RequestContext,
  programIdInput: string,
  rawInput: UpdateProgramInput,
) {
  const programId = programIdSchema.parse(
    programIdInput,
  );
  const input = updateProgramInputSchema.parse(
    rawInput,
  );
  const scope = await loadProgramScope(programId);

  requirePermission(context, "academics.manage", {
    organizationId: scope.organizationId,
    collegeId: scope.collegeId,
  });

  const targetDepartmentId =
    input.departmentId ?? scope.departmentId;

  if (targetDepartmentId !== scope.departmentId) {
    const targetDepartment =
      await loadAcademicDepartmentScope(
        targetDepartmentId,
      );
    if (targetDepartment.collegeId !== scope.collegeId) {
      throw new AcademicsServiceError(
        "PROGRAM_DEPARTMENT_COLLEGE_MISMATCH",
      );
    }
  }

  await assertProgramUnique(
    targetDepartmentId,
    input,
    programId,
  );

  const db = getDb();
  const {
    durationYears,
    durationTerms: rawDurationTerms,
    departmentId,
    ...scalarInput
  } = input;
  const durationTerms =
    durationYears !== undefined ||
    rawDurationTerms !== undefined
      ? normalizeProgramDurationTerms({
          durationYears,
          durationTerms: rawDurationTerms,
        })
      : undefined;

  try {
    const [updated] = await db
      .update(programs)
      .set({
        ...scalarInput,
        ...(departmentId !== undefined
          ? { departmentId }
          : {}),
        ...(durationTerms !== undefined
          ? { durationTerms }
          : {}),
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(programs.id, programId),
          eq(programs.status, "ACTIVE"),
        ),
      )
      .returning();

    if (!updated) {
      throw new AcademicsServiceError(
        "PROGRAM_NOT_FOUND",
      );
    }

    return withLegacyProgramDuration(updated);
  } catch (error) {
    if (error instanceof AcademicsServiceError) {
      throw error;
    }
    throw mapProgramConstraint(error);
  }
}

export async function archiveProgram(
  context: RequestContext,
  programIdInput: string,
) {
  const programId = programIdSchema.parse(
    programIdInput,
  );
  const scope = await loadProgramScope(programId);

  requirePermission(context, "academics.manage", {
    organizationId: scope.organizationId,
    collegeId: scope.collegeId,
  });

  const db = getDb();
  const [dependent] = await db
    .select({ id: cohorts.id })
    .from(cohorts)
    .where(
      and(
        eq(cohorts.programId, programId),
        ne(cohorts.status, "ARCHIVED"),
      ),
    )
    .limit(1);

  if (dependent) {
    throw new AcademicsServiceError(
      "PROGRAM_HAS_COHORTS",
    );
  }

  const [archived] = await db
    .update(programs)
    .set({
      status: "ARCHIVED",
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(programs.id, programId),
        eq(programs.status, "ACTIVE"),
      ),
    )
    .returning();

  if (!archived) {
    throw new AcademicsServiceError(
      "PROGRAM_NOT_FOUND",
    );
  }

  return archived;
}
