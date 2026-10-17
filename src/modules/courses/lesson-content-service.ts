import {
  and,
  asc,
  eq,
  isNull,
  ne,
  or,
} from "drizzle-orm";
import { getDb } from "@/db/client";
import { lockLiveLessonWriteAncestry } from "./lesson-write-ancestry";
import { lessonContentOrderRuntimeEnabled } from "./lesson-content-order-readiness";
// Learner-only visibility helper is dynamically loaded below; browser seed uses this service without it.
import { courseLessons, courseSectionDeliveries, lessonContents } from "@/db/schema";
import type { RequestContext } from "@/modules/identity/context";
import {
  can,
  requirePermission,
} from "@/modules/permissions/policy";
import { CoursesServiceError } from "./errors";
import {
  requireDeliveryContentMutation,
  requireLearningReadAccess,
} from "./learning-access";
import {
  loadCourseLessonScope,
  loadCourseSectionDeliveryScope,
  loadLessonContentScope,
  loadLearningPathScope,
} from "./scope";
import {
  courseSectionDeliveryIdSchema,
  createLessonContentInputSchema,
  lessonContentIdSchema,
  lessonContentTransitionSchema,
  courseLessonIdSchema,
  updateLessonContentInputSchema,
  type CreateLessonContentInput,
  type UpdateLessonContentInput,
} from "./validation";

type ContentWriteScope = {
  lessonId: string;
  learningPathId: string;
  offeringId: string;
  collegeId: string;
  organizationId: string;
  deliveryId: string | null;
};

/**
 * Content may have been authorized before an ancestor transition. Serialize
 * with lesson archive, offering/course reparent, cohort/program rescope and
 * optional delivery end; reject stale parent identities before any write.
 */
async function lockLiveContentWriteParents(
  tx: Pick<ReturnType<typeof getDb>, "select">,
  path: Awaited<ReturnType<typeof loadLearningPathScope>>,
  scope: ContentWriteScope,
) {
  if (path.id !== scope.learningPathId ||
      path.offeringId !== scope.offeringId ||
      path.collegeId !== scope.collegeId ||
      path.organizationId !== scope.organizationId) {
    throw new CoursesServiceError("LESSON_CONTENT_NOT_FOUND");
  }

  await lockLiveLessonWriteAncestry(tx, path);

  const [lesson] = await tx.select({ id: courseLessons.id })
    .from(courseLessons)
    .where(and(
      eq(courseLessons.id, scope.lessonId),
      eq(courseLessons.learningPathId, scope.learningPathId),
      eq(courseLessons.status, "ACTIVE"),
    ))
    .for("share")
    .limit(1);
  if (!lesson) {
    throw new CoursesServiceError("LESSON_NOT_FOUND");
  }

  if (scope.deliveryId) {
    const [delivery] = await tx.select({
      id: courseSectionDeliveries.id,
      offeringId: courseSectionDeliveries.offeringId,
    })
      .from(courseSectionDeliveries)
      .where(and(
        eq(courseSectionDeliveries.id, scope.deliveryId),
        isNull(courseSectionDeliveries.endedAt),
      ))
      .for("share")
      .limit(1);
    if (!delivery || delivery.offeringId !== scope.offeringId) {
      throw new CoursesServiceError("CONTENT_DELIVERY_MISMATCH");
    }
  }
}

function normalizedContentValues(
  input: CreateLessonContentInput,
  createdByUserId: string,
) {
  const base = {
    lessonId: input.lessonId,
    deliveryId: input.deliveryId ?? null,
    contentType: input.contentType,
    title: input.title,
    points: input.points,
    notes: input.notes ?? null,
    externalUrl: null as string | null,
    storageKey: null as string | null,
    durationSeconds: null as number | null,
    startsAt: null as Date | null,
    endsAt: null as Date | null,
    sequence: input.sequence,
    createdByUserId,
  };

  switch (input.contentType) {
    case "RESOURCE":
      return {
        ...base,
        externalUrl:
          input.externalUrl ?? null,
        storageKey: input.storageKey ?? null,
      };
    case "VIDEO":
      return {
        ...base,
        storageKey: input.storageKey,
        durationSeconds:
          input.durationSeconds,
      };
    case "YOUTUBE":
      return {
        ...base,
        externalUrl: input.externalUrl,
        durationSeconds:
          input.durationSeconds,
      };
    case "LIVE_CLASS":
      return {
        ...base,
        externalUrl: input.externalUrl,
        startsAt: new Date(input.startsAt),
        endsAt: new Date(input.endsAt),
      };
  }
}

function rejectUnsupportedUpdate(
  condition: boolean,
) {
  if (condition) {
    throw new CoursesServiceError(
      "CONTENT_TYPE_SHAPE_INVALID",
    );
  }
}

