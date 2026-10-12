import {
  and,
  asc,
  eq,
  ne,
  isNull,
} from "drizzle-orm";
import { getDb } from "@/db/client";
import {
  courseLearningPaths, courseLessons, courseOfferings,
  courses, departments, colleges, organizations,
  cohorts, programs, academicPeriods,
} from "@/db/schema";
import type { RequestContext } from "@/modules/identity/context";
import {
  can,
  requirePermission,
} from "@/modules/permissions/policy";
import {
  CoursesServiceError,
  postgresConstraintName,
} from "./errors";
import {
  requireLearningReadAccess,
} from "./learning-access";
import {
  loadCourseLessonScope,
  loadLearningPathScope,
} from "./scope";
import {
  courseLessonIdSchema,
  createCourseLessonInputSchema,
  learningPathIdSchema,
  updateCourseLessonInputSchema,
  type CreateCourseLessonInput,
  type UpdateCourseLessonInput,
} from "./validation";

/**
 * Lock persisted lesson ancestors under the write transaction, and require
 * the same offering, course, cohort, term and college used for authorization.
 * Changes to any locked parent wait until the lesson write commits.
 */
async function lockLiveLessonWriteAncestry(
  tx: Pick<ReturnType<typeof getDb>, "select">,
  expected: Awaited<ReturnType<typeof loadLearningPathScope>>,
) {
  const [path] = await tx.select({ id: courseLearningPaths.id })
    .from(courseLearningPaths)
    .where(and(
      eq(courseLearningPaths.id, expected.id),
      eq(courseLearningPaths.offeringId, expected.offeringId),
      ne(courseLearningPaths.status, "ARCHIVED"),
    )).for("share").limit(1);
  if (!path) throw new CoursesServiceError("LEARNING_PATH_NOT_FOUND");

  const [offering] = await tx.select({
      courseId: courseOfferings.courseId,
      cohortId: courseOfferings.cohortId,
      academicPeriodId: courseOfferings.academicPeriodId,
      collegeId: departments.collegeId,
      organizationId: colleges.organizationId,
    })
    .from(courseOfferings)
    .innerJoin(courses, eq(courses.id, courseOfferings.courseId))
    .innerJoin(departments, eq(departments.id, courses.departmentId))
    .innerJoin(colleges, eq(colleges.id, departments.collegeId))
    .innerJoin(organizations, eq(organizations.id, colleges.organizationId))
    .where(and(
      eq(courseOfferings.id, expected.offeringId),
      eq(courseOfferings.status, "ACTIVE"),
      eq(courses.status, "ACTIVE"),
      eq(colleges.status, "ACTIVE"),
      eq(organizations.status, "ACTIVE"),
    )).for("share").limit(1);

  if (!offering ||
      offering.courseId !== expected.courseId ||
      offering.cohortId !== expected.cohortId ||
      offering.academicPeriodId !== expected.academicPeriodId ||
      offering.collegeId !== expected.collegeId ||
      offering.organizationId !== expected.organizationId) {
    throw new CoursesServiceError("LEARNING_PATH_NOT_FOUND");
  }

  // Cohort and period tenancy are separate parent chains, not inferred from
  // the offering's course college. Lock them so same-ID upstream reparenting
  // cannot make an authorized lesson write cross-college after pre-read.
  const [cohort] = await tx.select({ collegeId: departments.collegeId })
    .from(cohorts)
    .innerJoin(programs, eq(programs.id, cohorts.programId))
    .innerJoin(departments, eq(departments.id, programs.departmentId))
    .where(and(
      eq(cohorts.id, offering.cohortId),
      eq(programs.status, "ACTIVE"),
      isNull(departments.archivedAt),
    )).for("share").limit(1);

  const [period] = await tx.select({ collegeId: academicPeriods.collegeId })
    .from(academicPeriods)
    .where(eq(academicPeriods.id, offering.academicPeriodId))
    .for("share").limit(1);

  if (!cohort || !period ||
      cohort.collegeId !== expected.collegeId ||
      period.collegeId !== expected.collegeId) {
    throw new CoursesServiceError("LEARNING_PATH_NOT_FOUND");
  }
}

function mapLessonConstraint(error: unknown) {
  switch (postgresConstraintName(error)) {
    case "course_lessons_active_name_uq":
      return new CoursesServiceError(
        "LESSON_NAME_CONFLICT",
      );
    case "course_lessons_active_sequence_uq":
      return new CoursesServiceError(
        "LESSON_SEQUENCE_CONFLICT",
      );
    default:
      return error;
  }
}

