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
  lessonContents,
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

/** Course-image receipts contain private R2 keys and token hashes.
 * Ordinary catalogue mutation DTOs must never serialize that server-only
 * metadata, even for authenticated admins. */
function withoutPrivateCourseImageReceipt<T extends {
  legacyMetadata: Record<string, unknown> | null;
}>(row: T): T {
  const meta = row.legacyMetadata;
  if (!meta || !Object.prototype.hasOwnProperty.call(meta, "courseCoverAsset")) return row;
  const clean = { ...meta };
  delete clean["courseCoverAsset"];
  return { ...row, legacyMetadata: clean };
}

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
      isNull(courses.deletedAt),
      sql<boolean>`lower(btrim(${courses.name})) = ${input.name.trim().toLowerCase()}`,
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
      isNull(courses.deletedAt),
      sql<boolean>`lower(btrim(${courses.code})) = ${input.code.trim().toLowerCase()}`,
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
    isNull(courses.deletedAt),
    sql<boolean>`lower(btrim(${courses.shortTitle})) = ${shortTitle.trim().toLowerCase()}`,
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
    case "courses_active_department_name_trim_uq":
      return new CoursesServiceError(
        "COURSE_NAME_CONFLICT",
      );
    case "courses_active_department_code_uq":
    case "courses_active_department_code_live_uq":
      return new CoursesServiceError(
        "COURSE_CODE_CONFLICT",
      );
    case "courses_active_department_short_title_uq":
    case "courses_active_department_short_title_trim_uq":
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
    conditions.push(eq(courses.status, "ACTIVE"),isNull(courses.deletedAt));
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
      // Same lock as the DB05 graph and department guards, before row locks.
      await tx.execute(sql`select pg_advisory_xact_lock(605008001::bigint)`);
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

      if (input.parentCourseId) {
        // Recheck parent scope inside the write transaction with a row lock.
        const [parent] = await tx.select({
          id: courses.id, collegeId: departments.collegeId,
        }).from(courses)
          .innerJoin(departments, eq(departments.id, courses.departmentId))
          .where(and(eq(courses.id, input.parentCourseId),
            eq(courses.status, "ACTIVE"), isNull(courses.deletedAt),
            isNull(departments.archivedAt)))
          .for("share", { of: courses }).limit(1);
        if (!parent || parent.collegeId !== lockedDepartment.collegeId)
          throw new CoursesServiceError("COURSE_PARENT_NOT_FOUND");
      }
      await assertCourseShortTitleUnique(
        tx, input.departmentId, input.shortTitle ?? input.name.slice(0, 255),
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
          shortTitle:input.shortTitle??input.name.slice(0,255),
          officialCode:input.officialCode??null,
          cardColor:input.cardColor??null,
          thumbnailUrl:input.thumbnailUrl||null,
          takeaways:input.takeaways??null,
          orderedTakeaways:input.takeaways?.split(/\r?\n/)
           .map(value=>value.trim()).filter(Boolean)??null,
          introductionHeading:input.introductionHeading??"In this Course",
          enabled:input.enabled??true,
          legacyAllowedForDisplay:(input.enabled??true)?1:0,
          description: input.description ?? null,
        })
        .returning();
      if (!created) throw new Error("COURSE_CREATE_FAILED");
      await recordActivityEventInTransaction(tx, context, {
        eventType: ACTIVITY_EVENT_TYPES.COURSES_CATALOG_CREATED,
        collegeId: department.collegeId, organizationId: department.organizationId,
        subjectType: "course", subjectId: created.id, subjectLabel: created.name,
        summary: "Course created",
        metadata: { departmentId: created.departmentId, code: created.code,
          legacyAuditAction:"COURSE_CREATE",source:"COURSE_CATALOG",
          slug:created.slug,searchFreshness:"DATABASE_READ" },
      });
      return withoutPrivateCourseImageReceipt(created);
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
    {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.code !== undefined ? { code: input.code } : {}),
    },
    courseId,
  );

  try {
    return await getDb().transaction(async (tx) => {
      // Serialize reciprocal reparenting *before* locking the child row.
      if (input.parentCourseId !== undefined)
        await tx.execute(sql`select pg_advisory_xact_lock(605008001::bigint)`);
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
        isNull(courses.deletedAt),
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
          eq(courses.status,"ACTIVE"),isNull(courses.deletedAt),
          isNull(departments.archivedAt)))
          .for("share", { of: courses }).limit(1);
        if(!parent||parent.collegeId!==scope.collegeId)
          throw new CoursesServiceError("COURSE_PARENT_NOT_FOUND");
        // No arbitrary 64-hop cutoff and no endless legacy-corrupt loops.
        const ancestry=await tx.execute(sql`
          with recursive ancestors(id,parent_course_id,visited,cycle) as (
            select c.id,c.parent_course_id,array[c.id],false from courses c
            where c.id=${input.parentCourseId}::uuid
            union all
            select c.id,c.parent_course_id,ancestors.visited||c.id,
              c.id=any(ancestors.visited)
            from courses c join ancestors on c.id=ancestors.parent_course_id
            where not ancestors.cycle
          )
          select exists(select 1 from ancestors
            where id=${courseId}::uuid or cycle) as invalid`);
        if(ancestry.rows[0]?.invalid)
          throw new CoursesServiceError("COURSE_PARENT_CYCLE");
      }
      await assertCourseShortTitleUnique(
        tx, scope.departmentId,
        input.shortTitle ?? locked.shortTitle ?? locked.name.slice(0, 255),
        courseId,
      );
      // The old LMS has independent enabled and allowedForDisplay values.
      // A student-visibility toggle cannot silently disable or archive content.
      const { expectedUpdatedAt, visibleToStudents, ...changes } = input;
      const [updated] = await tx
      .update(courses)
      .set({
        ...changes,
        // Legacy Course fields enabled and allowedForDisplay are independent.
         ...(visibleToStudents!==undefined
           ?{legacyAllowedForDisplay:visibleToStudents?1:0}
           :{}),
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
          isNull(courses.deletedAt),
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
          updatedName: updated.name, updatedCode: updated.code,
          legacyAuditAction:"COURSE_UPDATE",searchFreshness:"DATABASE_READ" },
      });
      return withoutPrivateCourseImageReceipt(updated);
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

    // Legacy deletion distinguishes an active lesson from content under an
    // inactive lesson. Scan historical offerings too: archived lesson content
    // must not be orphaned by a catalogue course deletion.
    const [activeLesson] = await tx
      .select({ id: courseLessons.id })
      .from(courseLessons)
      .innerJoin(courseLearningPaths, eq(courseLessons.learningPathId, courseLearningPaths.id))
      .innerJoin(courseOfferings, eq(courseLearningPaths.offeringId, courseOfferings.id))
      .where(and(eq(courseOfferings.courseId, courseId),
        eq(courseLessons.status, "ACTIVE")))
      .limit(1);
    if (activeLesson) {
      throw new CoursesServiceError("COURSE_HAS_LESSONS");
    }
    const [linkedContent] = await tx
      .select({ id: lessonContents.id })
      .from(lessonContents)
      .innerJoin(courseLessons, eq(lessonContents.lessonId, courseLessons.id))
      .innerJoin(courseLearningPaths, eq(courseLessons.learningPathId, courseLearningPaths.id))
      .innerJoin(courseOfferings, eq(courseLearningPaths.offeringId, courseOfferings.id))
      .where(eq(courseOfferings.courseId, courseId))
      .limit(1);
    if (linkedContent) {
      throw new CoursesServiceError("COURSE_HAS_LESSON_CONTENT");
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
      summary: "Course deleted successfully",
      metadata: { departmentId: archived.departmentId, code: archived.code,
        legacyAuditAction:"COURSE_DELETE",softArchived:true,
        retainedHistory:true,searchFreshness:"DATABASE_READ" },
    });
    return withoutPrivateCourseImageReceipt(archived);
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
      // Report exact name/code collisions before UPDATE instead of relying on
      // a database violation, while the active unique indexes remain the final
      // protection against concurrent writes.
      const conflicts = await tx.select({
        name: courses.name, code: courses.code,
      }).from(courses).where(and(
        eq(courses.departmentId, scope.departmentId),
        eq(courses.status, "ACTIVE"),
        ne(courses.id, courseId),
        sql`(lower(${courses.name}) = ${locked.name.toLowerCase()}
          or lower(${courses.code}) = ${locked.code.toLowerCase()})`,
      )).limit(10);
      if (conflicts.some(item => item.name.toLowerCase() === locked.name.toLowerCase()))
        throw new CoursesServiceError("COURSE_NAME_CONFLICT");
      if (conflicts.length) throw new CoursesServiceError("COURSE_CODE_CONFLICT");
      // The existing database unique indexes guard concurrent restores that
      // conflict with a new active name or code in the same department.
      await assertCourseShortTitleUnique(
        tx, scope.departmentId,
        locked.shortTitle ?? locked.name.slice(0, 255),
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
          legacyAuditAction:"COURSE_RESTORE",searchFreshness:"DATABASE_READ",
          departmentId: restored.departmentId,
          code: restored.code,
        },
      });
      return withoutPrivateCourseImageReceipt(restored);
    });
  } catch (error) {
    if (error instanceof CoursesServiceError) throw error;
    throw mapCourseConstraint(error);
  }
}

