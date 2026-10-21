import "server-only";

import {
  and,
  asc,
  eq,
  inArray,
  isNull,
  ne,
  or,
  sql,
} from "drizzle-orm";
import { getDb } from "@/db/client";
import {
  courseSectionDeliveries,
  lessonContents,
} from "@/db/schema";
import {
  lessonContentDeliverySequences,
} from "@/db/schema/lesson-content-order-staged";
import type {
  RequestContext,
} from "@/modules/identity/context";
import {
  requireDeliveryContentMutation,
} from "./learning-access";
import {
  CoursesServiceError,
} from "./errors";
import {
  loadCourseLessonScope,
  loadCourseSectionDeliveryScope,
} from "./scope";
import {
  deliveryContentOrderInputSchema,
  type DeliveryContentOrderInput,
} from "./lesson-content-order-validation";
import {
  lessonContentOrderRuntimeEnabled,
} from "./lesson-content-order-readiness";

/** Legacy lesson_content_class_sequence(content_id,class_id) resolves to
 * (lessonContentId,deliveryId) only after the historical class ID is mapped
 * through the verified college, offering and section identity crosswalk.
 * A group-backed elective class is not itself a courseSectionDelivery.
 * Current full-order runtime gate remains fail-closed until staged relation
 * and cross-scope FK migration have been replayed and verified.
 */
export async function applyDeliveryContentOrderIfReady<
  T extends {
    id: string;
    sequence: number;
    createdAt?: Date;
  },
>(
  rows: readonly T[],
  deliveryId: string | null,
) {
  if (
    !deliveryId ||
    !lessonContentOrderRuntimeEnabled() ||
    rows.length <= 1
  ) {
    return [...rows];
  }

  const overrides = await getDb()
    .select({
      lessonContentId:
        lessonContentDeliverySequences.lessonContentId,
      sequence:
        lessonContentDeliverySequences.sequence,
    })
    .from(lessonContentDeliverySequences)
    .where(
      and(
        eq(
          lessonContentDeliverySequences.deliveryId,
          deliveryId,
        ),
        inArray(
          lessonContentDeliverySequences.lessonContentId,
          rows.map((row) => row.id),
        ),
      ),
    );

  // A valid write always stores a full order. If a raw-SQL/manual partial set
  // exists, ignore it rather than mixing two sequence spaces.
  if (overrides.length !== rows.length) {
    return [...rows];
  }

  const byId = new Map(
    overrides.map((row) => [
      row.lessonContentId,
      row.sequence,
    ]),
  );

  return [...rows].sort(
    (left, right) =>
      (byId.get(left.id) ?? left.sequence) -
        (byId.get(right.id) ?? right.sequence) ||
      (left.createdAt?.getTime() ?? 0) -
        (right.createdAt?.getTime() ?? 0) ||
      left.id.localeCompare(right.id),
  );
}

export async function updateDeliveryLessonContentOrder(
  context: RequestContext,
  rawInput: DeliveryContentOrderInput,
) {
  if (!lessonContentOrderRuntimeEnabled()) {
    throw new Error(
      "DB05_CONTENT_ORDER_MIGRATIONS_PENDING",
    );
  }

  const input =
    deliveryContentOrderInputSchema.parse(
      rawInput,
    );
  const [lesson, delivery] =
    await Promise.all([
      loadCourseLessonScope(
        input.lessonId,
      ),
      loadCourseSectionDeliveryScope(
        input.deliveryId,
      ),
    ]);

  if (
    lesson.offeringId !==
    delivery.offeringId
  ) {
    throw new CoursesServiceError(
      "CONTENT_DELIVERY_MISMATCH",
    );
  }

  await requireDeliveryContentMutation(
    context,
    input.deliveryId,
  );

  return getDb().transaction(async (tx) => {
    await tx.execute(
      sql`select id from ${courseSectionDeliveries}
          where id = ${input.deliveryId} for update`,
    );

    const visible = await tx
      .select({
        id: lessonContents.id,
        sequence: lessonContents.sequence,
      })
      .from(lessonContents)
      .where(
        and(
          eq(
            lessonContents.lessonId,
            input.lessonId,
          ),
          ne(
            lessonContents.status,
            "ARCHIVED",
          ),
          or(
            isNull(
              lessonContents.deliveryId,
            ),
            eq(
              lessonContents.deliveryId,
              input.deliveryId,
            ),
          ),
        ),
      )
      .orderBy(
        asc(lessonContents.sequence),
        asc(lessonContents.createdAt),
        asc(lessonContents.id),
      );

    const expected = new Set(
      visible.map((row) => row.id),
    );
    const provided = new Set(
      input.orderedContentIds,
    );
    const exact =
      expected.size === provided.size &&
      [...expected].every((id) =>
        provided.has(id),
      );

    if (!exact) {
      throw new CoursesServiceError(
        "CONTENT_ORDER_CONFLICT",
      );
    }

    // Clear every historical override for this Lesson/Delivery, including
    // archived rows, before writing the current complete visible order.
    const allLessonContent = await tx
      .select({ id: lessonContents.id })
      .from(lessonContents)
      .where(
        eq(
          lessonContents.lessonId,
          input.lessonId,
        ),
      );
    if (allLessonContent.length > 0) {
      await tx
        .delete(
          lessonContentDeliverySequences,
        )
        .where(
          and(
            eq(
              lessonContentDeliverySequences.deliveryId,
              input.deliveryId,
            ),
            inArray(
              lessonContentDeliverySequences.lessonContentId,
              allLessonContent.map(
                (row) => row.id,
              ),
            ),
          ),
        );
    }

    await tx
      .insert(
        lessonContentDeliverySequences,
      )
      .values(
        input.orderedContentIds.map(
          (lessonContentId, sequence) => ({
            lessonContentId,
            lessonId: input.lessonId,
            deliveryId:
              input.deliveryId,
            sequence,
            updatedByUserId:
              context.user.id,
          }),
        ),
      );

    return input.orderedContentIds.map(
      (lessonContentId, sequence) => ({
        lessonContentId,
        deliveryId: input.deliveryId,
        sequence,
      }),
    );
  });
}
