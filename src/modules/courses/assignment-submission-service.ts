import {
  and,
  desc,
  eq,
  inArray,
  isNull,
  sql,
} from "drizzle-orm";
import { getDb } from "@/db/client";
import { assertAssignmentSubmissionDeadline } from "./assignment-submission-deadline-policy";
import { submitAssignmentWithFiles } from "./assignment-submission-file-service";
import {allowedAssignmentSubmissionPart, allowedAssignmentMixedParts} from "./assignment-method-policy";
import { assignmentSubmissionLinks } from "@/db/schema/assignment-submission-links";
import {facultyAssignmentGradingAllowed,facultyAssignmentGradePublicationAllowed} from "./faculty-assignment-grading-policy";
import {facultyRegradeFeedbackAllowed} from "./faculty-regrade-feedback-model";
import {facultyGradeHasChanges} from "./faculty-grade-noop-model";
import {legacyPriorGraderEligible} from "./faculty-prior-grader-policy";
import {descriptiveAssignmentPointsSchema,addDescriptivePoints} from "./assignment-descriptive-points-model";
import { recordActivityEventInTransaction } from "@/modules/activity/service";
import { ACTIVITY_EVENT_TYPES } from "@/modules/activity/taxonomy";
import {
  assignmentSubmissions,
  activityEvents,
  inAppNotifications,
  courseAssignments,
  courseTeachingAssignments,
  collegeMemberships,
  membershipRoles,
  users,
} from "@/db/schema";
import {
  assignmentSubmissionFiles,
  courseUploadReceipts,
} from "@/db/schema/course-upload-receipts-staged";
import type { RequestContext } from "@/modules/identity/context";
import {hasMembershipRole,isSuperAdmin} from "@/modules/identity/context";
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
import {learnerAssignmentPublishedNotice} from "./learner-assignment-notification-model";
import {
  AssignmentFileReceiptFailure,
  prepareAssignmentFileReceipt,
} from "./assignment-file-service";

