import {
  and,
  asc,
  eq,
  sql,
} from "drizzle-orm";
import { getDb } from "@/db/client";
import {
  assignmentSubmissions,
  collegeMemberships,
  users,
} from "@/db/schema";
import type { RequestContext } from "@/modules/identity/context";
import { can } from "@/modules/permissions/policy";
import {
  requireDeliveryContentMutation,
  requireLearningReadAccess,
} from "./learning-access";
import {
  CoursesServiceError,
  postgresConstraintName,
} from "./errors";
import {
  loadAssignmentSubmissionScope,
  loadCourseAssignmentScope,
} from "./assignment-scope";
import {
  loadCourseSectionDeliveryScope,
} from "./scope";
import {
  assignmentSubmissionIdSchema,
  courseAssignmentIdSchema,
  gradeAssignmentSubmissionInputSchema,
  publishAssignmentGradeInputSchema,
  submitAssignmentInputSchema,
  type GradeAssignmentSubmissionInput,
  type SubmitAssignmentInput,
} from "./assignment-validation";
import {
  courseSectionDeliveryIdSchema,
} from "./validation";

function assignmentAudienceMatches(
  assignment: Awaited<
    ReturnType<
      typeof loadCourseAssignmentScope
    >
  >,
  deliveryId: string,
) {
  return (
    !assignment.deliveryId ||
    assignment.deliveryId === deliveryId
  );
}

function toLearnerSubmission<
  T extends {
    gradePublished: boolean;
    pointsAwarded: number | null;
    feedback: string | null;
    gradingStatus:
      | "NOT_GRADED"
      | "GRADED";
    gradedByUserId: string | null;
    gradedAt: Date | null;
  },
>(submission: T) {
  if (submission.gradePublished) {
    return submission;
  }

  return {
    ...submission,
    pointsAwarded: null,
    feedback: null,
    gradingStatus:
      "NOT_GRADED" as const,
    gradedByUserId: null,
    gradedAt: null,
  };
}

async function requireAssignmentLearnerAccess(
  context: RequestContext,
  assignment: Awaited<
    ReturnType<
      typeof loadCourseAssignmentScope
    >
  >,
  deliveryId: string,
) {
  if (
    assignment.status !== "PUBLISHED" ||
    assignment.learningPathStatus !==
      "PUBLISHED"
  ) {
    throw new CoursesServiceError(
      "ASSIGNMENT_NOT_PUBLISHED",
    );
  }

  if (
    !assignmentAudienceMatches(
      assignment,
      deliveryId,
    )
  ) {
    throw new CoursesServiceError(
      "ASSIGNMENT_DELIVERY_MISMATCH",
    );
  }

  const access =
    await requireLearningReadAccess(
      context,
      assignment.offeringId,
      deliveryId,
    );

  if (
    access !== "LEARNER" ||
    !context.membership
  ) {
    throw new CoursesServiceError(
      "LEARNING_ACCESS_DENIED",
    );
  }

  return context.membership;
}

async function requireAssignmentGradeAccess(
  context: RequestContext,
  submission: Awaited<
    ReturnType<
      typeof loadAssignmentSubmissionScope
    >
  >,
) {
  if (
    can(context, "courses.manage", {
      organizationId:
        submission.organizationId,
      collegeId: submission.collegeId,
    })
  ) {
    return;
  }

  await requireDeliveryContentMutation(
    context,
    submission.deliveryId,
  );
}

