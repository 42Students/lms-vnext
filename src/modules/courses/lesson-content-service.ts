import {
  and,
  asc,
  eq,
  isNull,
  ne,
  or,
} from "drizzle-orm";
import { getDb } from "@/db/client";
import { lessonContents } from "@/db/schema";
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

function normalizedContentValues(
  input: CreateLessonContentInput,
  createdByUserId: string,
) {
  const base = {
    lessonId: input.lessonId,
    deliveryId: input.deliveryId ?? null,
    contentType: input.contentType,
    title: input.title,
    notes: input.notes ?? null,
    externalUrl: null as string | null,
    storageKey: null as string | null,
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
      };
    case "YOUTUBE":
      return {
        ...base,
        externalUrl: input.externalUrl,
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
          input.endsAt !== undefined,
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
      });

    case "LIVE_CLASS":
      rejectUnsupportedUpdate(
        input.storageKey !== undefined,
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

  return getDb()
    .select()
    .from(lessonContents)
    .where(and(...conditions))
    .orderBy(
      asc(lessonContents.sequence),
      asc(lessonContents.createdAt),
      asc(lessonContents.id),
    );
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

  const [created] = await getDb()
    .insert(lessonContents)
    .values(
      normalizedContentValues(
        input,
        context.user.id,
      ),
    )
    .returning();

  return created;
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

  const [updated] = await getDb()
    .update(lessonContents)
    .set({
      title: normalized.title,
      notes: normalized.notes,
      externalUrl: normalized.externalUrl,
      storageKey: normalized.storageKey,
      startsAt: normalized.startsAt,
      endsAt: normalized.endsAt,
      sequence: normalized.sequence,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(lessonContents.id, contentId),
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

  const [updated] = await getDb()
    .update(lessonContents)
    .set({
      status: nextStatus,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(lessonContents.id, contentId),
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
}
