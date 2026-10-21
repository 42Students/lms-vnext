import { randomUUID } from "node:crypto";
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
  colleges,
  courseOfferings,
  courseLearningPaths,
  courseLessons,
  courses,
  departments,
  organizations,
} from "@/db/schema";
import type { RequestContext } from "@/modules/identity/context";
import { AuthorizationError, can, requirePermission } from "@/modules/permissions/policy";
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

type CourseTx = Parameters<Parameters<ReturnType<typeof getDb>["transaction"]>[0]>[0];
type CourseRunner = <T>(work: (tx: CourseTx) => Promise<T>) => Promise<T>;

function requireCourseWrite(context: RequestContext, organizationId: string, collegeId: string) {
  if (!can(context, "courses.manage", { organizationId, collegeId }))
    throw new AuthorizationError("courses.manage");
  requirePermission(context, "courses.manage", { organizationId, collegeId });
}

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

/** Legacy parity: short titles are unique per active department, case-insensitively.
 * The future DB unique index is tracked as a migration handoff; this service
 * precheck also provides the legacy field-level conflict before INSERT. */
async function assertCourseShortTitleUnique(
  tx: CourseTx,
  departmentId: string,
  shortTitle: string,
  excludeCourseId?: string,
) {
  const conditions = [
    eq(courses.departmentId, departmentId),
    eq(courses.status, "ACTIVE"),
    sql<boolean>`lower(${courses.shortTitle}) = ${shortTitle.toLowerCase()}`,
  ];
  if (excludeCourseId) conditions.push(ne(courses.id, excludeCourseId));
  const [collision] = await tx
    .select({ id: courses.id })
    .from(courses)
    .where(and(...conditions))
    .limit(1);
  if (collision) throw new CoursesServiceError("COURSE_NAME_CONFLICT");
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
    case "courses_active_department_short_title_uq":
      // Preserve the legacy name-or-short-title collision message.
      return new CoursesServiceError("COURSE_NAME_CONFLICT");
    default:
      return error;
  }
}

