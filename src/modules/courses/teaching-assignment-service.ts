import {
  and,
  asc,
  eq,
  isNull,
} from "drizzle-orm";
import { getDb } from "@/db/client";
import {
  collegeMemberships,
  membershipRoles,
  courseSectionDeliveries,
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
    return await getDb().transaction(async (tx) => {
      // A previous delivery scope check can become stale while another
      // transaction ends this delivery. Pair SHARE with end's FOR UPDATE.
      const [liveDelivery] = await tx
        .select({ id: courseSectionDeliveries.id })
        .from(courseSectionDeliveries)
        .where(and(
          eq(courseSectionDeliveries.id, input.deliveryId),
          isNull(courseSectionDeliveries.endedAt),
        ))
        .for("share")
        .limit(1);

      if (!liveDelivery) {
        throw new CoursesServiceError("SECTION_DELIVERY_NOT_FOUND");
      }

      // A faculty member's college, active status or FACULTY role may
      // change after the earlier permission check. Lock the membership
      // and its role row to avoid assigning an already-revoked teacher.
      const [liveMember] = await tx
        .select({
          id: collegeMemberships.id,
          collegeId: collegeMemberships.collegeId,
          status: collegeMemberships.status,
        })
        .from(collegeMemberships)
        .where(eq(collegeMemberships.id, input.membershipId))
        .for("share")
        .limit(1);

      if (!liveMember || liveMember.status !== "ACTIVE") {
        throw new CoursesServiceError("MEMBERSHIP_NOT_ACTIVE");
      }
      if (liveMember.collegeId !== delivery.collegeId) {
        throw new CoursesServiceError("MEMBERSHIP_COLLEGE_MISMATCH");
      }

      const [facultyRole] = await tx
        .select({ id: membershipRoles.id })
        .from(membershipRoles)
        .where(and(
          eq(membershipRoles.membershipId, input.membershipId),
          eq(membershipRoles.role, "FACULTY"),
        ))
        .for("share")
        .limit(1);

      if (!facultyRole) {
        throw new CoursesServiceError("FACULTY_ROLE_REQUIRED");
      }

      const [created] = await tx
        .insert(courseTeachingAssignments)
        .values(input)
        .returning();

      return created;
    });
  } catch (error) {
    if (error instanceof CoursesServiceError) throw error;
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