export async function submitCourseAssignment(
  context: RequestContext,
  assignmentIdInput: string,
  rawInput: SubmitAssignmentInput,
) {
  const assignmentId =
    courseAssignmentIdSchema.parse(
      assignmentIdInput,
    );
  const input =
    submitAssignmentInputSchema.parse(
      rawInput,
    );
  const assignment =
    await loadCourseAssignmentScope(
      assignmentId,
    );

  const membership =
    await requireAssignmentLearnerAccess(
      context,
      assignment,
      input.deliveryId,
    );

  // Legacy LMS parity: the due date is an urgency/late marker, not a hard
  // submission gate. A published assignment remains submittable until its
  // lifecycle is explicitly changed.
  try {
    const [created] = await getDb()
      .insert(assignmentSubmissions)
      .values({
        assignmentId,
        deliveryId: input.deliveryId,
        membershipId: membership.id,
        submissionType:
          input.submissionType,
        textContent:
          input.submissionType === "TEXT"
            ? input.textContent
            : null,
        submissionUrl:
          input.submissionType === "LINK"
            ? input.submissionUrl
            : null,
      })
      .returning();

    return toLearnerSubmission(created);
  } catch (error) {
    if (
      postgresConstraintName(error) ===
      "assignment_submissions_assignment_membership_uq"
    ) {
      throw new CoursesServiceError(
        "ASSIGNMENT_ALREADY_SUBMITTED",
      );
    }
    throw error;
  }
}

export async function getMyAssignmentSubmission(
  context: RequestContext,
  assignmentIdInput: string,
  deliveryIdInput: string,
) {
  const assignmentId =
    courseAssignmentIdSchema.parse(
      assignmentIdInput,
    );
  const deliveryId =
    courseSectionDeliveryIdSchema.parse(
      deliveryIdInput,
    );
  const assignment =
    await loadCourseAssignmentScope(
      assignmentId,
      true,
    );

  if (
    !assignmentAudienceMatches(
      assignment,
      deliveryId,
    )
  ) {
    throw new CoursesServiceError(
      "ASSIGNMENT_DELIVERY_MISMATCH",
    );
  }

  const access =
    await requireLearningReadAccess(
      context,
      assignment.offeringId,
      deliveryId,
    );

  if (
    access !== "LEARNER" ||
    !context.membership
  ) {
    throw new CoursesServiceError(
      "LEARNING_ACCESS_DENIED",
    );
  }

  const [submission] = await getDb()
    .select()
    .from(assignmentSubmissions)
    .where(
      and(
        eq(
          assignmentSubmissions.assignmentId,
          assignmentId,
        ),
        eq(
          assignmentSubmissions.membershipId,
          context.membership.id,
        ),
      ),
    )
    .limit(1);

  return submission
    ? toLearnerSubmission(submission)
    : null;
}

export async function listAssignmentSubmissions(
  context: RequestContext,
  assignmentIdInput: string,
  deliveryIdInput: string,
) {
  const assignmentId =
    courseAssignmentIdSchema.parse(
      assignmentIdInput,
    );
  const deliveryId =
    courseSectionDeliveryIdSchema.parse(
      deliveryIdInput,
    );
  const [assignment, delivery] =
    await Promise.all([
      loadCourseAssignmentScope(
        assignmentId,
        true,
      ),
      loadCourseSectionDeliveryScope(
        deliveryId,
        true,
      ),
    ]);

  if (
    delivery.offeringId !==
      assignment.offeringId ||
    !assignmentAudienceMatches(
      assignment,
      deliveryId,
    )
  ) {
    throw new CoursesServiceError(
      "ASSIGNMENT_DELIVERY_MISMATCH",
    );
  }

  if (
    can(context, "courses.manage", {
      organizationId:
        assignment.organizationId,
      collegeId: assignment.collegeId,
    })
  ) {
    // Admin/scoped Super Admin may review.
  } else {
    await requireDeliveryContentMutation(
      context,
      deliveryId,
    );
  }

  return getDb()
    .select({
      id: assignmentSubmissions.id,
      assignmentId:
        assignmentSubmissions.assignmentId,
      deliveryId:
        assignmentSubmissions.deliveryId,
      membershipId:
        assignmentSubmissions.membershipId,
      submissionType:
        assignmentSubmissions.submissionType,
      textContent:
        assignmentSubmissions.textContent,
      submissionUrl:
        assignmentSubmissions.submissionUrl,
      submittedAt:
        assignmentSubmissions.submittedAt,
      pointsAwarded:
        assignmentSubmissions.pointsAwarded,
      feedback:
        assignmentSubmissions.feedback,
      gradingStatus:
        assignmentSubmissions.gradingStatus,
      gradePublished:
        assignmentSubmissions.gradePublished,
      gradedByUserId:
        assignmentSubmissions.gradedByUserId,
      gradedAt:
        assignmentSubmissions.gradedAt,
      version: assignmentSubmissions.version,
      createdAt:
        assignmentSubmissions.createdAt,
      updatedAt:
        assignmentSubmissions.updatedAt,
      learnerDisplayName: users.displayName,
      learnerEmail: users.email,
    })
    .from(assignmentSubmissions)
    .innerJoin(
      collegeMemberships,
      eq(
        collegeMemberships.id,
        assignmentSubmissions.membershipId,
      ),
    )
    .innerJoin(
      users,
      eq(
        users.id,
        collegeMemberships.userId,
      ),
    )
    .where(
      and(
        eq(
          assignmentSubmissions.assignmentId,
          assignmentId,
        ),
        eq(
          assignmentSubmissions.deliveryId,
          deliveryId,
        ),
      ),
    )
    .orderBy(
      asc(
        assignmentSubmissions.submittedAt,
      ),
      asc(assignmentSubmissions.id),
    );
}

