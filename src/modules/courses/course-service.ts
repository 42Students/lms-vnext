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
  courseOfferings,
  courses,
  departments,
} from "@/db/schema";
import type { RequestContext } from "@/modules/identity/context";
import { requirePermission } from "@/modules/permissions/policy";
import {
  loadAcademicCollegeScope,
  loadAcademicDepartmentScope,
} from "@/modules/academics/scope";
import {
  CoursesServiceError,
  postgresConstraintName,
} from "./errors";
import { loadCourseScope } from "./scope";
import {
  collegeIdSchema,
  departmentIdSchema,
} from "@/modules/academics/validation";
import {
  courseIdSchema,
  createCourseInputSchema,
  updateCourseInputSchema,
  type CreateCourseInput,
  type UpdateCourseInput,
} from "./validation";

async function assertCourseUnique(
  departmentId: string,
  input: {
    name?: string;
    code?: string;
  },
  excludeCourseId?: string,
) {
  const db = getDb();

  if (input.name) {
    const conditions = [
      eq(courses.departmentId, departmentId),
      eq(courses.status, "ACTIVE"),
      sql<boolean>`lower(${courses.name}) = ${input.name.toLowerCase()}`,
    ];

    if (excludeCourseId) {
      conditions.push(
        ne(courses.id, excludeCourseId),
      );
    }

    const [existing] = await db
      .select({ id: courses.id })
      .from(courses)
      .where(and(...conditions))
      .limit(1);

    if (existing) {
      throw new CoursesServiceError(
        "COURSE_NAME_CONFLICT",
      );
    }
  }

  if (input.code) {
    const conditions = [
      eq(courses.departmentId, departmentId),
      eq(courses.status, "ACTIVE"),
      sql<boolean>`lower(${courses.code}) = ${input.code.toLowerCase()}`,
    ];

    if (excludeCourseId) {
      conditions.push(
        ne(courses.id, excludeCourseId),
      );
    }

    const [existing] = await db
      .select({ id: courses.id })
      .from(courses)
      .where(and(...conditions))
      .limit(1);

    if (existing) {
      throw new CoursesServiceError(
        "COURSE_CODE_CONFLICT",
      );
    }
  }
}

function mapCourseConstraint(error: unknown) {
  switch (postgresConstraintName(error)) {
    case "courses_active_department_name_uq":
      return new CoursesServiceError(
        "COURSE_NAME_CONFLICT",
      );
    case "courses_active_department_code_uq":
      return new CoursesServiceError(
        "COURSE_CODE_CONFLICT",
      );
    default:
      return error;
  }
}

export async function listCourses(
  context: RequestContext,
  collegeIdInput: string,
  departmentIdInput?: string | null,
  includeArchived = false,
) {
  const collegeId =
    collegeIdSchema.parse(collegeIdInput);
  const college =
    await loadAcademicCollegeScope(collegeId);

  requirePermission(context, "courses.read", {
    organizationId: college.organizationId,
    collegeId,
  });

  const departmentId = departmentIdInput
    ? departmentIdSchema.parse(
        departmentIdInput,
      )
    : null;

  if (departmentId) {
    const department =
      await loadAcademicDepartmentScope(
        departmentId,
      );

    if (department.collegeId !== collegeId) {
      throw new CoursesServiceError(
        "DEPARTMENT_NOT_FOUND",
      );
    }
  }

  const conditions = [
    eq(departments.collegeId, collegeId),
    isNull(departments.archivedAt),
  ];

  if (!includeArchived) {
    conditions.push(eq(courses.status, "ACTIVE"));
  }

  if (departmentId) {
    conditions.push(
      eq(courses.departmentId, departmentId),
    );
  }

  return getDb()
    .select({
      id: courses.id,
      departmentId: courses.departmentId,
      departmentName: departments.name,
      name: courses.name,
      code: courses.code,
      description: courses.description,
      status: courses.status,
      createdAt: courses.createdAt,
      updatedAt: courses.updatedAt,
    })
    .from(courses)
    .innerJoin(
      departments,
      eq(departments.id, courses.departmentId),
    )
    .where(and(...conditions))
    .orderBy(
      asc(departments.name),
      asc(courses.name),
    );
}

export async function createCourse(
  context: RequestContext,
  rawInput: CreateCourseInput,
) {
  const input = createCourseInputSchema.parse(
    rawInput,
  );
  const department =
    await loadAcademicDepartmentScope(
      input.departmentId,
    );

  requirePermission(context, "courses.manage", {
    organizationId: department.organizationId,
    collegeId: department.collegeId,
  });

  await assertCourseUnique(
    input.departmentId,
    input,
  );

  try {
    const [created] = await getDb()
      .insert(courses)
      .values({
        departmentId: input.departmentId,
        name: input.name,
        code: input.code,
        description: input.description ?? null,
      })
      .returning();

    return created;
  } catch (error) {
    throw mapCourseConstraint(error);
  }
}

export async function updateCourse(
  context: RequestContext,
  courseIdInput: string,
  rawInput: UpdateCourseInput,
) {
  const courseId =
    courseIdSchema.parse(courseIdInput);
  const input = updateCourseInputSchema.parse(
    rawInput,
  );
  const scope = await loadCourseScope(courseId);

  requirePermission(context, "courses.manage", {
    organizationId: scope.organizationId,
    collegeId: scope.collegeId,
  });

  await assertCourseUnique(
    scope.departmentId,
    input,
    courseId,
  );

  try {
    const [updated] = await getDb()
      .update(courses)
      .set({
        ...input,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(courses.id, courseId),
          eq(courses.status, "ACTIVE"),
        ),
      )
      .returning();

    if (!updated) {
      throw new CoursesServiceError(
        "COURSE_NOT_FOUND",
      );
    }

    return updated;
  } catch (error) {
    if (error instanceof CoursesServiceError) {
      throw error;
    }
    throw mapCourseConstraint(error);
  }
}

export async function archiveCourse(
  context: RequestContext,
  courseIdInput: string,
) {
  const courseId =
    courseIdSchema.parse(courseIdInput);
  const scope = await loadCourseScope(courseId);

  requirePermission(context, "courses.manage", {
    organizationId: scope.organizationId,
    collegeId: scope.collegeId,
  });

  const db = getDb();
  const [dependent] = await db
    .select({ id: courseOfferings.id })
    .from(courseOfferings)
    .where(
      and(
        eq(courseOfferings.courseId, courseId),
        eq(courseOfferings.status, "ACTIVE"),
      ),
    )
    .limit(1);

  if (dependent) {
    throw new CoursesServiceError(
      "COURSE_HAS_ACTIVE_OFFERINGS",
    );
  }

  const [archived] = await db
    .update(courses)
    .set({
      status: "ARCHIVED",
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(courses.id, courseId),
        eq(courses.status, "ACTIVE"),
      ),
    )
    .returning();

  if (!archived) {
    throw new CoursesServiceError(
      "COURSE_NOT_FOUND",
    );
  }

  return archived;
}