/** Compatibility for legacy page=0&size=20 catalog readers. Explicit college
 * must already be selected by a trusted role/college switcher; no global
 * super-admin fallback is inferred from an untrusted query string.
 * Unlike the legacy in-process cache, this reads the committed DB state. */
export async function listLegacyCoursePage(
 context:RequestContext,collegeId:string,options:{
  page?:number;size?:number;departmentId?:string|null;includeArchived?:boolean
 }={},
){
 const page=options.page??0,size=options.size??20;
 if(!Number.isSafeInteger(page)||page<0||page>100000||
   !Number.isSafeInteger(size)||size<1||size>100)
  throw new RangeError("Invalid course page");
 const result=await listCoursesPage(context,collegeId,{
  limit:size,offset:page*size,
 },options.departmentId,options.includeArchived??false);
 return {...result,page,totalPages:Math.ceil(result.total/size)};
}

/** Resolve bookmarked old-slug URLs inside one authorized college only.
 * A duplicate slug across departments is ambiguous: never choose a random
 * tenant or expose a course from another selected membership. */
export async function resolveCourseSlugInCollege(
 context:RequestContext,collegeIdInput:string,slugInput:string,
):Promise<string|null>{
 const collegeId=collegeIdSchema.parse(collegeIdInput);
 const college=await loadAcademicCollegeScope(collegeId);
 requirePermission(context,"courses.read",{
  collegeId,organizationId:college.organizationId,
 });
 const slug=slugInput.trim();
 if(!/^[A-Za-z0-9_-]{1,128}$/.test(slug))return null;
 const matches=await getDb().select({id:courses.id})
  .from(courses).innerJoin(departments,eq(departments.id,courses.departmentId))
  .where(and(eq(departments.collegeId,collegeId),
    isNull(departments.archivedAt),eq(courses.status,"ACTIVE"),
    isNull(courses.deletedAt),eq(courses.slug,slug)))
  .limit(2);
 return matches.length===1?matches[0]!.id:null;
}