function mergedContentInput(
  current: Awaited<
    ReturnType<typeof loadLessonContentScope>
  >,
  input: UpdateLessonContentInput,
): CreateLessonContentInput {
  const common = {
    lessonId: current.lessonId,
    deliveryId: current.deliveryId,
    title: input.title ?? current.title,
    points: input.points ?? current.points,
    sequence:
      input.sequence ?? current.sequence,
    notes:
      input.notes === undefined
        ? current.notes
        : input.notes,
  };

  switch (current.contentType) {
    case "RESOURCE":
      rejectUnsupportedUpdate(
        input.startsAt !== undefined ||
          input.endsAt !== undefined ||
          input.durationSeconds !== undefined,
      );
      return createLessonContentInputSchema.parse({
        ...common,
        contentType: "RESOURCE",
        externalUrl:
          input.externalUrl === undefined
            ? current.externalUrl
            : input.externalUrl,
        storageKey:
          input.storageKey === undefined
            ? current.storageKey
            : input.storageKey,
      });

    case "VIDEO":
      rejectUnsupportedUpdate(
        input.externalUrl !== undefined ||
          input.startsAt !== undefined ||
          input.endsAt !== undefined,
      );
      return createLessonContentInputSchema.parse({
        ...common,
        contentType: "VIDEO",
        storageKey:
          input.storageKey === undefined
            ? current.storageKey
            : input.storageKey,
        durationSeconds:
          input.durationSeconds === undefined
            ? current.durationSeconds
            : input.durationSeconds,
      });

    case "YOUTUBE":
      rejectUnsupportedUpdate(
        input.storageKey !== undefined ||
          input.startsAt !== undefined ||
          input.endsAt !== undefined,
      );
      return createLessonContentInputSchema.parse({
        ...common,
        contentType: "YOUTUBE",
        externalUrl:
          input.externalUrl === undefined
            ? current.externalUrl
            : input.externalUrl,
        durationSeconds:
          input.durationSeconds === undefined
            ? current.durationSeconds
            : input.durationSeconds,
      });

    case "LIVE_CLASS":
      rejectUnsupportedUpdate(
        input.storageKey !== undefined ||
          input.durationSeconds !== undefined,
      );
      return createLessonContentInputSchema.parse({
        ...common,
        contentType: "LIVE_CLASS",
        externalUrl:
          input.externalUrl === undefined
            ? current.externalUrl
            : input.externalUrl,
        startsAt:
          input.startsAt === undefined
            ? current.startsAt?.toISOString()
            : input.startsAt,
        endsAt:
          input.endsAt === undefined
            ? current.endsAt?.toISOString()
            : input.endsAt,
      });
  }
}

async function authorizeContentMutation(
  context: RequestContext,
  content: Awaited<
    ReturnType<typeof loadLessonContentScope>
  >,
) {
  if (content.deliveryId) {
    await requireDeliveryContentMutation(
      context,
      content.deliveryId,
    );
    return;
  }

  requirePermission(context, "courses.manage", {
    organizationId: content.organizationId,
    collegeId: content.collegeId,
  });
}

export async function listLessonContents(
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
  const lesson =
    await loadCourseLessonScope(
      lessonId,
      includeArchived,
    );
  const access =
    await requireLearningReadAccess(
      context,
      lesson.offeringId,
      deliveryId,
      { includeHistorical: includeArchived },
    );

  // COL-course-tabs-13: hidden lessons are unavailable even by a saved deep link.
  if (access === "LEARNER" && !lesson.visibleToStudents) {
    throw new CoursesServiceError("LESSON_NOT_FOUND");
  }

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

  const audienceCondition = deliveryId
    ? or(
        isNull(lessonContents.deliveryId),
        eq(
          lessonContents.deliveryId,
          deliveryId,
        ),
      )
    : isNull(lessonContents.deliveryId);

  const conditions = [
    eq(lessonContents.lessonId, lessonId),
    audienceCondition,
  ];

  if (access === "LEARNER") {
    conditions.push(
      eq(
        lessonContents.status,
        "PUBLISHED",
      ),
    );
  } else if (!includeArchived) {
    conditions.push(
      ne(
        lessonContents.status,
        "ARCHIVED",
      ),
    );
  }

  const rows = await getDb()
    .select()
    .from(lessonContents)
    .where(and(...conditions))
    .orderBy(
      asc(lessonContents.sequence),
      asc(lessonContents.createdAt),
      asc(lessonContents.id),
    );

  // Until the DB05 ordering migration is certified, reading ordinary lesson
  // content must not eagerly load its server-only, staged-schema writer.
  // This also keeps disposable browser fixture setup on the registered path.
  // Until the optional migration exists, all previously published rows retain
  // their legacy default. Once registered, the admin visibility flag is real.
  const visibleRows = access === "LEARNER"
    ? await (await import("./faculty-lesson-visibility-staged")).filterStagedStudentVisibleLessonContents(lessonId, rows)
    : rows;
  if (!deliveryId || visibleRows.length <= 1 || !lessonContentOrderRuntimeEnabled()) {
    return visibleRows;
  }

  const { applyDeliveryContentOrderIfReady } =
    await import("./lesson-content-order-service");
  return applyDeliveryContentOrderIfReady(visibleRows, deliveryId);
}