type SubmissionLink = { kind: "REPOSITORY_LINK" | "EXTERNAL_LINK"; url: string; caption: string };

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
    previousPoints: number | null;
    legacyGradingKind: string | null;
    legacySubmissionSnapshot: Record<string, unknown> | null;
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
    // Archived imports and regrades must not leak an unpublished score
    // through the legacy snapshot or previous-points columns.
    previousPoints: null,
    legacyGradingKind: null,
    legacySubmissionSnapshot: null,
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
      "PUBLISHED" ||
    !assignment.lessonVisibleToStudents
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

  if(legacyPriorGraderEligible({
    userId:context.user.id,
    gradedByUserId:submission.gradedByUserId,
    membership:context.membership,
    collegeId:submission.collegeId,
  }))return;
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

  // DB-018 compatibility cutover: the old uploadReceiptId input aliases
  // the live DB016 verified storage file ID. Consume it through the same
  // registered one-shot FILE producer used by the current learner UI.
  // Never execute the unregistered DB053 duplicate file relation on this path.
  if (input.submissionType === "FILE") {
    const fileIds = input.uploadReceiptIds ??
      (input.uploadReceiptId ? [input.uploadReceiptId] : []);
    if (!fileIds.length) {
      throw new CoursesServiceError("ASSIGNMENT_UPLOAD_RECEIPT_INVALID");
    }
    const bound = await submitAssignmentWithFiles(context, assignmentId, {
      deliveryId: input.deliveryId,
      fileIds,
      textContent: input.textContent ?? null,
      links: input.links ?? [],
    });
    const [persisted] = await getDb()
      .select()
      .from(assignmentSubmissions)
      .where(eq(assignmentSubmissions.id, bound.submission.id))
      .limit(1);
    if (!persisted) {
      throw new CoursesServiceError("ASSIGNMENT_SUBMISSION_NOT_FOUND");
    }
    const files = bound.files.map(file => ({
      originalName: file.originalName,
      mimeType: file.contentType,
      sizeBytes: file.sizeBytes,
    }));
    return toLearnerSubmission({
      ...persisted,
      file: files[0] ?? null,
      files,
    });
  }

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

  // Prepare every file against the persisted learner/college scope before
  // taking row locks. The transaction rechecks each receipt and consumes it
  // exactly once; no object metadata is trusted from the submitted JSON.
  const fileReceiptIds: string[] = input.submissionType === "FILE"
    ? input.uploadReceiptIds ?? (input.uploadReceiptId ? [input.uploadReceiptId] : [])
    : [];
  const preparedFiles = input.submissionType === "FILE"
    ? await Promise.all(fileReceiptIds.map((receiptId: string) =>
        prepareAssignmentFileReceipt(context, assignmentId, input.deliveryId, receiptId)))
    : [];

  try {
    return await getDb().transaction(async (tx) => {
      // Hold a shared lock until the submission commits: a faculty ARCHIVE
      // update waits, while different learners can submit concurrently.
      const [currentAssignment] = await tx
        .select({
          status: courseAssignments.status,
          deliveryId: courseAssignments.deliveryId,
          dueAt: courseAssignments.dueAt,
          maxPoints: courseAssignments.maxPoints,
          title: courseAssignments.title,
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

      assertAssignmentSubmissionDeadline(currentAssignment.dueAt, new Date());
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

      // One-shot submissions retain their identity even when the assignment's
      // accepted methods have since been narrowed. Check persisted ownership
      // first, then report an existing submission before validating a new part.
      // The unique constraint below still arbitrates simultaneous inserts.
      const [existingSubmission] = await tx
        .select({ id: assignmentSubmissions.id })
        .from(assignmentSubmissions)
        .where(and(
          eq(assignmentSubmissions.assignmentId, assignmentId),
          eq(assignmentSubmissions.membershipId, membership.id),
        ))
        .limit(1);
      if (existingSubmission) {
        throw new CoursesServiceError("ASSIGNMENT_ALREADY_SUBMITTED");
      }

      {
        const [policy]=await tx.select({methods:courseAssignments.allowedSubmissionMethods})
          .from(courseAssignments).where(eq(courseAssignments.id,assignmentId)).limit(1);
        const methodAllowed = policy && (input.submissionType === "FILE"
          ? allowedAssignmentMixedParts(policy.methods, {
              hasWrittenResponse: Boolean(input.textContent),
              links: (input.links ?? []).map((link: SubmissionLink) => ({ kind: link.kind })),
              fileMimeTypes: preparedFiles.map(file => file.attestation.contentType),
            })
          : allowedAssignmentSubmissionPart(policy.methods, {
              kind: input.submissionType,
              ...(input.submissionType === "LINK" && input.linkKind !== undefined ? { linkKind: input.linkKind } : {}),
            }));
        if (!methodAllowed) {
          throw new CoursesServiceError("ASSIGNMENT_METHOD_NOT_ALLOWED");
        }
      }

      const lockedReceipts: Array<typeof courseUploadReceipts.$inferSelect> = [];
      if (input.submissionType === "FILE") {
        if (preparedFiles.length !== fileReceiptIds.length ||
            preparedFiles.length === 0 || preparedFiles.length > 20) {
          // The current database keeps a deferred FILE payload invariant:
          // each mixed submission must include one verified file. A text-only
          // or link-only single part uses its native TEXT/LINK type instead.
          throw new CoursesServiceError("ASSIGNMENT_UPLOAD_RECEIPT_INVALID");
        }
        // Lock and verify ALL receipts before writing. Ordered locks avoid
        // deadlocks if malformed competing requests attempt shared receipts.
        const receiptById = new Map<string, typeof courseUploadReceipts.$inferSelect>();
        for (const receiptId of [...fileReceiptIds].sort()) {
          const [receipt] = await tx.select().from(courseUploadReceipts)
            .where(and(
              eq(courseUploadReceipts.id, receiptId),
              eq(courseUploadReceipts.assignmentId, assignmentId),
              eq(courseUploadReceipts.deliveryId, input.deliveryId),
              eq(courseUploadReceipts.ownerMembershipId, membership.id),
              eq(courseUploadReceipts.collegeId, membership.collegeId),
              eq(courseUploadReceipts.purpose, "ASSIGNMENT_SUBMISSION"),
            )).for("update").limit(1);
          if (!receipt) {
            throw new CoursesServiceError("ASSIGNMENT_UPLOAD_RECEIPT_INVALID");
          }
          receiptById.set(receiptId, receipt);
        }
        const checkedAt = new Date();
        for (const [sequence, prepared] of preparedFiles.entries()) {
          const receipt = receiptById.get(fileReceiptIds[sequence]!);
          if (!receipt) {
            throw new CoursesServiceError("ASSIGNMENT_UPLOAD_RECEIPT_INVALID");
          }
          // Only reveal actionable receipt state after exact tenant, learner,
          // assignment, delivery and purpose matches. A foreign receipt ID
          // must continue to receive the generic no-leak failure.
          if (receipt.revoked || receipt.deletedAt) {
            throw new AssignmentFileReceiptFailure("REVOKED");
          }
          if (receipt.consumedAt) {
            throw new AssignmentFileReceiptFailure("USED");
          }
          if (receipt.expiresAt.getTime() <= checkedAt.getTime()) {
            throw new AssignmentFileReceiptFailure("EXPIRED");
          }
          if (receipt.scanStatus !== "CLEAN" ||
              receipt.scanAttestedBy !== "lms-vnext-privileged-scanner" ||
              !receipt.scanAttestedAt ||
              receipt.scanAttestedAt.getTime() > checkedAt.getTime() ||
              !receipt.retentionUntil ||
              receipt.retentionUntil.getTime() < checkedAt.getTime() ||
              receipt.objectKey !== prepared.receipt.objectKey ||
              receipt.uploadTokenHash !== prepared.receipt.uploadTokenHash) {
            throw new CoursesServiceError("ASSIGNMENT_UPLOAD_RECEIPT_INVALID");
          }
          lockedReceipts.push(receipt);
        }
      }

      // Legacy submissions froze the points ceiling at submission time.
      // Keep that historical cap even if faculty later edits the assignment.
      const [learnerSnapshot] = await tx.select({displayName: users.displayName})
        .from(users).where(eq(users.id, persistedMembership.userId)).limit(1);
      const [created] = await tx
        .insert(assignmentSubmissions)
        .values({
          assignmentId,
          deliveryId: input.deliveryId,
          membershipId: membership.id,
          maxPointsAtSubmission: currentAssignment.maxPoints,
          legacySubmissionSnapshot: {
            assignmentName: currentAssignment.title,
            learnerDisplayName: learnerSnapshot?.displayName ?? null,
          },
          submissionType: input.submissionType,
          textContent: input.submissionType === "TEXT" || input.submissionType === "FILE"
            ? input.textContent ?? null
            : null,
          submissionUrl: input.submissionType === "LINK"
            ? input.submissionUrl
            : null,
        })
        .returning();

      if (input.submissionType === "FILE" && input.links?.length) {
        await tx.insert(assignmentSubmissionLinks).values(
          input.links.map((link: SubmissionLink, sequence: number) => ({
            submissionId: created!.id,
            sequence,
            kind: link.kind,
            url: link.url,
            caption: link.caption,
          })),
        );
      }

      // Audit only identifiers and type, never the learner's answer.
      const submissionEvent = await recordActivityEventInTransaction(tx, context, {
        eventType: ACTIVITY_EVENT_TYPES.COURSES_ASSIGNMENT_SUBMITTED,
        collegeId: assignment.collegeId,
        organizationId: assignment.organizationId,
        subjectType: "course_assignment",
        subjectId: assignmentId,
        summary: "Learner submitted assignment",
        metadata: { submissionId: created!.id, deliveryId: input.deliveryId, submissionType: input.submissionType },
        dedupeKey: "assignment-submission:" + created!.id + ":submitted",
      });
      // A receipt bell reflects a committed submission; the grade is private
      // until Faculty publishes it. The learner is the persisted recipient.
      await tx.insert(inAppNotifications).values({
        userId:context.user.id,eventId:submissionEvent.id,
        title:"Assignment submitted",
        body:"Your assignment submission was recorded. You can review it while waiting for a grade.",
        actionHref:"/learn/allAssignments/"+encodeURIComponent(assignmentId)+
          "?deliveryId="+encodeURIComponent(input.deliveryId),
      }).onConflictDoNothing();

      if (input.submissionType === "FILE") {
        // The entire submission, its ordered files and link assets commit or
        // roll back together. Composite FK verification sees consumed receipts.
        const fileSummaries: Array<{
          originalName: string;
          mimeType: string;
          sizeBytes: number;
        }> = [];
        for (const [sequence, preparedFile] of preparedFiles.entries()) {
          const lockedReceipt = lockedReceipts[sequence];
          if (!lockedReceipt) {
            throw new CoursesServiceError("ASSIGNMENT_UPLOAD_RECEIPT_INVALID");
          }
          const attestation = preparedFile.attestation;
          const consumedAt = new Date();
          const [claimed] = await tx.update(courseUploadReceipts)
            .set({
              attestedGeneration: attestation.generation,
              actualContentType: attestation.contentType,
              actualSizeBytes: attestation.sizeBytes,
              sha256Hex: attestation.sha256Hex,
              consumedAt,
              consumedBySubmissionId: created!.id,
              updatedAt: consumedAt,
            })
            .where(and(
              eq(courseUploadReceipts.id, lockedReceipt.id),
              eq(courseUploadReceipts.ownerMembershipId, membership.id),
              eq(courseUploadReceipts.assignmentId, assignmentId),
              eq(courseUploadReceipts.deliveryId, input.deliveryId),
              isNull(courseUploadReceipts.consumedAt),
              sql`${courseUploadReceipts.expiresAt} > now()`,
              eq(courseUploadReceipts.revoked, false),
              isNull(courseUploadReceipts.deletedAt),
              eq(courseUploadReceipts.scanStatus, "CLEAN"),
              eq(courseUploadReceipts.scanAttestedBy, "lms-vnext-privileged-scanner"),
              sql`${courseUploadReceipts.scanAttestedAt} <= ${consumedAt}`,
              sql`${courseUploadReceipts.retentionUntil} >= ${consumedAt}`,
            ))
            .returning({ id: courseUploadReceipts.id });
          if (!claimed) {
            throw new CoursesServiceError("ASSIGNMENT_UPLOAD_RECEIPT_INVALID");
          }
          await tx.insert(assignmentSubmissionFiles).values({
            assignmentSubmissionId: created!.id,
            uploadReceiptId: lockedReceipt.id,
            sequence,
            objectKey: lockedReceipt.objectKey,
            objectGeneration: attestation.generation,
            originalName: lockedReceipt.originalName,
            mimeType: attestation.contentType,
            sizeBytes: attestation.sizeBytes,
            sha256Hex: attestation.sha256Hex,
          });
          fileSummaries.push({
            originalName: lockedReceipt.originalName,
            mimeType: attestation.contentType,
            sizeBytes: attestation.sizeBytes,
          });
        }
        return toLearnerSubmission({
          ...created!,
          file: fileSummaries[0],
          files: fileSummaries,
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

/** Return the learner's own assignment history across deliveries. Grades stay
 * private until published, including for old/archived assignments. */
export async function listMyAssignmentSubmissionHistory(
  context: RequestContext,
  paging: { limit?: number; offset?: number } = {},
) {
  await requireOwnCourseLearnerRead(context);
  if (!context.membership || context.membership.status !== "ACTIVE" ||
      !context.membership.roles.includes("LEARNER")) {
    throw new CoursesServiceError("LEARNING_ACCESS_DENIED");
  }
  const limit = Math.max(1, Math.min(100, Math.trunc(paging.limit ?? 50)));
  const offset = Math.max(0, Math.trunc(paging.offset ?? 0));
  if (!Number.isSafeInteger(limit) || !Number.isSafeInteger(offset)) {
    throw new RangeError("Invalid submission history page");
  }
  const rows = await getDb()
    .select()
    .from(assignmentSubmissions)
    .where(eq(assignmentSubmissions.membershipId, context.membership.id))
    .orderBy(desc(assignmentSubmissions.submittedAt), desc(assignmentSubmissions.id))
    .limit(limit)
    .offset(offset);
  return rows.map(toLearnerSubmission);
}

export async function listAssignmentSubmissions(
  context: RequestContext,
  assignmentIdInput: string,
  deliveryIdInput: string,
  paging?: { limit: number; offset: number },
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

  const query = getDb()
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
      maxPointsAtSubmission:
        assignmentSubmissions.maxPointsAtSubmission,
      previousPoints:
        assignmentSubmissions.previousPoints,
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
      desc(
        assignmentSubmissions.submittedAt,
      ),
      desc(assignmentSubmissions.id),
    );

  // Existing callers keep their array response; paginated callers push
  // limit/offset down to SQL rather than loading the whole submission table.
  if (!paging) return query;
  if (!Number.isSafeInteger(paging.limit) || paging.limit < 1 ||
      !Number.isSafeInteger(paging.offset) || paging.offset < 0) {
    throw new RangeError("Invalid assignment submissions page");
  }
  return query.limit(Math.min(100, paging.limit)).offset(paging.offset);
}

/** An authorized page with a scoped total, for large faculty cohorts. */
export async function listAssignmentSubmissionsPage(
  context: RequestContext,
  assignmentId: string,
  deliveryId: string,
  paging: { limit: number; offset: number },
) {
  const rows = await listAssignmentSubmissions(context, assignmentId, deliveryId, paging);
  const [counter] = await getDb()
    .select({ total: sql<number>`count(*)::int` })
    .from(assignmentSubmissions)
    .where(and(
      eq(assignmentSubmissions.assignmentId, courseAssignmentIdSchema.parse(assignmentId)),
      eq(assignmentSubmissions.deliveryId, courseSectionDeliveryIdSchema.parse(deliveryId)),
    ));
  return {
    submissions: rows,
    total: counter?.total ?? 0,
    limit: Math.min(100, paging.limit),
    offset: paging.offset,
  };
}

/** Staff-only grading activity and the private 0205 immutable grade ledger.
 * Both reads are scoped by the persisted submission college; a learner may
 * never see unpublished points or feedback through this endpoint.
 */
export async function listAssignmentSubmissionGradeActivity(
  context: RequestContext,
  submissionIdInput: string,
) {
  const submissionId = assignmentSubmissionIdSchema.parse(submissionIdInput);
  const submission = await loadAssignmentSubmissionScope(submissionId);
  await requireAssignmentGradeAccess(context, submission);
  const ledger=await getDb().execute<{
    id:string;action:string;actorUserId:string;actorRole:string;
    previousPoints:number|null;newPoints:number|null;
    previousFeedback:string|null;newFeedback:string|null;
    previousGradingStatus:string;newGradingStatus:string;
    previousGradePublished:boolean;newGradePublished:boolean;
    previousGradedByUserId:string|null;newGradedByUserId:string|null;
    versionBefore:number;versionAfter:number;occurredAt:Date;
  }>(sql`
    select id,action,actor_user_id as "actorUserId",actor_role as "actorRole",
      previous_points as "previousPoints",new_points as "newPoints",
      previous_feedback as "previousFeedback",new_feedback as "newFeedback",
      previous_grading_status as "previousGradingStatus",
      new_grading_status as "newGradingStatus",
      previous_grade_published as "previousGradePublished",
      new_grade_published as "newGradePublished",
      previous_graded_by_user_id as "previousGradedByUserId",
      new_graded_by_user_id as "newGradedByUserId",
      submission_version_before as "versionBefore",
      submission_version_after as "versionAfter",occurred_at as "occurredAt"
    from assignment_grade_events
    where assignment_submission_id=${submissionId}::uuid
      and college_id=${submission.collegeId}::uuid
    order by occurred_at desc,id desc limit 100
  `);
  const rows = await getDb().select({
    id: activityEvents.id,
    eventType: activityEvents.eventType,
    actorUserId: activityEvents.actorUserId,
    occurredAt: activityEvents.occurredAt,
    metadata: activityEvents.metadata,
  }).from(activityEvents).where(and(
    eq(activityEvents.collegeId, submission.collegeId),
    eq(activityEvents.organizationId, submission.organizationId),
    eq(activityEvents.subjectType, "assignment_submission"),
    eq(activityEvents.subjectId, submissionId),
    inArray(activityEvents.eventType, [
      ACTIVITY_EVENT_TYPES.COURSES_ASSIGNMENT_GRADED,
      ACTIVITY_EVENT_TYPES.COURSES_ASSIGNMENT_GRADE_PUBLISHED,
    ]),
  )).orderBy(desc(activityEvents.occurredAt), desc(activityEvents.id)).limit(100);
  return {
    historySource: "ACTIVITY_EVENTS" as const,
    gradeHistorySource: "IMMUTABLE_GRADE_EVENTS" as const,
    detailedPointsHistoryAvailable: ledger.rows.length>0,
    gradeEvents:ledger.rows,
    events: rows.map(row => ({
      id: row.id, eventType: row.eventType, actorUserId: row.actorUserId,
      occurredAt: row.occurredAt,
      version: typeof row.metadata["version"] === "number" ? row.metadata.version : null,
    })),
  };
}

/** Confirm Faculty teaching scope inside the grading transaction, not merely
 * from a stale request context. Admin scoping remains centrally permissioned. */
async function assertPersistedFacultyGrader(
  tx: Pick<ReturnType<typeof getDb>, "select">,
  context: RequestContext,
  deliveryId: string,
  collegeId: string,
  organizationId: string,
  priorGraderUserId: string | null,
) {
  if (can(context, "courses.manage", {collegeId, organizationId})) return;
  const membership = context.membership;
  if (!membership || membership.collegeId !== collegeId)
    throw new CoursesServiceError("FACULTY_TEACHING_SCOPE_REQUIRED");
  // The old LMS permits a former assigned faculty member to regrade their
  // own prior grade. Their membership and FACULTY role must still be active,
  // even after the teaching assignment has ended.
  if(legacyPriorGraderEligible({
    userId:context.user.id,gradedByUserId:priorGraderUserId,
    membership,collegeId,
  })){
    const [prior]=await tx.select({id:collegeMemberships.id})
      .from(collegeMemberships)
      .innerJoin(users,and(
        eq(users.id,collegeMemberships.userId),
        eq(users.platformStatus,"ACTIVE"),
      ))
      .innerJoin(membershipRoles,and(
        eq(membershipRoles.membershipId,collegeMemberships.id),
        eq(membershipRoles.role,"FACULTY"),
      ))
      .where(and(
        eq(collegeMemberships.id,membership.id),
        eq(collegeMemberships.userId,context.user.id),
        eq(collegeMemberships.collegeId,collegeId),
        eq(collegeMemberships.status,"ACTIVE"),
      )).for("share").limit(1);
    if(prior)return;
  }
  const [found] = await tx.select({id:courseTeachingAssignments.id})
    .from(courseTeachingAssignments)
    .innerJoin(collegeMemberships, and(
      eq(collegeMemberships.id,courseTeachingAssignments.membershipId),
      eq(collegeMemberships.userId,context.user.id),
      eq(collegeMemberships.collegeId,collegeId),
      eq(collegeMemberships.status,"ACTIVE"),
    ))
    .innerJoin(membershipRoles,and(
      eq(membershipRoles.membershipId,collegeMemberships.id),
      eq(membershipRoles.role,"FACULTY"),
    ))
    .innerJoin(users,and(
      eq(users.id,collegeMemberships.userId),
      eq(users.platformStatus,"ACTIVE"),
    ))
    .where(and(
      eq(courseTeachingAssignments.membershipId,membership.id),
      eq(courseTeachingAssignments.deliveryId,deliveryId),
      isNull(courseTeachingAssignments.endedAt),
    )).for("share").limit(1);
  if (!found) throw new CoursesServiceError("FACULTY_TEACHING_SCOPE_REQUIRED");
}

/** The legacy "Add descriptive points" operation is only available before
 * the first grade. It is not an implicit regrade or a second grade, and the
 * caller must present the exact current optimistic version. The existing
 * grading service rechecks the active teacher and tenant inside its write. */
export async function addDescriptiveAssignmentPoints(
 context:RequestContext,submissionIdRaw:unknown,rawInput:unknown,
){
 const submissionId=assignmentSubmissionIdSchema.parse(submissionIdRaw);
 const input=descriptiveAssignmentPointsSchema.parse(rawInput);
 const current=await loadAssignmentSubmissionScope(submissionId);
 await requireAssignmentGradeAccess(context,current);
 if(current.gradingStatus==="GRADED"||current.gradePublished)
   throw new CoursesServiceError("ASSIGNMENT_ALREADY_GRADED");
 if(current.version!==input.expectedVersion)
   throw new CoursesServiceError("ASSIGNMENT_SUBMISSION_CONFLICT");
 const pointsAwarded=addDescriptivePoints(
   current.pointsAwarded??0,input.pointsToAdd,
   current.maxPointsAtSubmission??current.maxPoints,
 );
 return gradeAssignmentSubmission(context,submissionId,{
   pointsAwarded,feedback:input.feedback??null,expectedVersion:input.expectedVersion,
 });
}

/** 0205 is registered in the migration journal. Write one immutable private
 * ledger row before the grading transaction commits; never put points or
 * feedback into the college-wide activity stream. The optimistic submission
 * version is the event's unique, ordered version key. */
async function appendAssignmentGradeEvent(
  tx:Pick<ReturnType<typeof getDb>,"execute">,
  context:RequestContext,
  previous:Awaited<ReturnType<typeof loadAssignmentSubmissionScope>>,
  next:typeof assignmentSubmissions.$inferSelect,
  action:"GRADE"|"REGRADE"|"HIDE_GRADE"|"PUBLISH_GRADE",
){
  const superAdmin=isSuperAdmin(context);
  const role=superAdmin?"SUPER_ADMIN":
    hasMembershipRole(context,"COLLEGE_ADMIN")?"COLLEGE_ADMIN":"FACULTY";
  const actorMembershipId=superAdmin?null:context.membership?.id??null;
  if(!superAdmin&&!actorMembershipId)
    throw new CoursesServiceError("FACULTY_TEACHING_SCOPE_REQUIRED");
  await tx.execute(sql`
    insert into assignment_grade_events (
      assignment_submission_id,assignment_id,delivery_id,learner_membership_id,
      college_id,actor_user_id,actor_membership_id,actor_role,action,
      previous_points,new_points,previous_feedback,new_feedback,
      previous_grading_status,new_grading_status,
      previous_grade_published,new_grade_published,
      previous_graded_by_user_id,new_graded_by_user_id,
      previous_graded_at,new_graded_at,
      submission_version_before,submission_version_after
    ) values (
      ${next.id}::uuid,${next.assignmentId}::uuid,${next.deliveryId}::uuid,
      ${next.membershipId}::uuid,${previous.collegeId}::uuid,
      ${context.user.id}::uuid,${actorMembershipId}::uuid,${role},${action},
      ${previous.pointsAwarded},${next.pointsAwarded},
      ${previous.feedback},${next.feedback},
      ${previous.gradingStatus},${next.gradingStatus},
      ${previous.gradePublished},${next.gradePublished},
      ${previous.gradedByUserId}::uuid,${next.gradedByUserId}::uuid,
      ${previous.gradedAt},${next.gradedAt},
      ${previous.version},${next.version}
    )
  `);
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
  const gradeChanged=facultyGradeHasChanges(current,{
    pointsAwarded: input.pointsAwarded,
    ...(input.feedback !== undefined ? { feedback: input.feedback } : {}),
    ...(input.hidePublished !== undefined ? { hidePublished: input.hidePublished } : {}),
  });
  const hideOnly=input.hidePublished===true && current.gradePublished && !gradeChanged;
  if(!gradeChanged&&!hideOnly)
    throw new CoursesServiceError("ASSIGNMENT_GRADE_NO_CHANGE");
  if(!hideOnly&&!facultyRegradeFeedbackAllowed(current.gradePublished,input.feedback))
    throw new CoursesServiceError("ASSIGNMENT_REGRADE_FEEDBACK_REQUIRED");
  // For historical submissions grade against the original points ceiling;
  // imports without a snapshot retain the current authored maximum.
  if (
    input.pointsAwarded > (current.maxPointsAtSubmission ?? current.maxPoints)
  ) {
    throw new CoursesServiceError(
      "ASSIGNMENT_GRADE_INVALID",
    );
  }

  const now = new Date();
  return getDb().transaction(async (tx) => {
    await assertPersistedFacultyGrader(tx,context,current.deliveryId,current.collegeId,current.organizationId,current.gradedByUserId);
    // Shared row lock serializes against ARCHIVE, preserving the published
    // assessment boundary throughout the grade and immutable audit write.
    const [locked]=await tx.select({status:courseAssignments.status,maxPoints:courseAssignments.maxPoints})
      .from(courseAssignments).where(eq(courseAssignments.id,current.assignmentId))
      .for("share").limit(1);
    if(locked?.status!=="PUBLISHED")throw new CoursesServiceError("ASSIGNMENT_NOT_PUBLISHED");
    if(!facultyAssignmentGradingAllowed(locked.status,input.pointsAwarded,
      current.maxPointsAtSubmission ?? locked.maxPoints))
      throw new CoursesServiceError("ASSIGNMENT_GRADE_INVALID");
    const [updated] = await tx
      .update(assignmentSubmissions)
      .set({
        // Hiding a published grade is not a regrade: preserve its points,
        // prior points, grading timestamp and original grader. Regrades
        // capture the previous score from the CAS-updated row.
        ...(hideOnly ? {} : {
          previousPoints: sql<number | null>`${assignmentSubmissions.pointsAwarded}`,
          pointsAwarded: input.pointsAwarded,
          feedback: input.feedback ?? null,
          gradingStatus: "GRADED" as const,
          gradedByUserId: context.user.id,
          gradedAt: now,
        }),
        gradePublished: false,
        version: sql<number>`${assignmentSubmissions.version} + 1`,
        updatedAt: now,
      })
      .where(and(
        eq(assignmentSubmissions.id, submissionId),
        eq(assignmentSubmissions.version, input.expectedVersion),
        hideOnly ? eq(assignmentSubmissions.gradePublished,true) : undefined,
      ))
      .returning();
    if (!updated) {
      throw new CoursesServiceError("ASSIGNMENT_SUBMISSION_CONFLICT");
    }
    await appendAssignmentGradeEvent(tx,context,current,updated,
      hideOnly?"HIDE_GRADE":current.gradingStatus==="GRADED"?"REGRADE":"GRADE");
    // Keep privacy-safe activity summaries separate from the restricted
    // before/after points ledger; both writes commit with the submission.
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
        hiddenWithoutRegrade:hideOnly,
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

  if (current.assignmentStatus !== "PUBLISHED") {
    throw new CoursesServiceError("ASSIGNMENT_NOT_PUBLISHED");
  }
  if (current.gradingStatus !== "GRADED") {
    throw new CoursesServiceError(
      "ASSIGNMENT_NOT_GRADED",
    );
  }
  if (!facultyAssignmentGradePublicationAllowed(current.assignmentStatus, current.gradingStatus)) {
    throw new CoursesServiceError("ASSIGNMENT_NOT_PUBLISHED");
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
    await assertPersistedFacultyGrader(tx,context,current.deliveryId,current.collegeId,current.organizationId,current.gradedByUserId);
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
    await appendAssignmentGradeEvent(tx,context,current,updated,"PUBLISH_GRADE");
    const gradeEvent = await recordActivityEventInTransaction(tx, context, {
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
    // Send a personal in-app notice to the persisted learner, not a caller ID.
    const [recipient]=await tx.select({userId:collegeMemberships.userId})
      .from(collegeMemberships).innerJoin(users,eq(users.id,collegeMemberships.userId))
      .innerJoin(membershipRoles,and(eq(membershipRoles.membershipId,collegeMemberships.id),
        eq(membershipRoles.role,"LEARNER")))
      .where(and(eq(collegeMemberships.id,updated.membershipId),
        eq(collegeMemberships.collegeId,current.collegeId),
        eq(collegeMemberships.status,"ACTIVE"),eq(users.platformStatus,"ACTIVE"))).limit(1);
    if(recipient){
      const notice=learnerAssignmentPublishedNotice(updated.assignmentId,updated.deliveryId);
      await tx.insert(inAppNotifications).values({
        eventId:gradeEvent.id,userId:recipient.userId,...notice,
      }).onConflictDoNothing();
    }
    return updated;
  });
}

/** Bulk grade publication mirrors the legacy independently counted results.
 * A row failure cannot roll back another learner's successful publication. */
export async function publishAssignmentGradesBatch(
  context: RequestContext,
  items: readonly { submissionId: string; expectedVersion: number }[],
) {
  if (items.length < 1 || items.length > 100) {
    throw new RangeError("Select between 1 and 100 submissions to publish");
  }
  const seen = new Set<string>();
  let published = 0;
  let skippedUngraded = 0;
  let alreadyPublished = 0;
  const failures: { submissionId: string; reason: string }[] = [];
  for (const item of items) {
    if (seen.has(item.submissionId)) {
      failures.push({ submissionId: item.submissionId, reason: "DUPLICATE_SUBMISSION" });
      continue;
    }
    seen.add(item.submissionId);
    try {
      const result = await publishAssignmentGrade(context, item.submissionId, {
        expectedVersion: item.expectedVersion,
      });
      if (result.version === item.expectedVersion) {
        alreadyPublished += 1;
      } else {
        published += 1;
      }
    } catch (error) {
      if (error instanceof CoursesServiceError && error.code === "ASSIGNMENT_NOT_GRADED") {
        skippedUngraded += 1;
      } else {
        failures.push({
          submissionId: item.submissionId,
          reason: error instanceof CoursesServiceError ? error.code : "PUBLISH_FAILED",
        });
      }
    }
  }
  return {
    published,
    skippedUngraded,
    alreadyPublished,
    failed: failures.length,
    failures,
  };
}