/** The old course editor could reassign a course to another department in
 * the SAME college. Retain that operation only when it cannot detach active
 * or historical teaching content from its original academic ownership.
 * Caller must persist a fresh optimistic timestamp from the course detail.
 */
export async function moveCourseDepartment(
 context:RequestContext,courseIdInput:string,newDepartmentIdInput:string,
 expectedUpdatedAt:string,
){
 const courseId=courseIdSchema.parse(courseIdInput);
 const newDepartmentId=departmentIdSchema.parse(newDepartmentIdInput);
 const scope=await loadCourseScope(courseId);
 const target=await loadAcademicDepartmentScope(newDepartmentId);
 if(target.collegeId!==scope.collegeId||target.organizationId!==scope.organizationId)
  throw new CoursesServiceError("DEPARTMENT_NOT_FOUND");
 requireCourseWrite(context,scope.organizationId,scope.collegeId);
 if(!Number.isFinite(Date.parse(expectedUpdatedAt)))
  throw new CoursesServiceError("COURSE_STALE_VERSION");
 try{
  return await getDb().transaction(async tx=>{
   await tx.execute(sql`select pg_advisory_xact_lock(605008001::bigint)`);
   const [current]=await tx.select({
    id:courses.id,name:courses.name,code:courses.code,shortTitle:courses.shortTitle,
    departmentId:courses.departmentId,status:courses.status,
    updatedAt:courses.updatedAt,
   }).from(courses).where(and(eq(courses.id,courseId),
    eq(courses.departmentId,scope.departmentId))).for("update").limit(1);
   if(!current||current.status!=="ACTIVE")throw new CoursesServiceError("COURSE_NOT_FOUND");
   if(current.updatedAt.getTime()!==new Date(expectedUpdatedAt).getTime())
    throw new CoursesServiceError("COURSE_STALE_VERSION");
   if(newDepartmentId===current.departmentId)return current;
   const [linkedOffering]=await tx.select({id:courseOfferings.id})
    .from(courseOfferings).where(eq(courseOfferings.courseId,courseId)).limit(1);
   if(linkedOffering)throw new CoursesServiceError("COURSE_HAS_ACTIVE_OFFERINGS");
   const [lockedTarget]=await tx.select({id:departments.id})
    .from(departments).where(and(eq(departments.id,newDepartmentId),
      eq(departments.collegeId,scope.collegeId),isNull(departments.archivedAt)))
    .for("share").limit(1);
   if(!lockedTarget)throw new CoursesServiceError("DEPARTMENT_NOT_FOUND");
   await assertCourseShortTitleUnique(tx,newDepartmentId,
    current.shortTitle??current.name.slice(0,255),courseId);
   const duplicate=await tx.select({id:courses.id})
    .from(courses).where(and(eq(courses.departmentId,newDepartmentId),
      eq(courses.status,"ACTIVE"),ne(courses.id,courseId),
      sql<boolean>`(lower(${courses.name})=${current.name.toLowerCase()} or lower(${courses.code})=${current.code.toLowerCase()})`))
    .limit(1);
   if(duplicate.length)throw new CoursesServiceError("COURSE_NAME_CONFLICT");
   const [updated]=await tx.update(courses).set({
    departmentId:newDepartmentId,version:sql<number>`${courses.version}+1`,
    updatedAt:sql`greatest(clock_timestamp(),${courses.updatedAt}+interval '1 millisecond')`,
   }).where(and(eq(courses.id,courseId),eq(courses.departmentId,scope.departmentId),
    eq(courses.status,"ACTIVE"),
    sql`date_trunc('milliseconds',${courses.updatedAt})=${expectedUpdatedAt}::timestamptz`))
   .returning();
   if(!updated)throw new CoursesServiceError("COURSE_STALE_VERSION");
   await recordActivityEventInTransaction(tx,context,{
    eventType:ACTIVITY_EVENT_TYPES.COURSES_CATALOG_UPDATED,
    collegeId:scope.collegeId,organizationId:scope.organizationId,
    subjectType:"course",subjectId:updated.id,subjectLabel:updated.name,
    summary:"Course updated",metadata:{
     legacyAuditAction:"COURSE_UPDATE",previousDepartmentId:scope.departmentId,
     departmentId:newDepartmentId,
    },
   });
   return withoutPrivateCourseImageReceipt(updated);
  });
 }catch(error){
  if(error instanceof CoursesServiceError)throw error;
  throw mapCourseConstraint(error);
 }
}
