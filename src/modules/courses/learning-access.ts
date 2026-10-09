import {
  and,
  eq,
  inArray,
  isNull,
} from "drizzle-orm";
import { getDb } from "@/db/client";
import {
  courseTeachingAssignments,
  learnerProgramEnrollments,
  sectionEnrollments,
} from "@/db/schema";
import type { RequestContext } from "@/modules/identity/context";
import { can } from "@/modules/permissions/policy";
import { hasActiveElectiveDeliveryAccess, isElectiveBackedDelivery } from "@/modules/groups/roster-access";
import { CoursesServiceError } from "./errors";
import {
  loadCourseOfferingScope,
  loadCourseSectionDeliveryScope,
} from "./scope";

export type LearningAccessMode =
  | "ADMIN"
  | "FACULTY"
  | "LEARNER";

function activeSameCollegeMembership(
  context: RequestContext,
  collegeId: string,
) {
  return Boolean(
    context.membership &&
      context.membership.status === "ACTIVE" &&
      context.membership.collegeId === collegeId,
  );
}

async function hasFacultyDeliveryAccess(
  context: RequestContext,
  deliveryId: string,
) {
  if (
    !context.membership ||
    !context.membership.roles.includes("FACULTY")
  ) {
    return false;
  }

  const [row] = await getDb()
    .select({
      id: courseTeachingAssignments.id,
    })
    .from(courseTeachingAssignments)
    .where(
      and(
        eq(
          courseTeachingAssignments.deliveryId,
          deliveryId,
        ),
        eq(
          courseTeachingAssignments.membershipId,
          context.membership.id,
        ),
        isNull(
          courseTeachingAssignments.endedAt,
        ),
      ),
    )
    .limit(1);

  return Boolean(row);
}

async function hasLearnerDeliveryAccess(
  context: RequestContext,
  delivery: Awaited<
    ReturnType<
      typeof loadCourseSectionDeliveryScope
    >
  >,
  includeHistorical = false,
) {
  if (
    !context.membership ||
    !context.membership.roles.includes("LEARNER")
  ) {
    return false;
  }

  // An elective-backed delivery must NEVER fall back to the host section's
  // primary roster: the elective group is its sole learner membership source.
  if (await isElectiveBackedDelivery(delivery.id)) {
    return hasActiveElectiveDeliveryAccess(
      context.membership.id,
      delivery.collegeId,
      delivery.id,
    );
  }

  const [row] = await getDb()
    .select({ id: sectionEnrollments.id })
    .from(sectionEnrollments)
    .innerJoin(
      learnerProgramEnrollments,
      eq(
        learnerProgramEnrollments.id,
        sectionEnrollments.learnerEnrollmentId,
      ),
    )
    .where(
      and(
        eq(
          learnerProgramEnrollments.membershipId,
          context.membership.id,
        ),
        includeHistorical
          ? inArray(
              learnerProgramEnrollments.status,
              ["ACTIVE", "COMPLETED"],
            )
          : eq(
              learnerProgramEnrollments.status,
              "ACTIVE",
            ),
        eq(
          sectionEnrollments.sectionId,
          delivery.sectionId,
        ),
        eq(
          sectionEnrollments.academicPeriodId,
          delivery.academicPeriodId,
        ),
        includeHistorical
          ? inArray(
              sectionEnrollments.status,
              ["ACTIVE", "COMPLETED"],
            )
          : eq(
              sectionEnrollments.status,
              "ACTIVE",
            ),
      ),
    )
    .limit(1);

  return Boolean(row);
}

export async function requireLearningReadAccess(
  context: RequestContext,
  offeringId: string,
  deliveryId?: string | null,
  options: {
    includeHistorical?: boolean;
  } = {},
): Promise<LearningAccessMode> {
  const includeHistorical =
    options.includeHistorical ?? false;
  const offering =
    await loadCourseOfferingScope(
      offeringId,
      includeHistorical,
    );
  const resource = {
    organizationId: offering.organizationId,
    collegeId: offering.collegeId,
  };

  const delivery = deliveryId
    ? await loadCourseSectionDeliveryScope(
        deliveryId,
        includeHistorical,
      )
    : null;

  if (
    delivery &&
    delivery.offeringId !== offeringId
  ) {
    throw new CoursesServiceError(
      "CONTENT_DELIVERY_MISMATCH",
    );
  }

  if (can(context, "courses.manage", resource)) {
    return "ADMIN";
  }

  if (
    !activeSameCollegeMembership(
      context,
      offering.collegeId,
    ) ||
    !deliveryId ||
    !delivery
  ) {
    throw new CoursesServiceError(
      "LEARNING_ACCESS_DENIED",
    );
  }

  if (
    await hasFacultyDeliveryAccess(
      context,
      deliveryId,
    )
  ) {
    return "FACULTY";
  }

  if (
    await hasLearnerDeliveryAccess(
      context,
      delivery,
      includeHistorical,
    )
  ) {
    return "LEARNER";
  }

  throw new CoursesServiceError(
    context.membership?.roles.includes("FACULTY")
      ? "FACULTY_TEACHING_SCOPE_REQUIRED"
      : "LEARNER_ENROLLMENT_SCOPE_REQUIRED",
  );
}

export async function requireDeliveryContentMutation(
  context: RequestContext,
  deliveryId: string,
) {
  const delivery =
    await loadCourseSectionDeliveryScope(
      deliveryId,
    );
  const resource = {
    organizationId: delivery.organizationId,
    collegeId: delivery.collegeId,
  };

  if (can(context, "courses.manage", resource)) {
    return "ADMIN" as const;
  }

  if (
    !activeSameCollegeMembership(
      context,
      delivery.collegeId,
    ) ||
    !(await hasFacultyDeliveryAccess(
      context,
      deliveryId,
    ))
  ) {
    throw new CoursesServiceError(
      "FACULTY_TEACHING_SCOPE_REQUIRED",
    );
  }

  return "FACULTY" as const;
}
