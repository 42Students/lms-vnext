import {
  and,
  asc,
  eq,
  isNull,
  ne,
  sql,
} from "drizzle-orm";
import { getDb } from "@/db/client";
import {
  collegeMemberships,
  colleges,
  courses,
  departments,
  facultyProfiles,
  organizations,
  programs,
} from "@/db/schema";
import type { RequestContext } from "@/modules/identity/context";
import { requirePermission } from "@/modules/permissions/policy";
import {
  assertDepartmentCanArchive,
  type DepartmentUsage,
} from "./archive-policy";
import {
  collegeIdSchema,
  createDepartmentInputSchema,
  departmentIdSchema,
  renameDepartmentInputSchema,
  type CreateDepartmentInput,
  type RenameDepartmentInput,
} from "./validation";

export type DepartmentServiceErrorCode =
  | "COLLEGE_NOT_FOUND"
  | "DEPARTMENT_NOT_FOUND"
  | "DEPARTMENT_NAME_CONFLICT";

export class DepartmentServiceError extends Error {
  constructor(public readonly code: DepartmentServiceErrorCode) {
    super(code);
    this.name = "DepartmentServiceError";
  }
}

export type DepartmentUsageResolver = (
  departmentId: string,
) => Promise<DepartmentUsage>;

export async function resolveDepartmentUsage(
  departmentId: string,
): Promise<DepartmentUsage> {
  const db = getDb();
  const [programRows, facultyRows, courseRows] =
    await Promise.all([
      db
        .select({
          count: sql<number>`count(*)::int`,
        })
        .from(programs)
        .where(
          and(
            eq(
              programs.departmentId,
              departmentId,
            ),
            eq(programs.status, "ACTIVE"),
          ),
        ),
      db
        .select({
          count: sql<number>`count(*)::int`,
        })
        .from(facultyProfiles)
        .innerJoin(
          collegeMemberships,
          eq(
            collegeMemberships.id,
            facultyProfiles.membershipId,
          ),
        )
        .where(
          and(
            eq(
              facultyProfiles.primaryDepartmentId,
              departmentId,
            ),
            ne(
              collegeMemberships.status,
              "ENDED",
            ),
          ),
        ),
      db
        .select({
          count: sql<number>`count(*)::int`,
        })
        .from(courses)
        .where(
          and(
            eq(
              courses.departmentId,
              departmentId,
            ),
            eq(courses.status, "ACTIVE"),
          ),
        ),
    ]);

  return {
    programs: Number(
      programRows[0]?.count ?? 0,
    ),
    faculty: Number(
      facultyRows[0]?.count ?? 0,
    ),
    courses: Number(
      courseRows[0]?.count ?? 0,
    ),
  };
}

async function loadActiveCollegeScope(collegeId: string) {
  const db = getDb();

  const [college] = await db
    .select({
      id: colleges.id,
      organizationId: colleges.organizationId,
    })
    .from(colleges)
    .innerJoin(
      organizations,
      eq(organizations.id, colleges.organizationId),
    )
    .where(
      and(
        eq(colleges.id, collegeId),
        eq(colleges.status, "ACTIVE"),
        eq(organizations.status, "ACTIVE"),
      ),
    )
    .limit(1);

  if (!college) {
    throw new DepartmentServiceError("COLLEGE_NOT_FOUND");
  }

  return college;
}

async function loadActiveDepartmentScope(departmentId: string) {
  const db = getDb();

  const [department] = await db
    .select({
      id: departments.id,
      collegeId: departments.collegeId,
      organizationId: colleges.organizationId,
    })
    .from(departments)
    .innerJoin(colleges, eq(colleges.id, departments.collegeId))
    .innerJoin(
      organizations,
      eq(organizations.id, colleges.organizationId),
    )
    .where(
      and(
        eq(departments.id, departmentId),
        isNull(departments.archivedAt),
        eq(colleges.status, "ACTIVE"),
        eq(organizations.status, "ACTIVE"),
      ),
    )
    .limit(1);

  if (!department) {
    throw new DepartmentServiceError("DEPARTMENT_NOT_FOUND");
  }

  return department;
}

async function assertUniqueActiveName(
  collegeId: string,
  name: string,
  excludeDepartmentId?: string,
) {
  const db = getDb();

  const conditions = [
    eq(departments.collegeId, collegeId),
    isNull(departments.archivedAt),
    sql<boolean>`lower(${departments.name}) = ${name.toLowerCase()}`,
  ];

  if (excludeDepartmentId) {
    conditions.push(ne(departments.id, excludeDepartmentId));
  }

  const [existing] = await db
    .select({ id: departments.id })
    .from(departments)
    .where(and(...conditions))
    .limit(1);

  if (existing) {
    throw new DepartmentServiceError("DEPARTMENT_NAME_CONFLICT");
  }
}

