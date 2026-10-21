import {
  and,
  asc,
  desc,
  eq,
  isNull,
  sql,
} from "drizzle-orm";
import { getDb } from "@/db/client";
import { assertAssignmentSubmissionDeadline } from "./assignment-submission-deadline-policy";
import {allowedAssignmentSubmissionPart} from "./assignment-method-policy";
import {facultyAssignmentGradingAllowed,facultyAssignmentGradePublicationAllowed} from "./faculty-assignment-grading-policy";
import {facultyRegradeFeedbackAllowed} from "./faculty-regrade-feedback-model";
import {facultyGradeHasChanges} from "./faculty-grade-noop-model";
import { recordActivityEventInTransaction } from "@/modules/activity/service";
import { ACTIVITY_EVENT_TYPES } from "@/modules/activity/taxonomy";
import {
  assignmentSubmissions,
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

  try {
    return await getDb().transaction(async (tx) => {
      // Hold a shared lock until the submission commits: a faculty ARCHIVE
      // update waits, while different learners can submit concurrently.
      const [currentAssignment] = await tx
        .select({
          status: courseAssignments.status,
          deliveryId: courseAssignments.deliveryId,
          dueAt: courseAssignments.dueAt,
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
      {
        const [policy]=await tx.select({methods:courseAssignments.allowedSubmissionMethods})
          .from(courseAssignments).where(eq(courseAssignments.id,assignmentId)).limit(1);
        if(!policy||!allowedAssignmentSubmissionPart(policy.methods,{
          kind:input.submissionType,
          linkKind:input.submissionType==="LINK"?input.linkKind:undefined,
          fileMimeTypes:input.submissionType==="FILE"?
            [preparedFile?.attestation.contentType??""]:[],
        }))throw new CoursesServiceError("ASSIGNMENT_METHOD_NOT_ALLOWED");
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
          receipt.deliveryId !== input.deliveryId ||
          receipt.expiresAt.getTime() <=
            Date.now() ||
          // DB06 requires a privileged CLEAN scan and retained attestation.
          receipt.scanStatus !== "CLEAN" ||
          receipt.scanAttestedBy !== "lms-vnext-privileged-scanner" ||
          !receipt.scanAttestedAt ||
          receipt.scanAttestedAt.getTime() > Date.now() ||
          !receipt.retentionUntil ||
          receipt.retentionUntil.getTime() < Date.now() ||
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
        const consumedAt = new Date();
        // Consume the locked receipt before the attested file row. The
        // composite FK binds the file to this exact consumption snapshot.
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
            consumedAt,
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
              isNull(courseUploadReceipts.consumedAt),
              sql`${courseUploadReceipts.expiresAt} > now()`,
              eq(courseUploadReceipts.revoked, false),
              eq(courseUploadReceipts.scanStatus, "CLEAN"),
              eq(courseUploadReceipts.scanAttestedBy, "lms-vnext-privileged-scanner"),
              sql`${courseUploadReceipts.scanAttestedAt} <= ${consumedAt}`,
              sql`${courseUploadReceipts.retentionUntil} >= ${consumedAt}`,
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

/** Confirm Faculty teaching scope inside the grading transaction, not merely
 * from a stale request context. Admin scoping remains centrally permissioned. */
async function assertPersistedFacultyGrader(
  tx: Pick<ReturnType<typeof getDb>, "select">,
  context: RequestContext,
  deliveryId: string,
  collegeId: string,
  organizationId: string,
) {
  if (can(context, "courses.manage", {collegeId, organizationId})) return;
  const membership = context.membership;
  if (!membership || membership.collegeId !== collegeId)
    throw new CoursesServiceError("FACULTY_TEACHING_SCOPE_REQUIRED");
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
  const gradeChanged=facultyGradeHasChanges(current,input);
  const hideOnly=input.hidePublished===true && current.gradePublished && !gradeChanged;
  if(!gradeChanged&&!hideOnly)
    throw new CoursesServiceError("ASSIGNMENT_GRADE_NO_CHANGE");
  if(!hideOnly&&!facultyRegradeFeedbackAllowed(current.gradePublished,input.feedback))
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
    await assertPersistedFacultyGrader(tx,context,current.deliveryId,current.collegeId,current.organizationId);
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
    await assertPersistedFacultyGrader(tx,context,current.deliveryId,current.collegeId,current.organizationId);
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
