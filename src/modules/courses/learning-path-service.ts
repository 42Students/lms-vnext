import {
  and,
  asc,
  eq,
  ne,
} from "drizzle-orm";
import { getDb } from "@/db/client";
import { recordActivityEventInTransaction } from "@/modules/activity/service";
import { ACTIVITY_EVENT_TYPES } from "@/modules/activity/taxonomy";
import {
  courseLearningPaths,
  courseOfferings,
  courses,
  departments,
  colleges,
  organizations,
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
      { includeHistorical: includeArchived },
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
    return await getDb().transaction(async (tx) => {
      // A stale offering scope read must not allow a new path after archive.
      // Offering archive holds FOR UPDATE; SHARE rechecks status in this tx.
      const [activeOffering] = await tx
        .select({
          id: courseOfferings.id,
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
          eq(courseOfferings.id, input.offeringId),
          eq(courseOfferings.status, "ACTIVE"),
          eq(courses.status, "ACTIVE"),
          eq(colleges.status, "ACTIVE"),
          eq(organizations.status, "ACTIVE"),
        ))
        .for("share")
        .limit(1);

      if (!activeOffering ||
          activeOffering.courseId !== offering.courseId ||
          activeOffering.cohortId !== offering.cohortId ||
          activeOffering.academicPeriodId !== offering.academicPeriodId ||
          activeOffering.collegeId !== offering.collegeId ||
          activeOffering.organizationId !== offering.organizationId) {
        // Authorization was granted for the previously loaded offering.
        // A concurrent tenant/scope move must not reuse that stale grant.
        throw new CoursesServiceError("OFFERING_NOT_FOUND");
      }

      const [created] = await tx
        .insert(courseLearningPaths)
        .values({
          offeringId: input.offeringId,
          title: input.title,
          description:
            input.description ?? null,
        })
        .returning();

      return created;
    });
  } catch (error) {
    if (error instanceof CoursesServiceError) throw error;
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

  return getDb().transaction(async (tx) => {
    const [lockedPath] = await tx
      .select({ id: courseLearningPaths.id })
      .from(courseLearningPaths)
      .where(and(
        eq(courseLearningPaths.id, learningPathId),
        eq(courseLearningPaths.offeringId, current.offeringId),
        ne(courseLearningPaths.status, "ARCHIVED"),
      ))
      .for("update")
      .limit(1);

    if (!lockedPath) {
      throw new CoursesServiceError("LEARNING_PATH_NOT_FOUND");
    }

    // Re-evaluate the offering's tenant and course linkage while locked.
    // An earlier auth check cannot authorize a concurrent scope change.
    const [lockedOffering] = await tx
      .select({
        id: courseOfferings.id,
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
        eq(courseOfferings.id, current.offeringId),
        eq(courseOfferings.status, "ACTIVE"),
        eq(courses.status, "ACTIVE"),
        eq(colleges.status, "ACTIVE"),
        eq(organizations.status, "ACTIVE"),
      ))
      .for("share")
      .limit(1);

    if (!lockedOffering ||
        lockedOffering.courseId !== current.courseId ||
        lockedOffering.cohortId !== current.cohortId ||
        lockedOffering.academicPeriodId !== current.academicPeriodId ||
        lockedOffering.collegeId !== current.collegeId ||
        lockedOffering.organizationId !== current.organizationId) {
      throw new CoursesServiceError("LEARNING_PATH_NOT_FOUND");
    }

    const [updated] = await tx
      .update(courseLearningPaths)
      .set({
        ...input,
        updatedAt: new Date(),
      })
      .where(and(
        eq(courseLearningPaths.id, learningPathId),
        eq(courseLearningPaths.offeringId, current.offeringId),
        ne(courseLearningPaths.status, "ARCHIVED"),
      ))
      .returning();

    if (!updated) {
      throw new CoursesServiceError("LEARNING_PATH_NOT_FOUND");
    }
    return updated;
  });
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

  const db = getDb();
  return db.transaction(async (tx) => {
    const [lockedPath] = await tx
      .select({ id: courseLearningPaths.id })
      .from(courseLearningPaths)
      .where(and(
        eq(courseLearningPaths.id, learningPathId),
        eq(courseLearningPaths.offeringId, current.offeringId),
        input.action === "PUBLISH"
          ? eq(courseLearningPaths.status, "DRAFT")
          : ne(courseLearningPaths.status, "ARCHIVED"),
      ))
      .for("update")
      .limit(1);

    if (!lockedPath) {
      throw new CoursesServiceError("INVALID_LEARNING_PATH_TRANSITION");
    }

    // Re-evaluate the offering's tenant and course linkage while locked.
    // An earlier auth check cannot authorize a concurrent scope change.
    const [lockedOffering] = await tx
      .select({
        id: courseOfferings.id,
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
        eq(courseOfferings.id, current.offeringId),
        eq(courseOfferings.status, "ACTIVE"),
        eq(courses.status, "ACTIVE"),
        eq(colleges.status, "ACTIVE"),
        eq(organizations.status, "ACTIVE"),
      ))
      .for("share")
      .limit(1);

    if (!lockedOffering ||
        lockedOffering.courseId !== current.courseId ||
        lockedOffering.cohortId !== current.cohortId ||
        lockedOffering.academicPeriodId !== current.academicPeriodId ||
        lockedOffering.collegeId !== current.collegeId ||
        lockedOffering.organizationId !== current.organizationId) {
      throw new CoursesServiceError("LEARNING_PATH_NOT_FOUND");
    }

    const [updated] = await tx
      .update(courseLearningPaths)
      .set({
        status: nextStatus,
        updatedAt: new Date(),
      })
      .where(and(
        eq(courseLearningPaths.id, learningPathId),
        eq(courseLearningPaths.offeringId, current.offeringId),
        input.action === "PUBLISH"
          ? eq(courseLearningPaths.status, "DRAFT")
          : ne(courseLearningPaths.status, "ARCHIVED"),
      ))
      .returning();

    if (!updated) {
      throw new CoursesServiceError(
        "INVALID_LEARNING_PATH_TRANSITION",
      );
    }

    if (input.action === "PUBLISH") {
      await recordActivityEventInTransaction(
        tx,
        context,
        {
          eventType:
            ACTIVITY_EVENT_TYPES.COURSES_LEARNING_PATH_PUBLISHED,
          collegeId: current.collegeId,
          organizationId:
            current.organizationId,
          subjectType:
            "course_learning_path",
          subjectId: updated.id,
          subjectLabel: updated.title,
          summary:
            `Learning path ${updated.title} published`,
          metadata: {
            offeringId:
              updated.offeringId,
            courseId: current.courseId,
          },
          groupKey:
            `course-offering:${updated.offeringId}:publishing`,
          dedupeKey:
            `course-learning-path:${updated.id}:published`,
        },
      );
    }

    return updated;
  });
}