export async function createLessonContent(
  context: RequestContext,
  rawInput: CreateLessonContentInput,
) {
  const input =
    createLessonContentInputSchema.parse(
      rawInput,
    );
  const lesson =
    await loadCourseLessonScope(
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
        "CONTENT_DELIVERY_MISMATCH",
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

  const path = await loadLearningPathScope(lesson.learningPathId);
  return getDb().transaction(async (tx) => {
    await lockLiveContentWriteParents(tx, path, {
      lessonId: input.lessonId,
      learningPathId: lesson.learningPathId,
      offeringId: lesson.offeringId,
      collegeId: lesson.collegeId,
      organizationId: lesson.organizationId,
      deliveryId: input.deliveryId ?? null,
    });

    const [created] = await tx
      .insert(lessonContents)
      .values(
        normalizedContentValues(
          input,
          context.user.id,
        ),
      )
      .returning();

    return created;
  });
}

export async function updateLessonContent(
  context: RequestContext,
  contentIdInput: string,
  rawInput: UpdateLessonContentInput,
) {
  const contentId =
    lessonContentIdSchema.parse(
      contentIdInput,
    );
  const input =
    updateLessonContentInputSchema.parse(
      rawInput,
    );
  const current =
    await loadLessonContentScope(contentId);

  await authorizeContentMutation(
    context,
    current,
  );

  const parsed = mergedContentInput(
    current,
    input,
  );
  const normalized =
    normalizedContentValues(
      parsed,
      current.createdByUserId,
    );

  const path = await loadLearningPathScope(current.learningPathId);
  return getDb().transaction(async (tx) => {
    await lockLiveContentWriteParents(tx, path, current);
    const [updated] = await tx
    .update(lessonContents)
    .set({
      title: normalized.title,
      points: normalized.points,
      notes: normalized.notes,
      externalUrl: normalized.externalUrl,
      storageKey: normalized.storageKey,
      durationSeconds:
        normalized.durationSeconds,
      startsAt: normalized.startsAt,
      endsAt: normalized.endsAt,
      sequence: normalized.sequence,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(lessonContents.id, contentId),
        eq(lessonContents.lessonId, current.lessonId),
        current.deliveryId
          ? eq(lessonContents.deliveryId, current.deliveryId)
          : isNull(lessonContents.deliveryId),
        eq(lessonContents.contentType, current.contentType),
        ne(
          lessonContents.status,
          "ARCHIVED",
        ),
      ),
    )
    .returning();

  if (!updated) {
    throw new CoursesServiceError(
      "LESSON_CONTENT_NOT_FOUND",
    );
  }

    return updated;
  });
}

export async function transitionLessonContent(
  context: RequestContext,
  contentIdInput: string,
  rawInput: unknown,
) {
  const contentId =
    lessonContentIdSchema.parse(
      contentIdInput,
    );
  const input =
    lessonContentTransitionSchema.parse(
      rawInput,
    );
  const current =
    await loadLessonContentScope(contentId);

  await authorizeContentMutation(
    context,
    current,
  );

  if (
    input.action === "PUBLISH" &&
    current.status !== "DRAFT"
  ) {
    throw new CoursesServiceError(
      "INVALID_LESSON_CONTENT_TRANSITION",
    );
  }

  const nextStatus =
    input.action === "PUBLISH"
      ? "PUBLISHED"
      : "ARCHIVED";

  const path = await loadLearningPathScope(current.learningPathId);
  return getDb().transaction(async (tx) => {
    await lockLiveContentWriteParents(tx, path, current);
    const [updated] = await tx
    .update(lessonContents)
    .set({
      status: nextStatus,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(lessonContents.id, contentId),
        // The actor was authorized for this exact lesson, content kind,
        // and optional class delivery. A reparent/type change between the
        // pre-read and transition must never inherit a stale permission.
        eq(lessonContents.lessonId, current.lessonId),
        current.deliveryId
          ? eq(lessonContents.deliveryId, current.deliveryId)
          : isNull(lessonContents.deliveryId),
        eq(lessonContents.contentType, current.contentType),
        input.action === "PUBLISH"
          ? eq(lessonContents.status, "DRAFT")
          : ne(lessonContents.status, "ARCHIVED"),
      ),
    )
    .returning();

  if (!updated) {
    throw new CoursesServiceError(
      "LESSON_CONTENT_NOT_FOUND",
    );
  }

    return updated;
  });
}
