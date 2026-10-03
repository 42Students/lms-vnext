import {
  and,
  asc,
  eq,
} from "drizzle-orm";
import { getDb } from "@/db/client";
import { courseLessons } from "@/db/schema";
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
    const [created] = await getDb()
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
  } catch (error) {
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
  const current =
    await loadCourseLessonScope(lessonId);

  requirePermission(context, "courses.manage", {
    organizationId: current.organizationId,
    collegeId: current.collegeId,
  });

  try {
    const [updated] = await getDb()
      .update(courseLessons)
      .set({
        ...input,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(courseLessons.id, lessonId),
          eq(courseLessons.status, "ACTIVE"),
        ),
      )
      .returning();

    if (!updated) {
      throw new CoursesServiceError(
        "LESSON_NOT_FOUND",
      );
    }

    return updated;
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
  const current =
    await loadCourseLessonScope(lessonId);

  requirePermission(context, "courses.manage", {
    organizationId: current.organizationId,
    collegeId: current.collegeId,
  });

  const [updated] = await getDb()
    .update(courseLessons)
    .set({
      status: "ARCHIVED",
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(courseLessons.id, lessonId),
        eq(courseLessons.status, "ACTIVE"),
      ),
    )
    .returning();

  if (!updated) {
    throw new CoursesServiceError(
      "LESSON_NOT_FOUND",
    );
  }

  return updated;
}
