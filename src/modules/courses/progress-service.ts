import {
  and,
  eq,
  sql,
} from "drizzle-orm";
import { getDb } from "@/db/client";
import {
  learnerContentProgress,
} from "@/db/schema";
import type { RequestContext } from "@/modules/identity/context";
import {
  CoursesServiceError,
  postgresConstraintName,
} from "./errors";
import {
  requireLearningReadAccess,
} from "./learning-access";
import {
  loadLessonContentScope,
} from "./scope";
import {
  lessonContentIdSchema,
  saveLearnerContentProgressInputSchema,
  type SaveLearnerContentProgressInput,
} from "./validation";

const TIMED_TYPES = new Set([
  "VIDEO",
  "YOUTUBE",
]);

type ProgressContent = Awaited<
  ReturnType<typeof loadLessonContentScope>
>;

type ProgressRow = {
  lastPositionSeconds: number;
  completedAt: Date | null;
} | null;

export type LearnerProgressView = {
  contentId: string;
  status:
    | "NOT_STARTED"
    | "IN_PROGRESS"
    | "COMPLETED";
  lastPositionSeconds: number;
  durationSeconds: number;
  percentComplete: number;
  completedAt: Date | null;
};

export function buildLearnerProgressView(
  content: Pick<
    ProgressContent,
    "id" | "durationSeconds"
  >,
  progress: ProgressRow,
): LearnerProgressView {
  const durationSeconds =
    content.durationSeconds ?? 0;
  const lastPositionSeconds =
    durationSeconds > 0
      ? Math.min(
          progress?.lastPositionSeconds ?? 0,
          durationSeconds,
        )
      : 0;
  const completedAt =
    progress?.completedAt ?? null;
  const percentComplete = completedAt
    ? 100
    : durationSeconds > 0
      ? Math.min(
          100,
          Math.round(
            (lastPositionSeconds * 100) /
              durationSeconds,
          ),
        )
      : 0;

  return {
    contentId: content.id,
    status: completedAt
      ? "COMPLETED"
      : lastPositionSeconds > 0
        ? "IN_PROGRESS"
        : "NOT_STARTED",
    lastPositionSeconds,
    durationSeconds,
    percentComplete,
    completedAt,
  };
}

async function requireLearnerProgressScope(
  context: RequestContext,
  contentId: string,
  deliveryId: string,
) {
  const content =
    await loadLessonContentScope(contentId);

  if (content.status !== "PUBLISHED") {
    throw new CoursesServiceError(
      "LESSON_CONTENT_NOT_PUBLISHED",
    );
  }

  if (
    content.learningPathStatus !==
    "PUBLISHED"
  ) {
    throw new CoursesServiceError(
      "LEARNING_PATH_NOT_PUBLISHED",
    );
  }

  const access =
    await requireLearningReadAccess(
      context,
      content.offeringId,
      deliveryId,
    );

  if (
    access !== "LEARNER" ||
    !context.membership
  ) {
    throw new CoursesServiceError(
      "LEARNER_PROGRESS_ACCESS_DENIED",
    );
  }

  if (
    content.deliveryId &&
    content.deliveryId !== deliveryId
  ) {
    throw new CoursesServiceError(
      "CONTENT_DELIVERY_MISMATCH",
    );
  }

  return {
    content,
    membershipId: context.membership.id,
  };
}

async function loadProgressRow(
  membershipId: string,
  contentId: string,
) {
  const [row] = await getDb()
    .select({
      lastPositionSeconds:
        learnerContentProgress.lastPositionSeconds,
      completedAt:
        learnerContentProgress.completedAt,
    })
    .from(learnerContentProgress)
    .where(
      and(
        eq(
          learnerContentProgress.membershipId,
          membershipId,
        ),
        eq(
          learnerContentProgress.lessonContentId,
          contentId,
        ),
      ),
    )
    .limit(1);

  return row ?? null;
}

export async function getLearnerContentProgress(
  context: RequestContext,
  contentIdInput: string,
  deliveryIdInput: string,
) {
  const contentId =
    lessonContentIdSchema.parse(
      contentIdInput,
    );
  const { content, membershipId } =
    await requireLearnerProgressScope(
      context,
      contentId,
      deliveryIdInput,
    );
  const row = await loadProgressRow(
    membershipId,
    contentId,
  );

  return buildLearnerProgressView(
    content,
    row,
  );
}

