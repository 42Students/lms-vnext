import {
  and,
  eq,
  sql,
} from "drizzle-orm";
import { getDb } from "@/db/client";
import {
  learnerContentProgress, collegeMemberships, membershipRoles, users,
} from "@/db/schema";
import { AuthorizationError } from "@/modules/permissions/policy";
import { recordActivityEventInTransaction } from "@/modules/activity/service";
import { ACTIVITY_EVENT_TYPES } from "@/modules/activity/taxonomy";
import { requireOwnCourseLearnerRead } from "./learner-access-guard";
import { manualContentCompletionGate } from "./learner-manual-completion-model";
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

/** Persisted-position threshold required to finish timed content. */
export const TIMED_CONTENT_COMPLETION_THRESHOLD_PERCENT = 90;

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
  // Without authored duration preserve genuine saved position for resume.
  // Unknown duration must never imply a percentage or completion.
  const lastPositionSeconds = durationSeconds > 0
    ? Math.min(progress?.lastPositionSeconds ?? 0,durationSeconds)
    : Math.max(0,progress?.lastPositionSeconds ?? 0);
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

  if (!content.lessonVisibleToStudents) {
    throw new CoursesServiceError("LESSON_CONTENT_NOT_PUBLISHED");
  }
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

  if (
    content.startsAt &&
    content.startsAt.getTime() > Date.now()
  ) {
    throw new CoursesServiceError(
      "CONTENT_NOT_STARTED",
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
  await requireOwnCourseLearnerRead(context);
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
    lastPositionSeconds: positionSeconds,
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

/** Idempotent manual completion with a single, same-transaction activity event. */
async function completeManualContentOnce(
  context: RequestContext, content: ProgressContent, membershipId: string, deliveryId: string,
) {
  const now = new Date();
  const gate = manualContentCompletionGate(content.contentType, content.endsAt, now);
  if (gate !== "ALLOWED") throw new CoursesServiceError(gate);
  return getDb().transaction(async (tx) => {
    // Lock the actor while applying completion: a suspension or role removal
    // racing this transaction must not create an accepted completion.
    const [actor] = await tx.select({
      userId: collegeMemberships.userId, collegeId: collegeMemberships.collegeId,
      status: collegeMemberships.status,
    }).from(collegeMemberships)
      .where(eq(collegeMemberships.id, membershipId))
      .for("share").limit(1);
    const [account] = await tx.select({status:users.platformStatus}).from(users)
      .where(eq(users.id, context.user.id)).for("share").limit(1);
    const [role] = await tx.select({id:membershipRoles.id}).from(membershipRoles)
      .where(and(eq(membershipRoles.membershipId,membershipId),
        eq(membershipRoles.role,"LEARNER"))).for("share").limit(1);
    if(!actor || actor.userId!==context.user.id ||
      actor.collegeId!==context.membership?.collegeId || actor.status!=="ACTIVE" ||
      !account || account.status!=="ACTIVE" || !role) {
      throw new AuthorizationError("courses.read");
    }
    const lockKey = membershipId + ":" + content.id;
    await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${lockKey}), 72001)`);
    const [existing] = await tx.select().from(learnerContentProgress).where(and(
      eq(learnerContentProgress.membershipId, membershipId),
      eq(learnerContentProgress.lessonContentId, content.id),
    )).limit(1);
    if (existing?.completedAt) return buildLearnerProgressView(content, existing);
    let saved: typeof learnerContentProgress.$inferSelect | undefined;
    if (existing) {
      [saved] = await tx.update(learnerContentProgress).set({
        completedAt: now, updatedAt: now,
      }).where(and(
        eq(learnerContentProgress.id, existing.id),
        sql`${learnerContentProgress.completedAt} is null`,
      )).returning();
    } else {
      [saved] = await tx.insert(learnerContentProgress).values({
        membershipId, lessonContentId: content.id, lastPositionSeconds: 0, completedAt: now,
      }).returning();
    }
    if (!saved) throw new CoursesServiceError("LEARNER_PROGRESS_ACCESS_DENIED");
    await recordActivityEventInTransaction(tx, context, {
      eventType: ACTIVITY_EVENT_TYPES.COURSES_LEARNER_CONTENT_COMPLETED,
      collegeId: context.membership!.collegeId,
      organizationId: context.membership!.organizationId,
      subjectType: "lesson_content",
      subjectId: content.id,
      summary: "Learner completed course content",
      metadata: { deliveryId, membershipId },
      dedupeKey: "learner-content:" + membershipId + ":" + content.id + ":completed",
    });
    return buildLearnerProgressView(content, saved);
  });
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
  await requireOwnCourseLearnerRead(context);
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

    if (input.positionSeconds === undefined) {
      throw new CoursesServiceError(
        "CONTENT_TYPE_SHAPE_INVALID",
      );
    }

    const duration=content.durationSeconds??0;
    // Media metadata can be unavailable for historical videos. Record the
    // learner's position, but do not trust client claims to award completion.
    positionSeconds = duration>0
      ? Math.min(input.positionSeconds,duration):input.positionSeconds;
    shouldComplete = duration>0 && positionSeconds*100 >=
      duration*TIMED_CONTENT_COMPLETION_THRESHOLD_PERCENT;
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

    // Legacy allows a learner to mark a live session attended at any time.
    // Do not manufacture an attendance mark; this writes content progress only.
    shouldComplete = true;
    return completeManualContentOnce(context, content, membershipId, input.deliveryId);
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