export async function listCourses(
  context: RequestContext,
  collegeIdInput: string,
  departmentIdInput?: string | null,
  includeArchived = false,
  paging?: { limit: number; offset: number },
  onlyArchived = false,
) {
  const collegeId =
    collegeIdSchema.parse(collegeIdInput);
  const college =
    await loadAcademicCollegeScope(collegeId);

  requirePermission(context, "courses.read", {
    organizationId: college.organizationId,
    collegeId,
  });
  // Archived results expose retained course history. Only an authorized
  // course manager may intentionally request them, never a read-only actor.
  if (includeArchived || onlyArchived) {
    requireCourseWrite(context, college.organizationId, collegeId);
  }

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

  if (onlyArchived) {
    conditions.push(eq(courses.status, "ARCHIVED"));
  } else if (!includeArchived) {
    conditions.push(eq(courses.status, "ACTIVE"));
  }

  if (departmentId) {
    conditions.push(
      eq(courses.departmentId, departmentId),
    );
  }

  const query = getDb()
    .select({
      id: courses.id,
      departmentId: courses.departmentId,
      departmentName: departments.name,
      name: courses.name,
      code: courses.code,
      slug: courses.slug,
      enabled: courses.enabled,
      legacyAllowedForDisplay: courses.legacyAllowedForDisplay,
      shortTitle:courses.shortTitle,officialCode:courses.officialCode,cardColor:courses.cardColor,
      imageUrl: courses.imageUrl,
      imageUrlLearningPath: courses.imageUrlLearningPath,
      thumbnailUrl: courses.thumbnailUrl,
      introductionHeading: courses.introductionHeading,
      orderedTakeaways: courses.orderedTakeaways,
      takeaways:courses.takeaways,
      description: courses.description,
      status: courses.status,
      version: courses.version,
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
      asc(courses.id),
    );

  if (!paging) return query;
  if (!Number.isSafeInteger(paging.limit) || paging.limit < 1 ||
      !Number.isSafeInteger(paging.offset) || paging.offset < 0) {
    throw new RangeError("Invalid course page");
  }
  return query.limit(Math.min(100, paging.limit)).offset(paging.offset);
}

/** Indexed SQL page and count, scoped with the same authorization as listCourses.
 * The unpaged call remains available to existing legacy-compatible consumers. */
export async function listCoursesPage(
  context: RequestContext,
  collegeIdInput: string,
  paging: { limit: number; offset: number },
  departmentIdInput?: string | null,
  includeArchived = false,
  onlyArchived = false,
) {
  const coursesPage = await listCourses(
    context, collegeIdInput, departmentIdInput, includeArchived, paging,
    onlyArchived,
  );
  const collegeId = collegeIdSchema.parse(collegeIdInput);
  const departmentId = departmentIdInput
    ? departmentIdSchema.parse(departmentIdInput) : null;
  const conditions = [
    eq(departments.collegeId, collegeId),
    isNull(departments.archivedAt),
  ];
  if (onlyArchived) conditions.push(eq(courses.status, "ARCHIVED"));
  else if (!includeArchived) conditions.push(eq(courses.status, "ACTIVE"));
  if (departmentId) conditions.push(eq(courses.departmentId, departmentId));
  const [counter] = await getDb()
    .select({ total: sql<number>`count(*)::int` })
    .from(courses)
    .innerJoin(departments, eq(departments.id, courses.departmentId))
    .where(and(...conditions));
  return {
    courses: coursesPage,
    total: counter?.total ?? 0,
    limit: Math.min(100, paging.limit),
    offset: paging.offset,
  };
}

/** A separate, bounded recycle-bin read. Never mix archives into the
 * ordinary course catalogue unless the caller explicitly requests that view. */
export async function listArchivedCoursesPage(
  context: RequestContext,
  collegeId: string,
  paging: { limit: number; offset: number },
  departmentId?: string | null,
) {
  return listCoursesPage(context, collegeId, paging, departmentId, true, true);
}

export async function createCourse(
  context: RequestContext,
  rawInput: CreateCourseInput,
  transaction: CourseRunner = (work) => getDb().transaction(work),
) {
  const input = createCourseInputSchema.parse(
    rawInput,
  );
  const department =
    await loadAcademicDepartmentScope(
      input.departmentId,
    );

  requireCourseWrite(context, department.organizationId, department.collegeId);

  await assertCourseUnique(
    input.departmentId,
    input,
  );

  try {
    return await transaction(async (tx) => {
      // Department may be archived, transferred to another college, or its
      // college/organization disabled after the permission precheck. Hold
      // SHARE locks on the entire authorized tenant path through INSERT.
      const [lockedDepartment] = await tx
        .select({
          id: departments.id,
          collegeId: departments.collegeId,
          organizationId: colleges.organizationId,
        })
        .from(departments)
        .innerJoin(
          colleges,
          eq(colleges.id, departments.collegeId),
        )
        .innerJoin(
          organizations,
          eq(organizations.id, colleges.organizationId),
        )
        .where(and(
          eq(departments.id, input.departmentId),
          isNull(departments.archivedAt),
          eq(colleges.status, "ACTIVE"),
          eq(organizations.status, "ACTIVE"),
        ))
        .for("share")
        .limit(1);

      if (!lockedDepartment ||
          lockedDepartment.collegeId !== department.collegeId ||
          lockedDepartment.organizationId !== department.organizationId) {
        throw new CoursesServiceError("DEPARTMENT_NOT_FOUND");
      }

      if(input.parentCourseId){
        const parent=await loadCourseScope(input.parentCourseId);
        if(parent.collegeId!==department.collegeId||
           parent.organizationId!==department.organizationId)
          throw new CoursesServiceError("COURSE_PARENT_NOT_FOUND");
      }
      await assertCourseShortTitleUnique(
        tx, input.departmentId, input.shortTitle ?? input.name.slice(0, 64),
      );
      const [created] = await tx
        .insert(courses)
        .values({
          departmentId: input.departmentId,
          parentCourseId:input.parentCourseId??null,
          name: input.name,
          code: input.code,
          // A generated immutable public slug is distinct from course code.
          // Imported legacy slugs retain their original value and identity.
          slug: `c-${randomUUID().replace(/-/g, "")}`,
          createdByOrganizationId: department.organizationId,
          shortTitle:input.shortTitle??input.name.slice(0,64),
          officialCode:input.officialCode??null,
          cardColor:input.cardColor??null,
          takeaways:input.takeaways??null,
          orderedTakeaways:input.takeaways?.split(/\r?\n/)
           .map(value=>value.trim()).filter(Boolean)??null,
          introductionHeading:input.introductionHeading??"In this Course",
          enabled:input.enabled??true,
          legacyAllowedForDisplay:(input.enabled??true)?1:0,
          description: input.description ?? null,
        })
        .returning();
      await recordActivityEventInTransaction(tx, context, {
        eventType: ACTIVITY_EVENT_TYPES.COURSES_CATALOG_CREATED,
        collegeId: department.collegeId, organizationId: department.organizationId,
        subjectType: "course", subjectId: created.id, subjectLabel: created.name,
        summary: "Course created",
        metadata: { departmentId: created.departmentId, code: created.code },
      });
      return created;
    });
  } catch (error) {
    if (error instanceof CoursesServiceError) throw error;
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

  requireCourseWrite(context, scope.organizationId, scope.collegeId);

  await assertCourseUnique(
    scope.departmentId,
    input,
    courseId,
  );

  try {
    return await getDb().transaction(async (tx) => {
      const [locked] = await tx.select({
        id: courses.id, name: courses.name, code: courses.code,
        shortTitle: courses.shortTitle,
        status: courses.status, departmentId: courses.departmentId,
        updatedAt: courses.updatedAt,
      }).from(courses).innerJoin(departments, and(
        eq(departments.id, courses.departmentId),
        eq(departments.collegeId, scope.collegeId),
        isNull(departments.archivedAt),
      )).where(and(
        eq(courses.id, courseId),
        eq(courses.departmentId, scope.departmentId),
      )).for("update", { of: courses }).limit(1);
      if (!locked || locked.status !== "ACTIVE")
        throw new CoursesServiceError("COURSE_NOT_FOUND");
      if (locked.updatedAt.getTime() !== new Date(input.expectedUpdatedAt).getTime()) {
        throw new CoursesServiceError("COURSE_STALE_VERSION");
      }
      if(input.parentCourseId){
        if(input.parentCourseId===courseId)
          throw new CoursesServiceError("COURSE_PARENT_CYCLE");
        const [parent]=await tx.select({
          id:courses.id,collegeId:departments.collegeId,
        }).from(courses).innerJoin(departments,eq(departments.id,courses.departmentId))
         .where(and(eq(courses.id,input.parentCourseId),
          eq(courses.status,"ACTIVE"))).for("share").limit(1);
        if(!parent||parent.collegeId!==scope.collegeId)
          throw new CoursesServiceError("COURSE_PARENT_NOT_FOUND");
        const ancestry=await tx.execute(sql`with recursive ancestors as (
          select id,parent_course_id,0 as depth from courses
          where id=${input.parentCourseId}::uuid
          union all
          select c.id,c.parent_course_id,ancestors.depth+1
          from courses c join ancestors on c.id=ancestors.parent_course_id
          where ancestors.depth<64
        ) select id from ancestors where id=${courseId}::uuid limit 1`);
        if(ancestry.rows.length)
          throw new CoursesServiceError("COURSE_PARENT_CYCLE");
      }
      await assertCourseShortTitleUnique(
        tx, scope.departmentId,
        input.shortTitle ?? locked.shortTitle ?? locked.name.slice(0, 64),
        courseId,
      );
      const { expectedUpdatedAt, ...changes } = input;
      const [updated] = await tx
      .update(courses)
      .set({
        ...changes,
        ...(input.enabled===undefined?{}:{
          legacyAllowedForDisplay:input.enabled?1:0,
        }),
        version: sql<number>`${courses.version} + 1`,
        // The persisted token MUST advance even for two edits within one
        // millisecond (or across app/DB clocks). The browser sends this exact
        // updatedAt back as the optimistic concurrency token.
        updatedAt: sql`greatest(now(), ${courses.updatedAt} + interval '1 millisecond')`,
      })
      .where(
        and(
          eq(courses.id, courseId),
          eq(courses.status, "ACTIVE"),
          // A course moved to a different department since permission lookup
          // must not be edited with stale tenant authorization.
          eq(courses.departmentId, scope.departmentId),
          // Compare the browser token to the persisted millisecond version.
          sql`date_trunc('milliseconds', ${courses.updatedAt}) = ${expectedUpdatedAt}::timestamptz`,
        ),
      )
      .returning();

    if (!updated) {
      throw new CoursesServiceError(
        "COURSE_STALE_VERSION",
      );
    }

      await recordActivityEventInTransaction(tx, context, {
        eventType: ACTIVITY_EVENT_TYPES.COURSES_CATALOG_UPDATED,
        collegeId: scope.collegeId, organizationId: scope.organizationId,
        subjectType: "course", subjectId: updated.id, subjectLabel: updated.name,
        summary: "Course updated",
        metadata: { previousName: locked.name, previousCode: locked.code,
          updatedName: updated.name, updatedCode: updated.code },
      });
      return updated;
    });
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

  requireCourseWrite(context, scope.organizationId, scope.collegeId);

  // Serialize the child-existence check with offering INSERT. PostgreSQL
  // FK checks take KEY SHARE on the referenced course; FOR UPDATE conflicts
  // with that lock. A pre-read outside a transaction leaves a phantom race.
  return getDb().transaction(async (tx) => {
    const [lockedCourse] = await tx
      .select({ id: courses.id })
      .from(courses)
      .where(and(
        eq(courses.id, courseId),
        eq(courses.status, "ACTIVE"),
        // Require the same owning department used for authorization.
        eq(courses.departmentId, scope.departmentId),
      ))
      .for("update")
      .limit(1);

    if (!lockedCourse) {
      throw new CoursesServiceError("COURSE_NOT_FOUND");
    }

    const [dependent] = await tx
      .select({ id: courseOfferings.id })
      .from(courseOfferings)
      .where(and(
        eq(courseOfferings.courseId, courseId),
        eq(courseOfferings.status, "ACTIVE"),
      ))
      .limit(1);

    if (dependent) {
      throw new CoursesServiceError("COURSE_HAS_ACTIVE_OFFERINGS");
    }

    // Legacy deletion was blocked by linked lesson content. Include closed
    // historical offerings: archiving a catalogue course must not obscure
    // a syllabus that still contains lessons.
    const [linkedLesson] = await tx
      .select({ id: courseLessons.id })
      .from(courseLessons)
      .innerJoin(courseLearningPaths, eq(courseLessons.learningPathId, courseLearningPaths.id))
      .innerJoin(courseOfferings, eq(courseLearningPaths.offeringId, courseOfferings.id))
      .where(eq(courseOfferings.courseId, courseId))
      .limit(1);
    if (linkedLesson) {
      throw new CoursesServiceError("COURSE_HAS_ACTIVE_OFFERINGS");
    }

    const [archived] = await tx
      .update(courses)
      .set({
        status: "ARCHIVED",
        deletedAt: new Date(),
        version: sql<number>`${courses.version} + 1`,
        updatedAt: sql`greatest(now(), ${courses.updatedAt} + interval '1 millisecond')`,
      })
      .where(and(
        eq(courses.id, courseId),
        eq(courses.status, "ACTIVE"),
        // Require the same owning department used for authorization.
        eq(courses.departmentId, scope.departmentId),
      ))
      .returning();

    if (!archived) {
      throw new CoursesServiceError("COURSE_NOT_FOUND");
    }

    await recordActivityEventInTransaction(tx, context, {
      eventType: ACTIVITY_EVENT_TYPES.COURSES_CATALOG_ARCHIVED,
      collegeId: scope.collegeId, organizationId: scope.organizationId,
      subjectType: "course", subjectId: archived.id, subjectLabel: archived.name,
      summary: "Course archived",
      metadata: { departmentId: archived.departmentId, code: archived.code },
    });
    return archived;
  });
}

/** Restores a previously archived course without changing its immutable UUID
 * or its archived offering/history records. Route and recycle-tab UI are
 * separate handoffs owned by the API and page packets. */
export async function restoreCourse(
  context: RequestContext,
  courseIdInput: string,
) {
  const courseId = courseIdSchema.parse(courseIdInput);
  const scope = await loadCourseScope(courseId, true);
  requireCourseWrite(context, scope.organizationId, scope.collegeId);

  try {
    return await getDb().transaction(async (tx) => {
      const [locked] = await tx
        .select({
          id: courses.id,
          name: courses.name,
          code: courses.code,
          shortTitle: courses.shortTitle,
          departmentId: courses.departmentId,
          status: courses.status,
        })
        .from(courses)
        .innerJoin(departments, and(
          eq(departments.id, courses.departmentId),
          eq(departments.collegeId, scope.collegeId),
          isNull(departments.archivedAt),
        ))
        .where(and(
          eq(courses.id, courseId),
          eq(courses.departmentId, scope.departmentId),
        ))
        .for("update", { of: courses })
        .limit(1);

      if (!locked || locked.status !== "ARCHIVED") {
        throw new CoursesServiceError("COURSE_NOT_FOUND");
      }
      // The existing database unique indexes guard concurrent restores that
      // conflict with a new active name or code in the same department.
      await assertCourseShortTitleUnique(
        tx, scope.departmentId,
        locked.shortTitle ?? locked.name.slice(0, 120),
        courseId,
      );
      const [restored] = await tx
        .update(courses)
        .set({
          status: "ACTIVE",
          deletedAt: null,
          version: sql<number>`${courses.version} + 1`,
          updatedAt: sql`greatest(now(), ${courses.updatedAt} + interval '1 millisecond')`,
        })
        .where(and(
          eq(courses.id, courseId),
          eq(courses.departmentId, scope.departmentId),
          eq(courses.status, "ARCHIVED"),
        ))
        .returning();
      if (!restored) throw new CoursesServiceError("COURSE_STALE_VERSION");
      await recordActivityEventInTransaction(tx, context, {
        eventType: ACTIVITY_EVENT_TYPES.COURSES_CATALOG_UPDATED,
        collegeId: scope.collegeId,
        organizationId: scope.organizationId,
        subjectType: "course",
        subjectId: restored.id,
        subjectLabel: restored.name,
        summary: "Course restored",
        metadata: {
          restoredFromArchive: true,
          departmentId: restored.departmentId,
          code: restored.code,
        },
      });
      return restored;
    });
  } catch (error) {
    if (error instanceof CoursesServiceError) throw error;
    throw mapCourseConstraint(error);
  }
}
