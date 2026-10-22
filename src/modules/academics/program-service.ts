import {
  and,
  asc,
  count,
  desc,
  eq,
  isNull,
  ne,
  or,
  ilike,
  sql,
} from "drizzle-orm";
import { getDb } from "@/db/client";
import { recordActivityEventInTransaction } from "@/modules/activity/service";
import { ACTIVITY_EVENT_TYPES } from "@/modules/activity/taxonomy";
import {
  cohorts,
  cohortProgressionState,
  colleges,
  organizations,
  departments,
  learnerProgramEnrollments,
  programTerms,
  programs,
} from "@/db/schema";
import type { RequestContext } from "@/modules/identity/context";
import { isSuperAdmin } from "@/modules/identity/context";
import { assertPersistedPlatformPermission } from "@/modules/permissions/persisted-actor";
import { AuthorizationError } from "@/modules/permissions/policy";
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
  // Legacy duration_years is a whole number: never expose fractional years
  // for nonstandard term counts (durationTerms stays authoritative).
  return Math.ceil(durationTerms / 2);
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
    // Reserve names across archived rows: legacy case-insensitive identity
    // survives soft deletion. Reusing one would make a future restore ambiguous.
    const conditions = [
      eq(programs.departmentId, departmentId),
      sql<boolean>`lower(${programs.name}) = ${input.name.trim().toLowerCase()}`,
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
    // Department-local codes are immutable identifiers even when archived.
    // The active-only SQL index still protects concurrent active creations;
    // preflight additionally refuses recycling an archived code.
    const conditions = [
      eq(programs.departmentId, departmentId),
      sql<boolean>`lower(${programs.code}) = ${input.code.trim().toLowerCase()}`,
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
      legacyProgramId: programs.legacyProgramId,
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


/**
 * SQL-paginated administration directory. The existing listPrograms read
 * contract stays unchanged for callers which intentionally need all programs.
 * Historical archives may be included only through this explicit option.
 */
export async function listProgramsPage(
  context: RequestContext,
  collegeIdInput: string,
  raw: { departmentId?: string | null; q?: string; page?: number; pageSize?: number; includeArchived?: boolean } = {},
) {
  const collegeId = collegeIdSchema.parse(collegeIdInput);
  const college = await loadAcademicCollegeScope(collegeId);
  requirePermission(context, "academics.read", {
    organizationId: college.organizationId, collegeId,
  });
  const departmentId = raw.departmentId ? departmentIdSchema.parse(raw.departmentId) : null;
  if (departmentId) {
    const department = await loadAcademicDepartmentScope(departmentId);
    if (department.collegeId !== collegeId)
      throw new AcademicsServiceError("DEPARTMENT_NOT_FOUND");
  }
  const page = Math.max(1, Math.min(10000, Math.trunc(raw.page ?? 1) || 1));
  const pageSize = Math.max(1, Math.min(100, Math.trunc(raw.pageSize ?? 20) || 20));
  const q = (raw.q ?? "").trim();
  if (q.length > 100) throw new Error("Invalid program search");
  const escaped = q.replace(/[\\%_]/g, "\\$&");
  const searchPattern = `%${escaped}%`;
  const conditions = and(
    eq(departments.collegeId, collegeId),
    departmentId ? eq(programs.departmentId, departmentId) : undefined,
    q ? or(ilike(programs.name, searchPattern), ilike(programs.code, searchPattern),
      ilike(departments.name, searchPattern)) : undefined,
    raw.includeArchived ? undefined : isNull(departments.archivedAt),
    raw.includeArchived ? undefined : eq(programs.status, "ACTIVE"),
  );
  const db = getDb();
  const [rows, totals] = await Promise.all([
    db.select({
      id: programs.id, legacyProgramId: programs.legacyProgramId,
      departmentId: programs.departmentId, departmentName: departments.name,
      name: programs.name, code: programs.code,
      durationTerms: programs.durationTerms, status: programs.status,
      createdAt: programs.createdAt, updatedAt: programs.updatedAt,
    }).from(programs).innerJoin(departments, eq(departments.id, programs.departmentId))
      .where(conditions).orderBy(asc(departments.name), asc(programs.name), asc(programs.id))
      .limit(pageSize).offset((page - 1) * pageSize),
    db.select({total: count()}).from(programs)
      .innerJoin(departments, eq(departments.id, programs.departmentId))
      .where(conditions),
  ]);
  const total = totals[0]?.total ?? 0;
  return { programs: rows.map(withLegacyProgramDuration), page, pageSize,
    total, totalElements: total, totalPages: Math.max(1, Math.ceil(total / pageSize)) };
}

/**
 * Explicit, read-only compatibility for legacy Super Admin /fetchAll.
 *
 * The ordinary program directory stays selected-college scoped. Only a
 * platform administrator without a selected college can list active programs
 * within their selected organization (or globally if unscoped). Every result
 * identifies its source tenant.
 * Archived/deleted colleges and programs are deliberately excluded. This
 * endpoint cannot be used to edit a program without switching college scope.
 */
export async function listGlobalProgramsForSuperAdmin(
  context: RequestContext,
  raw: { page?: number; pageSize?: number } = {},
) {
  if (!isSuperAdmin(context) || context.adminScope?.collegeId)
    throw new AuthorizationError("admin-scope.select");
  const positivePage=(value:number|undefined,fallback:number,max:number)=>{
    if(value===undefined)return fallback;
    if(!Number.isSafeInteger(value)||value<1||value>max)
      throw new AcademicsServiceError("PROGRAM_NOT_FOUND");
    return value;
  };
  const page=positivePage(raw.page,1,10000);
  const pageSize=positivePage(raw.pageSize,25,100);
  return getDb().transaction(async tx=>{
    // A formerly privileged session cannot keep enumerating every tenant
    // after its SUPER_ADMIN system role has been revoked.
    await assertPersistedPlatformPermission(tx,context,"admin-scope.select");
    const where=and(
      eq(organizations.status,"ACTIVE"),
      eq(colleges.status,"ACTIVE"),
      isNull(departments.archivedAt),
      eq(programs.status,"ACTIVE"),
      context.adminScope?.organizationId
        ? eq(organizations.id,context.adminScope.organizationId) : undefined,
    );
    const [items,totals]=await Promise.all([
      tx.select({
        id:programs.id,legacyProgramId:programs.legacyProgramId,
        name:programs.name,code:programs.code,durationTerms:programs.durationTerms,
        departmentId:programs.departmentId,departmentName:departments.name,
        collegeId:colleges.id,collegeName:colleges.name,
        organizationId:organizations.id,organizationName:organizations.name,
      }).from(programs)
        .innerJoin(departments,eq(departments.id,programs.departmentId))
        .innerJoin(colleges,eq(colleges.id,departments.collegeId))
        .innerJoin(organizations,eq(organizations.id,colleges.organizationId))
        .where(where)
        .orderBy(asc(organizations.name),asc(colleges.name),asc(departments.name),
          asc(programs.name),asc(programs.id))
        .limit(pageSize).offset((page-1)*pageSize),
      tx.select({total:count()}).from(programs)
        .innerJoin(departments,eq(departments.id,programs.departmentId))
        .innerJoin(colleges,eq(colleges.id,departments.collegeId))
        .innerJoin(organizations,eq(organizations.id,colleges.organizationId))
        .where(where),
    ]);
    const total=totals[0]?.total??0;
    return {items:items.map(withLegacyProgramDuration),page,pageSize,total,
      totalPages:Math.max(1,Math.ceil(total/pageSize)),
      readOnly:true as const};
  });
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
      if (!created) throw new Error("Program insertion returned no row");

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
    {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.code !== undefined ? { code: input.code } : {}),
    },
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
          ...(durationYears !== undefined ? { durationYears } : {}),
          ...(rawDurationTerms !== undefined ? { durationTerms: rawDurationTerms } : {}),
        })
      : undefined;

  try {
    return await db.transaction(async tx => {
      // Serialize edits to the parent before checking any affected term or
      // cohort progression. A concurrent shorter duration cannot bypass the
      // same program-row lock in a second administrative request.
      const [current] = await tx.select({
        id: programs.id, durationTerms: programs.durationTerms,
      }).from(programs).where(and(
        eq(programs.id, programId), eq(programs.status, "ACTIVE"),
      )).for("update").limit(1);
      if (!current) throw new AcademicsServiceError("PROGRAM_NOT_FOUND");
      if (durationTerms !== undefined && durationTerms < current.durationTerms) {
        const [[term], [progression]] = await Promise.all([
          tx.select({number:programTerms.termNumber})
            .from(programTerms).where(eq(programTerms.programId,programId))
            .orderBy(desc(programTerms.termNumber)).limit(1),
          tx.select({number:cohortProgressionState.currentTermNumber})
            .from(cohortProgressionState)
            .innerJoin(cohorts,eq(cohorts.id,cohortProgressionState.cohortId))
            .where(eq(cohorts.programId,programId))
            .orderBy(desc(cohortProgressionState.currentTermNumber)).limit(1),
        ]);
        // Imported active enrollments can predate cohort progression tracking.
        // Without term provenance a smaller duration cannot be verified safe.
        const [unmappedEnrollment] = await tx
          .select({id:learnerProgramEnrollments.id})
          .from(learnerProgramEnrollments)
          .leftJoin(cohortProgressionState,eq(
            cohortProgressionState.cohortId,learnerProgramEnrollments.cohortId,
          ))
          .where(and(
            eq(learnerProgramEnrollments.programId,programId),
            eq(learnerProgramEnrollments.status,"ACTIVE"),
            isNull(cohortProgressionState.cohortId),
          ))
          .limit(1);
        if(unmappedEnrollment)throw new AcademicsServiceError("PROGRAM_HAS_COHORTS");
        if (durationTerms < Math.max(term?.number ?? 0,progression?.number ?? 0))
          throw new AcademicsServiceError("PROGRAM_HAS_COHORTS");
      }
      const [updated] = await tx.update(programs).set({
        ...scalarInput,
        ...(departmentId !== undefined ? { departmentId } : {}),
        ...(durationTerms !== undefined ? { durationTerms } : {}),
        updatedAt: new Date(),
      }).where(and(
        eq(programs.id, programId), eq(programs.status, "ACTIVE"),
      )).returning();
      if (!updated) throw new AcademicsServiceError("PROGRAM_NOT_FOUND");
      await recordActivityEventInTransaction(tx, context, {
        eventType: ACTIVITY_EVENT_TYPES.ACADEMICS_PROGRAM_UPDATED,
        collegeId: scope.collegeId,
        organizationId: scope.organizationId,
        subjectType: "program", subjectId: updated.id,
        subjectLabel: updated.name, summary: "Program updated",
        metadata: { departmentId: updated.departmentId,
          durationTerms: updated.durationTerms, code: updated.code },
        groupKey: `academics-program:${updated.id}`,
        dedupeKey: `academics-program:${updated.id}:updated:${updated.updatedAt.getTime()}`,
      });
      return withLegacyProgramDuration(updated);
    });
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
  return db.transaction(async tx => {
    // Physical delete is intentionally retired: historical enrollments and
    // term references survive an archive. Serialize against live mutations,
    // and fail closed for ALL linked records, including archived cohorts.
    const [current] = await tx.select({ id: programs.id })
      .from(programs).where(and(
        eq(programs.id,programId), eq(programs.status,"ACTIVE"),
      )).for("update").limit(1);
    if (!current) throw new AcademicsServiceError("PROGRAM_NOT_FOUND");
    const [[cohort],[term],[enrollment]] = await Promise.all([
      tx.select({id:cohorts.id}).from(cohorts)
        .where(eq(cohorts.programId,programId)).limit(1),
      tx.select({id:programTerms.id}).from(programTerms)
        .where(eq(programTerms.programId,programId)).limit(1),
      tx.select({id:learnerProgramEnrollments.id}).from(learnerProgramEnrollments)
        .where(eq(learnerProgramEnrollments.programId,programId)).limit(1),
    ]);
    // Preserve the existing typed legacy error code. A dedicated dependency
    // enum is an API-contract change and belongs with the route owner.
    if (cohort || term || enrollment)
      throw new AcademicsServiceError("PROGRAM_HAS_COHORTS");
    const [archived] = await tx.update(programs)
      .set({ status:"ARCHIVED",updatedAt:new Date() })
      .where(and(eq(programs.id,programId),eq(programs.status,"ACTIVE")))
      .returning();
    if (!archived) throw new AcademicsServiceError("PROGRAM_NOT_FOUND");
    await recordActivityEventInTransaction(tx,context,{
      eventType:ACTIVITY_EVENT_TYPES.ACADEMICS_PROGRAM_ARCHIVED,
      collegeId:scope.collegeId,
      organizationId:scope.organizationId,
      subjectType:"program",
      subjectId:archived.id,
      subjectLabel:archived.name,
      summary:"Program archived",
      metadata:{departmentId:archived.departmentId,code:archived.code},
    });
    return archived;
  });
}
