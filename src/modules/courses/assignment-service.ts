import {
  and,
  asc,
  eq,
  isNull,
  ne,
  or,
} from "drizzle-orm";
import { getDb } from "@/db/client";
import {
  assignmentSubmissions,
  courseAssignments,
} from "@/db/schema";
import type { RequestContext } from "@/modules/identity/context";
import {
  can,
  requirePermission,
} from "@/modules/permissions/policy";
import {
  requireDeliveryContentMutation,
  requireLearningReadAccess,
} from "./learning-access";
import {
  CoursesServiceError,
  postgresConstraintName,
} from "./errors";
import {
  loadCourseLessonScope,
  loadCourseSectionDeliveryScope,
} from "./scope";
import {
  loadCourseAssignmentScope,
} from "./assignment-scope";
import {
  assignmentTransitionSchema,
  courseAssignmentIdSchema,
  createCourseAssignmentInputSchema,
  updateCourseAssignmentInputSchema,
  type CreateCourseAssignmentInput,
  type UpdateCourseAssignmentInput,
} from "./assignment-validation";
import {
  courseLessonIdSchema,
  courseSectionDeliveryIdSchema,
} from "./validation";

function mapAssignmentConstraint(
  error: unknown,
) {
  switch (postgresConstraintName(error)) {
    case "course_assignments_generic_active_name_uq":
    case "course_assignments_delivery_active_name_uq":
      return new CoursesServiceError(
        "ASSIGNMENT_NAME_CONFLICT",
      );
    case "course_assignments_generic_active_sequence_uq":
    case "course_assignments_delivery_active_sequence_uq":
      return new CoursesServiceError(
        "ASSIGNMENT_SEQUENCE_CONFLICT",
      );
    default:
      return error;
  }
}

async function authorizeAssignmentMutation(
  context: RequestContext,
  assignment: Awaited<
    ReturnType<
      typeof loadCourseAssignmentScope
    >
  >,
) {
  if (assignment.deliveryId) {
    await requireDeliveryContentMutation(
      context,
      assignment.deliveryId,
    );
    return;
  }

  requirePermission(context, "courses.manage", {
    organizationId: assignment.organizationId,
    collegeId: assignment.collegeId,
  });
}

export async function listCourseAssignments(
  context: RequestContext,
  lessonIdInput: string,
  deliveryIdInput?: string | null,
  includeArchived = false,
) {
  const lessonId =
    courseLessonIdSchema.parse(
      lessonIdInput,
    );
  const deliveryId = deliveryIdInput
    ? courseSectionDeliveryIdSchema.parse(
        deliveryIdInput,
      )
    : null;
  const lesson = await loadCourseLessonScope(
    lessonId,
    includeArchived,
  );
  const access =
    await requireLearningReadAccess(
      context,
      lesson.offeringId,
      deliveryId,
    );

  if (
    access === "LEARNER" &&
    lesson.learningPathStatus !== "PUBLISHED"
  ) {
    throw new CoursesServiceError(
      "LEARNING_PATH_NOT_PUBLISHED",
    );
  }

  if (
    includeArchived &&
    !can(context, "courses.manage", {
      organizationId: lesson.organizationId,
      collegeId: lesson.collegeId,
    })
  ) {
    throw new CoursesServiceError(
      "LEARNING_ACCESS_DENIED",
    );
  }

  const audience = deliveryId
    ? or(
        isNull(courseAssignments.deliveryId),
        eq(
          courseAssignments.deliveryId,
          deliveryId,
        ),
      )
    : isNull(courseAssignments.deliveryId);

  const conditions = [
    eq(courseAssignments.lessonId, lessonId),
    audience,
  ];

  if (access === "LEARNER") {
    conditions.push(
      eq(
        courseAssignments.status,
        "PUBLISHED",
      ),
    );
  } else if (!includeArchived) {
    conditions.push(
      ne(
        courseAssignments.status,
        "ARCHIVED",
      ),
    );
  }

  return getDb()
    .select()
    .from(courseAssignments)
    .where(and(...conditions))
    .orderBy(
      asc(courseAssignments.sequence),
      asc(courseAssignments.createdAt),
      asc(courseAssignments.id),
    );
}

