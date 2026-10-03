import {
  and,
  asc,
  eq,
  ne,
} from "drizzle-orm";
import { getDb } from "@/db/client";
import {
  courseLearningPaths,
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
  loadCourseOfferingScope,
  loadLearningPathScope,
} from "./scope";
import {
  courseOfferingIdSchema,
  createLearningPathInputSchema,
  learningPathIdSchema,
  learningPathTransitionSchema,
  updateLearningPathInputSchema,
  type CreateLearningPathInput,
  type UpdateLearningPathInput,
} from "./validation";

function mapLearningPathConstraint(
  error: unknown,
) {
  if (
    postgresConstraintName(error) ===
    "course_learning_paths_current_uq"
  ) {
    return new CoursesServiceError(
      "LEARNING_PATH_CONFLICT",
    );
  }

  return error;
}

export async function listLearningPaths(
  context: RequestContext,
  offeringIdInput: string,
  deliveryId?: string | null,
  includeArchived = false,
) {
  const offeringId =
    courseOfferingIdSchema.parse(
      offeringIdInput,
    );
  const offering =
    await loadCourseOfferingScope(
      offeringId,
      includeArchived,
    );
  const access =
    await requireLearningReadAccess(
      context,
      offeringId,
      deliveryId,
    );

  if (
    includeArchived &&
    !can(context, "courses.manage", {
      organizationId: offering.organizationId,
      collegeId: offering.collegeId,
    })
  ) {
    throw new CoursesServiceError(
      "LEARNING_ACCESS_DENIED",
    );
  }

  const conditions = [
    eq(
      courseLearningPaths.offeringId,
      offeringId,
    ),
  ];

  if (access === "LEARNER") {
    conditions.push(
      eq(
        courseLearningPaths.status,
        "PUBLISHED",
      ),
    );
  } else if (!includeArchived) {
    conditions.push(
      ne(
        courseLearningPaths.status,
        "ARCHIVED",
      ),
    );
  }

  return getDb()
    .select()
    .from(courseLearningPaths)
    .where(and(...conditions))
    .orderBy(asc(courseLearningPaths.createdAt));
}

export async function createLearningPath(
  context: RequestContext,
  rawInput: CreateLearningPathInput,
) {
  const input =
    createLearningPathInputSchema.parse(
      rawInput,
    );
  const offering =
    await loadCourseOfferingScope(
      input.offeringId,
    );

  requirePermission(context, "courses.manage", {
    organizationId: offering.organizationId,
    collegeId: offering.collegeId,
  });

  try {
    const [created] = await getDb()
      .insert(courseLearningPaths)
      .values({
        offeringId: input.offeringId,
        title: input.title,
        description:
          input.description ?? null,
      })
      .returning();

    return created;
  } catch (error) {
    throw mapLearningPathConstraint(error);
  }
}

export async function updateLearningPath(
  context: RequestContext,
  learningPathIdInput: string,
  rawInput: UpdateLearningPathInput,
) {
  const learningPathId =
    learningPathIdSchema.parse(
      learningPathIdInput,
    );
  const input =
    updateLearningPathInputSchema.parse(
      rawInput,
    );
  const current =
    await loadLearningPathScope(
      learningPathId,
    );

  requirePermission(context, "courses.manage", {
    organizationId: current.organizationId,
    collegeId: current.collegeId,
  });

  const [updated] = await getDb()
    .update(courseLearningPaths)
    .set({
      ...input,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(
          courseLearningPaths.id,
          learningPathId,
        ),
        ne(
          courseLearningPaths.status,
          "ARCHIVED",
        ),
      ),
    )
    .returning();

  if (!updated) {
    throw new CoursesServiceError(
      "LEARNING_PATH_NOT_FOUND",
    );
  }

  return updated;
}

export async function transitionLearningPath(
  context: RequestContext,
  learningPathIdInput: string,
  rawInput: unknown,
) {
  const learningPathId =
    learningPathIdSchema.parse(
      learningPathIdInput,
    );
  const input =
    learningPathTransitionSchema.parse(
      rawInput,
    );
  const current =
    await loadLearningPathScope(
      learningPathId,
    );

  requirePermission(context, "courses.manage", {
    organizationId: current.organizationId,
    collegeId: current.collegeId,
  });

  const nextStatus =
    input.action === "PUBLISH"
      ? "PUBLISHED"
      : "ARCHIVED";

  if (
    (input.action === "PUBLISH" &&
      current.status !== "DRAFT") ||
    (input.action === "ARCHIVE" &&
      current.status === "ARCHIVED")
  ) {
    throw new CoursesServiceError(
      "INVALID_LEARNING_PATH_TRANSITION",
    );
  }

  const [updated] = await getDb()
    .update(courseLearningPaths)
    .set({
      status: nextStatus,
      updatedAt: new Date(),
    })
    .where(
      eq(
        courseLearningPaths.id,
        learningPathId,
      ),
    )
    .returning();

  if (!updated) {
    throw new CoursesServiceError(
      "LEARNING_PATH_NOT_FOUND",
    );
  }

  return updated;
}
