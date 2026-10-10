import "server-only";

import { and, eq, sql } from "drizzle-orm";
import { getDb } from "@/db/client";
import { courseDisplayContents } from "@/db/schema/course-display-staged";
import type { RequestContext } from "@/modules/identity/context";
import { requirePermission } from "@/modules/permissions/policy";
import { CoursesServiceError } from "./errors";
import { loadCourseScope } from "./scope";
import { courseIdSchema } from "./validation";
import {
  sanitizeCourseDisplayHtml,
  updateCourseDisplayContentSchema,
  type UpdateCourseDisplayContentInput,
} from "./course-display-validation";
import { courseDisplayRuntimeEnabled } from "./course-display-readiness";

export type CourseDisplayContentView = {
  courseId: string;
  introductionText: string | null;
  bodyHtml: string | null;
  takeaways: string[];
  thumbnailUrl: string | null;
  version: number;
  createdAt: Date;
  updatedAt: Date;
};

function toView(
  row: typeof courseDisplayContents.$inferSelect,
): CourseDisplayContentView {
  return {
    courseId: row.courseId,
    introductionText: row.introductionText,
    bodyHtml: sanitizeCourseDisplayHtml(row.bodyHtml),
    takeaways: row.takeaways,
    thumbnailUrl: row.thumbnailUrl,
    version: row.version,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

/**
 * Internal read helper for already-authorized Course consumers.
 * It returns null while the staged DB05 migration is not verified, so Learner
 * and Faculty pages keep using their existing safe fallbacks.
 */
export async function loadCourseDisplayContentIfReady(
  courseIdInput: string,
) {
  const courseId = courseIdSchema.parse(
    courseIdInput,
  );
  if (!courseDisplayRuntimeEnabled()) {
    return null;
  }
  const [row] = await getDb()
    .select()
    .from(courseDisplayContents)
    .where(
      eq(
        courseDisplayContents.courseId,
        courseId,
      ),
    )
    .limit(1);
  return row ? toView(row) : null;
}

export async function getAdminCourseDisplayContent(
  context: RequestContext,
  courseIdInput: string,
) {
  const courseId = courseIdSchema.parse(
    courseIdInput,
  );
  const scope = await loadCourseScope(
    courseId,
    true,
  );
  requirePermission(context, "courses.read", {
    organizationId: scope.organizationId,
    collegeId: scope.collegeId,
  });
  return loadCourseDisplayContentIfReady(
    courseId,
  );
}

export async function updateCourseDisplayContent(
  context: RequestContext,
  courseIdInput: string,
  rawInput: UpdateCourseDisplayContentInput,
) {
  if (!courseDisplayRuntimeEnabled()) {
    throw new Error(
      "DB05_COURSE_DISPLAY_MIGRATIONS_PENDING",
    );
  }
  const courseId = courseIdSchema.parse(
    courseIdInput,
  );
  const input =
    updateCourseDisplayContentSchema.parse(
      rawInput,
    );
  const scope = await loadCourseScope(
    courseId,
    true,
  );
  requirePermission(context, "courses.manage", {
    organizationId: scope.organizationId,
    collegeId: scope.collegeId,
  });

  const normalized = {
    introductionText:
      input.introductionText || null,
    bodyHtml: sanitizeCourseDisplayHtml(
      input.bodyHtml,
    ),
    takeaways: input.takeaways,
    thumbnailUrl:
      input.thumbnailUrl || null,
  };

  return getDb().transaction(async (tx) => {
    await tx.execute(
      sql`select id from courses where id = ${courseId} for update`,
    );
    const [current] = await tx
      .select()
      .from(courseDisplayContents)
      .where(
        eq(
          courseDisplayContents.courseId,
          courseId,
        ),
      )
      .for("update")
      .limit(1);

    if (current) {
      if (
        input.expectedVersion !==
        current.version
      ) {
        throw new CoursesServiceError(
          "COURSE_DISPLAY_CONFLICT",
        );
      }
      const [updated] = await tx
        .update(courseDisplayContents)
        .set({
          ...normalized,
          version:
            current.version + 1,
          updatedByUserId:
            context.user.id,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(
              courseDisplayContents.courseId,
              courseId,
            ),
            eq(
              courseDisplayContents.version,
              current.version,
            ),
          ),
        )
        .returning();
      if (!updated) {
        throw new CoursesServiceError(
          "COURSE_DISPLAY_CONFLICT",
        );
      }
      return toView(updated);
    }

    if (input.expectedVersion !== null) {
      throw new CoursesServiceError(
        "COURSE_DISPLAY_CONFLICT",
      );
    }

    const [created] = await tx
      .insert(courseDisplayContents)
      .values({
        courseId,
        ...normalized,
        updatedByUserId:
          context.user.id,
      })
      .returning();
    return toView(created!);
  });
}