async function atomicProgressUpdate(
  membershipId: string,
  contentId: string,
  positionSeconds: number,
  shouldComplete: boolean,
) {
  const db = getDb();
  const now = new Date();
  const updateValues = {
    lastPositionSeconds: sql<number>`
      greatest(
        ${learnerContentProgress.lastPositionSeconds},
        ${positionSeconds}
      )
    `,
    updatedAt: now,
    ...(shouldComplete
      ? {
          completedAt: sql<Date>`
            coalesce(
              ${learnerContentProgress.completedAt},
              ${now}
            )
          `,
        }
      : {}),
  };

  const [updated] = await db
    .update(learnerContentProgress)
    .set(updateValues)
    .where(
      and(
        eq(
          learnerContentProgress.membershipId,
          membershipId,
        ),
        eq(
          learnerContentProgress.lessonContentId,
          contentId,
        ),
      ),
    )
    .returning();

  return updated ?? null;
}

export async function saveLearnerContentProgress(
  context: RequestContext,
  contentIdInput: string,
  rawInput: SaveLearnerContentProgressInput,
) {
  const contentId =
    lessonContentIdSchema.parse(
      contentIdInput,
    );
  const input =
    saveLearnerContentProgressInputSchema.parse(
      rawInput,
    );
  const { content, membershipId } =
    await requireLearnerProgressScope(
      context,
      contentId,
      input.deliveryId,
    );

  const isTimed = TIMED_TYPES.has(
    content.contentType,
  );
  let positionSeconds = 0;
  let shouldComplete = false;

  if (isTimed) {
    if (input.completed !== undefined) {
      throw new CoursesServiceError(
        "TIMED_CONTENT_MANUAL_COMPLETION_NOT_ALLOWED",
      );
    }

    if (
      !content.durationSeconds ||
      content.durationSeconds <= 0
    ) {
      throw new CoursesServiceError(
        "CONTENT_DURATION_REQUIRED",
      );
    }

    if (input.positionSeconds === undefined) {
      throw new CoursesServiceError(
        "CONTENT_TYPE_SHAPE_INVALID",
      );
    }

    positionSeconds = Math.min(
      input.positionSeconds,
      content.durationSeconds,
    );
    shouldComplete =
      positionSeconds * 100 >=
      content.durationSeconds * 90;
  } else {
    if (
      input.positionSeconds !== undefined &&
      input.positionSeconds !== 0
    ) {
      throw new CoursesServiceError(
        "CONTENT_TYPE_SHAPE_INVALID",
      );
    }

    if (input.completed !== true) {
      throw new CoursesServiceError(
        "CONTENT_TYPE_SHAPE_INVALID",
      );
    }

    if (
      content.contentType === "LIVE_CLASS" &&
      content.endsAt &&
      content.endsAt.getTime() >
        Date.now()
    ) {
      throw new CoursesServiceError(
        "LIVE_CLASS_NOT_FINISHED",
      );
    }

    shouldComplete = true;
  }

  const existing = await loadProgressRow(
    membershipId,
    contentId,
  );

  if (!existing) {
    try {
      const [inserted] = await getDb()
        .insert(learnerContentProgress)
        .values({
          membershipId,
          lessonContentId: contentId,
          lastPositionSeconds:
            positionSeconds,
          completedAt: shouldComplete
            ? new Date()
            : null,
        })
        .returning();

      return buildLearnerProgressView(
        content,
        inserted,
      );
    } catch (error) {
      if (
        postgresConstraintName(error) !==
        "learner_content_progress_membership_content_uq"
      ) {
        throw error;
      }
    }
  }

  const updated = await atomicProgressUpdate(
    membershipId,
    contentId,
    positionSeconds,
    shouldComplete,
  );

  if (!updated) {
    throw new CoursesServiceError(
      "LEARNER_PROGRESS_ACCESS_DENIED",
    );
  }

  return buildLearnerProgressView(
    content,
    updated,
  );
}