export async function createCourseAssignment(
  context: RequestContext,
  rawInput: CreateCourseAssignmentInput,
) {
  const input =
    createCourseAssignmentInputSchema.parse(
      rawInput,
    );
  const lesson = await loadCourseLessonScope(
    input.lessonId,
  );

  if (input.deliveryId) {
    const delivery =
      await loadCourseSectionDeliveryScope(
        input.deliveryId,
      );

    if (
      delivery.offeringId !==
      lesson.offeringId
    ) {
      throw new CoursesServiceError(
        "ASSIGNMENT_DELIVERY_MISMATCH",
      );
    }

    await requireDeliveryContentMutation(
      context,
      input.deliveryId,
    );
  } else {
    requirePermission(
      context,
      "courses.manage",
      {
        organizationId: lesson.organizationId,
        collegeId: lesson.collegeId,
      },
    );
  }

  try {
    const [created] = await getDb()
      .insert(courseAssignments)
      .values({
        lessonId: input.lessonId,
        deliveryId:
          input.deliveryId ?? null,
        title: input.title,
        description:
          input.description ?? null,
        dueAt: input.dueAt
          ? new Date(input.dueAt)
          : null,
        maxPoints: input.maxPoints,
        sequence: input.sequence,
        createdByUserId: context.user.id,
      })
      .returning();

    return created;
  } catch (error) {
    throw mapAssignmentConstraint(error);
  }
}

export async function updateCourseAssignment(
  context: RequestContext,
  assignmentIdInput: string,
  rawInput: UpdateCourseAssignmentInput,
) {
  const assignmentId =
    courseAssignmentIdSchema.parse(
      assignmentIdInput,
    );
  const input =
    updateCourseAssignmentInputSchema.parse(
      rawInput,
    );
  const current =
    await loadCourseAssignmentScope(
      assignmentId,
    );

  await authorizeAssignmentMutation(
    context,
    current,
  );

  if (
    input.maxPoints !== undefined &&
    input.maxPoints !== current.maxPoints
  ) {
    const [submission] = await getDb()
      .select({ id: assignmentSubmissions.id })
      .from(assignmentSubmissions)
      .where(
        eq(
          assignmentSubmissions.assignmentId,
          assignmentId,
        ),
      )
      .limit(1);

    if (submission) {
      throw new CoursesServiceError(
        "ASSIGNMENT_HAS_SUBMISSIONS",
      );
    }
  }

  try {
    const [updated] = await getDb()
      .update(courseAssignments)
      .set({
        ...(input.title !== undefined
          ? { title: input.title }
          : {}),
        ...(input.description !== undefined
          ? {
              description:
                input.description,
            }
          : {}),
        ...(input.dueAt !== undefined
          ? {
              dueAt: input.dueAt
                ? new Date(input.dueAt)
                : null,
            }
          : {}),
        ...(input.maxPoints !== undefined
          ? {
              maxPoints: input.maxPoints,
            }
          : {}),
        ...(input.sequence !== undefined
          ? { sequence: input.sequence }
          : {}),
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(
            courseAssignments.id,
            assignmentId,
          ),
          ne(
            courseAssignments.status,
            "ARCHIVED",
          ),
        ),
      )
      .returning();

    if (!updated) {
      throw new CoursesServiceError(
        "ASSIGNMENT_NOT_FOUND",
      );
    }

    return updated;
  } catch (error) {
    if (error instanceof CoursesServiceError) {
      throw error;
    }
    throw mapAssignmentConstraint(error);
  }
}

export async function transitionCourseAssignment(
  context: RequestContext,
  assignmentIdInput: string,
  rawInput: unknown,
) {
  const assignmentId =
    courseAssignmentIdSchema.parse(
      assignmentIdInput,
    );
  const input =
    assignmentTransitionSchema.parse(
      rawInput,
    );
  const current =
    await loadCourseAssignmentScope(
      assignmentId,
    );

  await authorizeAssignmentMutation(
    context,
    current,
  );

  if (
    input.action === "PUBLISH" &&
    current.status !== "DRAFT"
  ) {
    throw new CoursesServiceError(
      "INVALID_ASSIGNMENT_TRANSITION",
    );
  }

  if (
    input.action === "PUBLISH" &&
    current.dueAt &&
    current.dueAt.getTime() <= Date.now()
  ) {
    throw new CoursesServiceError(
      "ASSIGNMENT_DEADLINE_PASSED",
    );
  }

  const nextStatus =
    input.action === "PUBLISH"
      ? "PUBLISHED"
      : "ARCHIVED";

  const [updated] = await getDb()
    .update(courseAssignments)
    .set({
      status: nextStatus,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(
          courseAssignments.id,
          assignmentId,
        ),
        ne(
          courseAssignments.status,
          "ARCHIVED",
        ),
      ),
    )
    .returning();

  if (!updated) {
    throw new CoursesServiceError(
      "ASSIGNMENT_NOT_FOUND",
    );
  }

  return updated;
}