export async function listCourseLessons(
  context: RequestContext,
  learningPathIdInput: string,
  deliveryId?: string | null,
  includeArchived = false,
) {
  const learningPathId =
    learningPathIdSchema.parse(
      learningPathIdInput,
    );
  const path = await loadLearningPathScope(
    learningPathId,
    includeArchived,
  );
  const access =
    await requireLearningReadAccess(
      context,
      path.offeringId,
      deliveryId,
      { includeHistorical: includeArchived },
    );

  if (access === "LEARNER") {
    if (path.status !== "PUBLISHED") {
      throw new CoursesServiceError(
        "LEARNING_PATH_NOT_PUBLISHED",
      );
    }
  }

  if (
    includeArchived &&
    !can(context, "courses.manage", {
      organizationId: path.organizationId,
      collegeId: path.collegeId,
    })
  ) {
    throw new CoursesServiceError(
      "LEARNING_ACCESS_DENIED",
    );
  }

  const conditions = [
    eq(
      courseLessons.learningPathId,
      learningPathId,
    ),
  ];

  if (!includeArchived) {
    conditions.push(
      eq(courseLessons.status, "ACTIVE"),
    );
  }

  return getDb()
    .select()
    .from(courseLessons)
    .where(and(...conditions))
    .orderBy(
      asc(courseLessons.sequence),
      asc(courseLessons.name),
    );
}

export async function createCourseLesson(
  context: RequestContext,
  rawInput: CreateCourseLessonInput,
) {
  const input =
    createCourseLessonInputSchema.parse(
      rawInput,
    );
  const path = await loadLearningPathScope(
    input.learningPathId,
  );

  requirePermission(context, "courses.manage", {
    organizationId: path.organizationId,
    collegeId: path.collegeId,
  });

  try {
    return await getDb().transaction(async (tx) => {
      // Path can be archived after loadLearningPathScope. Lock and recheck
      // in this transaction; path transition UPDATE conflicts with SHARE.
      await lockLiveLessonWriteAncestry(tx, path);

      const [created] = await tx
        .insert(courseLessons)
        .values({
          learningPathId:
            input.learningPathId,
          name: input.name,
          description:
            input.description ?? null,
          sequence: input.sequence,
        })
        .returning();

      return created;
    });
  } catch (error) {
    if (error instanceof CoursesServiceError) throw error;
    throw mapLessonConstraint(error);
  }
}

export async function updateCourseLesson(
  context: RequestContext,
  lessonIdInput: string,
  rawInput: UpdateCourseLessonInput,
) {
  const lessonId =
    courseLessonIdSchema.parse(
      lessonIdInput,
    );
  const input =
    updateCourseLessonInputSchema.parse(
      rawInput,
    );
  const current = await loadCourseLessonScope(lessonId);
  const path = await loadLearningPathScope(current.learningPathId);
  if (path.offeringId !== current.offeringId ||
      path.collegeId !== current.collegeId ||
      path.organizationId !== current.organizationId) {
    throw new CoursesServiceError("LESSON_NOT_FOUND");
  }
  requirePermission(context, "courses.manage", {
    organizationId: path.organizationId,
    collegeId: path.collegeId,
  });

  try {
    return await getDb().transaction(async (tx) => {
      await lockLiveLessonWriteAncestry(tx, path);
      const [updated] = await tx
      .update(courseLessons)
      .set({
        ...input,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(courseLessons.id, lessonId),
          eq(courseLessons.status, "ACTIVE"),
          eq(courseLessons.learningPathId, current.learningPathId),
        ),
      )
      .returning();

    if (!updated) {
      throw new CoursesServiceError(
        "LESSON_NOT_FOUND",
      );
    }

      return updated;
    });
  } catch (error) {
    if (error instanceof CoursesServiceError) {
      throw error;
    }
    throw mapLessonConstraint(error);
  }
}

export async function archiveCourseLesson(
  context: RequestContext,
  lessonIdInput: string,
) {
  const lessonId =
    courseLessonIdSchema.parse(
      lessonIdInput,
    );
  const current = await loadCourseLessonScope(lessonId);
  const path = await loadLearningPathScope(current.learningPathId);
  if (path.offeringId !== current.offeringId ||
      path.collegeId !== current.collegeId ||
      path.organizationId !== current.organizationId) {
    throw new CoursesServiceError("LESSON_NOT_FOUND");
  }
  requirePermission(context, "courses.manage", {
    organizationId: path.organizationId,
    collegeId: path.collegeId,
  });

  return getDb().transaction(async (tx) => {
    await lockLiveLessonWriteAncestry(tx, path);
    // Lock the lesson before changing visibility; new content creation
    // takes a matching SHARE lock on this row before its INSERT.
    const [liveLesson] = await tx
      .select({ id: courseLessons.id })
      .from(courseLessons)
      .where(and(
        eq(courseLessons.id, lessonId),
        eq(courseLessons.status, "ACTIVE"),
        eq(courseLessons.learningPathId, current.learningPathId),
      ))
      .for("update")
      .limit(1);

    if (!liveLesson) {
      throw new CoursesServiceError("LESSON_NOT_FOUND");
    }

    const [updated] = await tx
      .update(courseLessons)
      .set({
        status: "ARCHIVED",
        updatedAt: new Date(),
      })
      .where(and(
        eq(courseLessons.id, lessonId),
        eq(courseLessons.status, "ACTIVE"),
        eq(courseLessons.learningPathId, current.learningPathId),
      ))
      .returning();

    if (!updated) {
      throw new CoursesServiceError("LESSON_NOT_FOUND");
    }

    return updated;
  });
}
