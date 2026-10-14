import {
  and,
  asc,
  eq,
  sql,
} from "drizzle-orm";
import { getDb } from "@/db/client";
import {facultyAssignmentGradingAllowed,facultyAssignmentGradePublicationAllowed} from "./faculty-assignment-grading-policy";
import {facultyRegradeFeedbackAllowed} from "./faculty-regrade-feedback-model";
import {facultyGradeHasChanges} from "./faculty-grade-noop-model";
import { recordActivityEventInTransaction } from "@/modules/activity/service";
import { ACTIVITY_EVENT_TYPES } from "@/modules/activity/taxonomy";
import {
  assignmentSubmissions,
  courseAssignments,
  collegeMemberships,
  membershipRoles,
  users,
} from "@/db/schema";
import {
  assignmentSubmissionFiles,
  courseUploadReceipts,
} from "@/db/schema/course-upload-receipts-staged";
import type { RequestContext } from "@/modules/identity/context";
import { can } from "@/modules/permissions/policy";
import { requireOwnCourseLearnerRead } from "./learner-access-guard";
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
import {
  prepareAssignmentFileReceipt,
} from "./assignment-file-service";

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

  const preparedFile =
    input.submissionType === "FILE"
      ? await prepareAssignmentFileReceipt(
          context,
          assignmentId,
          input.deliveryId,
          input.uploadReceiptId,
        )
      : null;

  // Legacy LMS parity: the due date is an urgency/late marker, not a hard
  // submission gate. A published assignment remains submittable until its
  // lifecycle is explicitly changed.
  try {
    return await getDb().transaction(async (tx) => {
      // Hold a shared lock until the submission commits: a faculty ARCHIVE
      // update waits, while different learners can submit concurrently.
      const [currentAssignment] = await tx
        .select({
          status: courseAssignments.status,
          deliveryId: courseAssignments.deliveryId,
        })
        .from(courseAssignments)
        .where(eq(courseAssignments.id, assignmentId))
        .for("share")
        .limit(1);
      if (!currentAssignment || currentAssignment.status !== "PUBLISHED") {
        throw new CoursesServiceError("ASSIGNMENT_NOT_PUBLISHED");
      }
      if (currentAssignment.deliveryId &&
          currentAssignment.deliveryId !== input.deliveryId) {
        throw new CoursesServiceError("ASSIGNMENT_DELIVERY_MISMATCH");
      }

      const [persistedMembership] = await tx
        .select({
          userId: collegeMemberships.userId,
          collegeId: collegeMemberships.collegeId,
          status: collegeMemberships.status,
        })
        .from(collegeMemberships)
        .where(eq(collegeMemberships.id, membership.id))
        .for("share")
        .limit(1);
      const [learnerRole] = await tx
        .select({ id: membershipRoles.id })
        .from(membershipRoles)
        .where(and(
          eq(membershipRoles.membershipId, membership.id),
          eq(membershipRoles.role, "LEARNER"),
        ))
        .for("share")
        .limit(1);
      if (!persistedMembership ||
          !learnerRole ||
          persistedMembership.userId !== context.user.id ||
          persistedMembership.collegeId !== membership.collegeId ||
          persistedMembership.status !== "ACTIVE" ||
          context.user.platformStatus !== "ACTIVE") {
        throw new CoursesServiceError("LEARNING_ACCESS_DENIED");
      }

      let lockedReceipt:
        | typeof courseUploadReceipts.$inferSelect
        | null = null;

      if (
        input.submissionType === "FILE"
      ) {
        if (!preparedFile) {
          throw new CoursesServiceError(
            "ASSIGNMENT_UPLOAD_RECEIPT_INVALID",
          );
        }
        const [receipt] = await tx
          .select()
          .from(courseUploadReceipts)
          .where(
            and(
              eq(
                courseUploadReceipts.id,
                input.uploadReceiptId,
              ),
              eq(
                courseUploadReceipts.assignmentId,
                assignmentId,
              ),
              eq(
                courseUploadReceipts.ownerMembershipId,
                membership.id,
              ),
              eq(
                courseUploadReceipts.collegeId,
                membership.collegeId,
              ),
              eq(
                courseUploadReceipts.purpose,
                "ASSIGNMENT_SUBMISSION",
              ),
            ),
          )
          .for("update")
          .limit(1);

        if (
          !receipt ||
          receipt.revoked ||
          receipt.consumedAt ||
          receipt.expiresAt.getTime() <=
            Date.now() ||
          receipt.objectKey !==
            preparedFile.receipt.objectKey ||
          receipt.uploadTokenHash !==
            preparedFile.receipt.uploadTokenHash
        ) {
          throw new CoursesServiceError(
            "ASSIGNMENT_UPLOAD_RECEIPT_INVALID",
          );
        }
        lockedReceipt = receipt;
      }

      const [created] = await tx
        .insert(assignmentSubmissions)
        .values({
          assignmentId,
          deliveryId: input.deliveryId,
          membershipId: membership.id,
          submissionType: input.submissionType,
          textContent: input.submissionType === "TEXT"
            ? input.textContent
            : null,
          submissionUrl: input.submissionType === "LINK"
            ? input.submissionUrl
            : null,
        })
        .returning();

      // Audit only identifiers and type, never the learner's answer.
      await recordActivityEventInTransaction(tx, context, {
        eventType: ACTIVITY_EVENT_TYPES.COURSES_ASSIGNMENT_SUBMITTED,
        collegeId: assignment.collegeId,
        organizationId: assignment.organizationId,
        subjectType: "course_assignment",
        subjectId: assignmentId,
        summary: "Learner submitted assignment",
        metadata: { submissionId: created!.id, deliveryId: input.deliveryId, submissionType: input.submissionType },
        dedupeKey: "assignment-submission:" + created!.id + ":submitted",
      });

      if (
        input.submissionType === "FILE"
      ) {
        if (
          !preparedFile ||
          !lockedReceipt
        ) {
          throw new CoursesServiceError(
            "ASSIGNMENT_UPLOAD_RECEIPT_INVALID",
          );
        }

        const attestation =
          preparedFile.attestation;
        await tx
          .insert(
            assignmentSubmissionFiles,
          )
          .values({
            assignmentSubmissionId:
              created!.id,
            // Current FILE submissions accept one receipt; the staged schema
            // requires an explicit per-submission ordinal.
            sequence: 0,
            uploadReceiptId:
              lockedReceipt.id,
            objectKey:
              lockedReceipt.objectKey,
            objectGeneration:
              attestation.generation,
            originalName:
              lockedReceipt.originalName,
            mimeType:
              attestation.contentType,
            sizeBytes:
              attestation.sizeBytes,
            sha256Hex:
              attestation.sha256Hex,
          });

        const [claimed] = await tx
          .update(courseUploadReceipts)
          .set({
            attestedGeneration:
              attestation.generation,
            actualContentType:
              attestation.contentType,
            actualSizeBytes:
              attestation.sizeBytes,
            sha256Hex:
              attestation.sha256Hex,
            consumedAt: new Date(),
            consumedBySubmissionId:
              created!.id,
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(
                courseUploadReceipts.id,
                lockedReceipt.id,
              ),
              sql`${courseUploadReceipts.consumedAt} is null`,
              eq(
                courseUploadReceipts.revoked,
                false,
              ),
            ),
          )
          .returning({
            id: courseUploadReceipts.id,
          });

        if (!claimed) {
          throw new CoursesServiceError(
            "ASSIGNMENT_UPLOAD_RECEIPT_INVALID",
          );
        }

        return toLearnerSubmission({
          ...created!,
          file: {
            originalName:
              lockedReceipt.originalName,
            mimeType:
              attestation.contentType,
            sizeBytes:
              attestation.sizeBytes,
          },
        });
      }

      return toLearnerSubmission(created!);
    });
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
  await requireOwnCourseLearnerRead(context);
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

  if(current.assignmentStatus!=="PUBLISHED") {
    throw new CoursesServiceError("ASSIGNMENT_NOT_PUBLISHED");
  }
  if(!facultyGradeHasChanges(current,input))
    throw new CoursesServiceError("ASSIGNMENT_GRADE_NO_CHANGE");
  if(!facultyRegradeFeedbackAllowed(current.gradePublished,input.feedback))
    throw new CoursesServiceError("ASSIGNMENT_REGRADE_FEEDBACK_REQUIRED");
  if (
    input.pointsAwarded > current.maxPoints
  ) {
    throw new CoursesServiceError(
      "ASSIGNMENT_GRADE_INVALID",
    );
  }

  const now = new Date();
  return getDb().transaction(async (tx) => {
    // Shared row lock serializes against ARCHIVE, preserving the published
    // assessment boundary throughout the grade and immutable audit write.
    const [locked]=await tx.select({status:courseAssignments.status,maxPoints:courseAssignments.maxPoints})
      .from(courseAssignments).where(eq(courseAssignments.id,current.assignmentId))
      .for("share").limit(1);
    if(locked?.status!=="PUBLISHED")throw new CoursesServiceError("ASSIGNMENT_NOT_PUBLISHED");
    if(!facultyAssignmentGradingAllowed(locked.status,input.pointsAwarded,locked.maxPoints))
      throw new CoursesServiceError("ASSIGNMENT_GRADE_INVALID");
    const [updated] = await tx
      .update(assignmentSubmissions)
      .set({
        pointsAwarded: input.pointsAwarded,
        feedback: input.feedback ?? null,
        gradingStatus: "GRADED",
        gradePublished: false,
        gradedByUserId: context.user.id,
        gradedAt: now,
        version: sql<number>`${assignmentSubmissions.version} + 1`,
        updatedAt: now,
      })
      .where(and(
        eq(assignmentSubmissions.id, submissionId),
        eq(assignmentSubmissions.version, input.expectedVersion),
      ))
      .returning();
    if (!updated) {
      throw new CoursesServiceError("ASSIGNMENT_SUBMISSION_CONFLICT");
    }
    // Keep grade history and the persisted update atomic. Never place
    // scores, student names or private feedback into the shared activity feed.
    await recordActivityEventInTransaction(tx, context, {
      eventType: ACTIVITY_EVENT_TYPES.COURSES_ASSIGNMENT_GRADED,
      collegeId: current.collegeId,
      organizationId: current.organizationId,
      subjectType: "assignment_submission",
      subjectId: updated.id,
      summary: "Assignment submission graded",
      metadata: {
        assignmentId: updated.assignmentId,
        deliveryId: updated.deliveryId,
        version: updated.version,
        gradePublished: false,
        wasPublished:current.gradePublished,
        feedbackProvided:Boolean(input.feedback?.trim()),
      },
      groupKey: `course-assignment:${updated.assignmentId}:grading`,
      dedupeKey: `assignment-submission:${updated.id}:graded:${updated.version}`,
    });
    return updated;
  });
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

  if(!facultyAssignmentGradePublicationAllowed(current.assignmentStatus,current.gradingStatus))
    throw new CoursesServiceError("ASSIGNMENT_NOT_PUBLISHED");
  if (current.gradingStatus !== "GRADED") {
    throw new CoursesServiceError(
      "ASSIGNMENT_NOT_GRADED",
    );
  }

  // Even a duplicate publish must carry the current optimistic token:
  // otherwise a stale browser tab reports success after a concurrent regrade.
  if (current.version !== input.expectedVersion) {
    throw new CoursesServiceError("ASSIGNMENT_SUBMISSION_CONFLICT");
  }
  if (current.gradePublished) {
    return current;
  }

  return getDb().transaction(async (tx) => {
    const [locked]=await tx.select({status:courseAssignments.status})
      .from(courseAssignments).where(eq(courseAssignments.id,current.assignmentId))
      .for("share").limit(1);
    if(locked?.status!=="PUBLISHED")throw new CoursesServiceError("ASSIGNMENT_NOT_PUBLISHED");
    const [updated] = await tx
      .update(assignmentSubmissions)
      .set({
        gradePublished: true,
        version: sql<number>`${assignmentSubmissions.version} + 1`,
        updatedAt: new Date(),
      })
      .where(and(
        eq(assignmentSubmissions.id, submissionId),
        eq(assignmentSubmissions.version, input.expectedVersion),
        eq(assignmentSubmissions.gradePublished, false),
      ))
      .returning();
    if (!updated) {
      throw new CoursesServiceError("ASSIGNMENT_SUBMISSION_CONFLICT");
    }
    await recordActivityEventInTransaction(tx, context, {
      eventType: ACTIVITY_EVENT_TYPES.COURSES_ASSIGNMENT_GRADE_PUBLISHED,
      collegeId: current.collegeId,
      organizationId: current.organizationId,
      subjectType: "assignment_submission",
      subjectId: updated.id,
      summary: "Assignment grade published",
      metadata: {
        assignmentId: updated.assignmentId,
        deliveryId: updated.deliveryId,
        version: updated.version,
        gradePublished: true,
      },
      groupKey: `course-assignment:${updated.assignmentId}:grading`,
      dedupeKey: `assignment-submission:${updated.id}:grade-published:${updated.version}`,
    });
    return updated;
  });
}