export async function gradeAssignmentSubmission(
  context: RequestContext,
  submissionIdInput: string,
  rawInput: GradeAssignmentSubmissionInput,
) {
  const submissionId =
    assignmentSubmissionIdSchema.parse(
      submissionIdInput,
    );
  const input =
    gradeAssignmentSubmissionInputSchema.parse(
      rawInput,
    );
  const current =
    await loadAssignmentSubmissionScope(
      submissionId,
    );

  await requireAssignmentGradeAccess(
    context,
    current,
  );

  if (
    input.pointsAwarded > current.maxPoints
  ) {
    throw new CoursesServiceError(
      "ASSIGNMENT_GRADE_INVALID",
    );
  }

  const now = new Date();
  const [updated] = await getDb()
    .update(assignmentSubmissions)
    .set({
      pointsAwarded:
        input.pointsAwarded,
      feedback: input.feedback ?? null,
      gradingStatus: "GRADED",
      gradePublished: false,
      gradedByUserId: context.user.id,
      gradedAt: now,
      version: sql<number>`
        ${assignmentSubmissions.version} + 1
      `,
      updatedAt: now,
    })
    .where(
      and(
        eq(
          assignmentSubmissions.id,
          submissionId,
        ),
        eq(
          assignmentSubmissions.version,
          input.expectedVersion,
        ),
      ),
    )
    .returning();

  if (!updated) {
    throw new CoursesServiceError(
      "ASSIGNMENT_SUBMISSION_CONFLICT",
    );
  }

  return updated;
}

export async function publishAssignmentGrade(
  context: RequestContext,
  submissionIdInput: string,
  rawInput: unknown,
) {
  const submissionId =
    assignmentSubmissionIdSchema.parse(
      submissionIdInput,
    );
  const input =
    publishAssignmentGradeInputSchema.parse(
      rawInput,
    );
  const current =
    await loadAssignmentSubmissionScope(
      submissionId,
    );

  await requireAssignmentGradeAccess(
    context,
    current,
  );

  if (current.gradingStatus !== "GRADED") {
    throw new CoursesServiceError(
      "ASSIGNMENT_NOT_GRADED",
    );
  }

  if (current.gradePublished) {
    return current;
  }

  const [updated] = await getDb()
    .update(assignmentSubmissions)
    .set({
      gradePublished: true,
      version: sql<number>`
        ${assignmentSubmissions.version} + 1
      `,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(
          assignmentSubmissions.id,
          submissionId,
        ),
        eq(
          assignmentSubmissions.version,
          input.expectedVersion,
        ),
        eq(
          assignmentSubmissions.gradePublished,
          false,
        ),
      ),
    )
    .returning();

  if (!updated) {
    throw new CoursesServiceError(
      "ASSIGNMENT_SUBMISSION_CONFLICT",
    );
  }

  return updated;
}
