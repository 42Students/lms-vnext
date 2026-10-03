import {
  and,
  asc,
  eq,
  isNull,
} from "drizzle-orm";
import { getDb } from "@/db/client";
import {
  collegeMemberships,
  courseTeachingAssignments,
  users,
} from "@/db/schema";
import type { RequestContext } from "@/modules/identity/context";
import { requirePermission } from "@/modules/permissions/policy";
import {
  CoursesServiceError,
  postgresConstraintName,
} from "./errors";
import {
  loadCourseMembership,
  loadCourseSectionDeliveryScope,
  loadCourseTeachingAssignmentScope,
} from "./scope";
import {
  courseSectionDeliveryIdSchema,
  courseTeachingAssignmentIdSchema,
  createCourseTeachingAssignmentInputSchema,
  type CreateCourseTeachingAssignmentInput,
} from "./validation";

function mapTeachingConstraint(error: unknown) {
  switch (postgresConstraintName(error)) {
    case "course_teaching_assignments_active_uq":
      return new CoursesServiceError(
        "TEACHING_ASSIGNMENT_CONFLICT",
      );
    case "course_teaching_assignments_active_primary_uq":
      return new CoursesServiceError(
        "PRIMARY_TEACHER_CONFLICT",
      );
    default:
      return error;
  }
}

export async function listCourseTeachingAssignments(
  context: RequestContext,
  deliveryIdInput: string,
  includeEnded = false,
) {
  const deliveryId =
    courseSectionDeliveryIdSchema.parse(
      deliveryIdInput,
    );
  const delivery =
    await loadCourseSectionDeliveryScope(
      deliveryId,
      includeEnded,
    );

  requirePermission(context, "courses.read", {
    organizationId: delivery.organizationId,
    collegeId: delivery.collegeId,
  });

  const conditions = [
    eq(
      courseTeachingAssignments.deliveryId,
      deliveryId,
    ),
  ];

  if (!includeEnded) {
    conditions.push(
      isNull(courseTeachingAssignments.endedAt),
    );
  }

  return getDb()
    .select({
      id: courseTeachingAssignments.id,
      deliveryId:
        courseTeachingAssignments.deliveryId,
      membershipId:
        courseTeachingAssignments.membershipId,
      displayName: users.displayName,
      role: courseTeachingAssignments.role,
      startedAt:
        courseTeachingAssignments.startedAt,
      endedAt: courseTeachingAssignments.endedAt,
    })
    .from(courseTeachingAssignments)
    .innerJoin(
      collegeMemberships,
      eq(
        collegeMemberships.id,
        courseTeachingAssignments.membershipId,
      ),
    )
    .innerJoin(
      users,
      eq(users.id, collegeMemberships.userId),
    )
    .where(and(...conditions))
    .orderBy(
      asc(courseTeachingAssignments.role),
      asc(users.displayName),
    );
}

export async function createCourseTeachingAssignment(
  context: RequestContext,
  rawInput: CreateCourseTeachingAssignmentInput,
) {
  const input =
    createCourseTeachingAssignmentInputSchema.parse(
      rawInput,
    );
  const [delivery, membership] =
    await Promise.all([
      loadCourseSectionDeliveryScope(
        input.deliveryId,
      ),
      loadCourseMembership(input.membershipId),
    ]);

  requirePermission(context, "courses.manage", {
    organizationId: delivery.organizationId,
    collegeId: delivery.collegeId,
  });

  if (membership.status !== "ACTIVE") {
    throw new CoursesServiceError(
      "MEMBERSHIP_NOT_ACTIVE",
    );
  }

  if (!membership.roles.includes("FACULTY")) {
    throw new CoursesServiceError(
      "FACULTY_ROLE_REQUIRED",
    );
  }

  if (
    membership.collegeId !== delivery.collegeId
  ) {
    throw new CoursesServiceError(
      "MEMBERSHIP_COLLEGE_MISMATCH",
    );
  }

  try {
    const [created] = await getDb()
      .insert(courseTeachingAssignments)
      .values(input)
      .returning();

    return created;
  } catch (error) {
    throw mapTeachingConstraint(error);
  }
}

export async function endCourseTeachingAssignment(
  context: RequestContext,
  assignmentIdInput: string,
) {
  const assignmentId =
    courseTeachingAssignmentIdSchema.parse(
      assignmentIdInput,
    );
  const current =
    await loadCourseTeachingAssignmentScope(
      assignmentId,
    );

  requirePermission(context, "courses.manage", {
    organizationId: current.organizationId,
    collegeId: current.collegeId,
  });

  const now = new Date();
  const [updated] = await getDb()
    .update(courseTeachingAssignments)
    .set({
      endedAt: now,
      updatedAt: now,
    })
    .where(
      and(
        eq(
          courseTeachingAssignments.id,
          assignmentId,
        ),
        isNull(
          courseTeachingAssignments.endedAt,
        ),
      ),
    )
    .returning();

  if (!updated) {
    throw new CoursesServiceError(
      "TEACHING_ASSIGNMENT_NOT_FOUND",
    );
  }

  return updated;
}