function isUniqueViolation(error: unknown) {
  return Boolean(
    error &&
      typeof error === "object" &&
      "code" in error &&
      (error as { code?: unknown }).code === "23505",
  );
}

export async function listDepartments(
  context: RequestContext,
  collegeIdInput: string,
) {
  const collegeId = collegeIdSchema.parse(collegeIdInput);
  const college = await loadActiveCollegeScope(collegeId);

  requirePermission(context, "department.read", {
    organizationId: college.organizationId,
    collegeId: college.id,
  });

  const db = getDb();

  return db
    .select({
      id: departments.id,
      collegeId: departments.collegeId,
      name: departments.name,
      createdAt: departments.createdAt,
      updatedAt: departments.updatedAt,
    })
    .from(departments)
    .where(
      and(
        eq(departments.collegeId, collegeId),
        isNull(departments.archivedAt),
      ),
    )
    .orderBy(asc(departments.name));
}

export async function createDepartment(
  context: RequestContext,
  rawInput: CreateDepartmentInput,
) {
  const input = createDepartmentInputSchema.parse(rawInput);
  const college = await loadActiveCollegeScope(input.collegeId);

  requirePermission(context, "department.manage", {
    organizationId: college.organizationId,
    collegeId: college.id,
  });

  await assertUniqueActiveName(input.collegeId, input.name);

  const db = getDb();

  try {
    const [created] = await db
      .insert(departments)
      .values({
        collegeId: input.collegeId,
        name: input.name,
      })
      .returning({
        id: departments.id,
        collegeId: departments.collegeId,
        name: departments.name,
        createdAt: departments.createdAt,
        updatedAt: departments.updatedAt,
      });

    return created;
  } catch (error) {
    if (isUniqueViolation(error)) {
      throw new DepartmentServiceError("DEPARTMENT_NAME_CONFLICT");
    }
    throw error;
  }
}

export async function renameDepartment(
  context: RequestContext,
  departmentIdInput: string,
  rawInput: RenameDepartmentInput,
) {
  const departmentId = departmentIdSchema.parse(departmentIdInput);
  const input = renameDepartmentInputSchema.parse(rawInput);
  const scope = await loadActiveDepartmentScope(departmentId);

  requirePermission(context, "department.manage", {
    organizationId: scope.organizationId,
    collegeId: scope.collegeId,
  });

  await assertUniqueActiveName(scope.collegeId, input.name, departmentId);

  const db = getDb();

  try {
    const [updated] = await db
      .update(departments)
      .set({
        name: input.name,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(departments.id, departmentId),
          isNull(departments.archivedAt),
        ),
      )
      .returning({
        id: departments.id,
        collegeId: departments.collegeId,
        name: departments.name,
        createdAt: departments.createdAt,
        updatedAt: departments.updatedAt,
      });

    if (!updated) {
      throw new DepartmentServiceError("DEPARTMENT_NOT_FOUND");
    }

    return updated;
  } catch (error) {
    if (isUniqueViolation(error)) {
      throw new DepartmentServiceError("DEPARTMENT_NAME_CONFLICT");
    }
    throw error;
  }
}

export async function archiveDepartment(
  context: RequestContext,
  departmentIdInput: string,
  resolveUsage: DepartmentUsageResolver =
    resolveDepartmentUsage,
) {
  const departmentId = departmentIdSchema.parse(departmentIdInput);
  const scope = await loadActiveDepartmentScope(departmentId);

  requirePermission(context, "department.manage", {
    organizationId: scope.organizationId,
    collegeId: scope.collegeId,
  });

  const usage = await resolveUsage(departmentId);
  assertDepartmentCanArchive(usage);

  const db = getDb();
  const archivedAt = new Date();

  const [archived] = await db
    .update(departments)
    .set({
      archivedAt,
      updatedAt: archivedAt,
    })
    .where(
      and(
        eq(departments.id, departmentId),
        isNull(departments.archivedAt),
      ),
    )
    .returning({
      id: departments.id,
      collegeId: departments.collegeId,
      name: departments.name,
      archivedAt: departments.archivedAt,
    });

  if (!archived) {
    throw new DepartmentServiceError("DEPARTMENT_NOT_FOUND");
  }

  return archived;
}
