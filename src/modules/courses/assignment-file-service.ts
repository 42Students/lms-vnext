import "server-only";

import { and, eq, inArray } from "drizzle-orm";
import { getDb } from "@/db/client";
import {
  assignmentSubmissionFiles,
  courseUploadReceipts,
} from "@/db/schema/course-upload-receipts-staged";
import type { RequestContext } from "@/modules/identity/context";
import { can } from "@/modules/permissions/policy";
import {
  PrivateObjectStorageError,
  createPrivateUploadGrant,
  createPrivateReadGrant,
  readPrivateObjectAttestation,
} from "@/modules/storage/private-object-storage";
import {
  loadAssignmentSubmissionScope,
  loadCourseAssignmentScope,
} from "./assignment-scope";
import {
  assignmentFileUploadRequestSchema,
  MAX_ASSIGNMENT_FILE_BYTES,
  type AssignmentFileUploadRequest,
} from "./assignment-file-validation";
import {
  assignmentFilesRuntimeEnabled,
} from "./assignment-file-readiness";
import {
  requireDeliveryContentMutation,
  requireLearningReadAccess,
} from "./learning-access";
import { CoursesServiceError } from "./errors";

/** Retain the legacy machine error code while making each scoped upload
 * failure distinguishable for the API presentation layer. No storage keys,
 * foreign receipt IDs or owner details appear in these explanations. */
export type AssignmentReceiptFailureKind=
 |"NOT_FOUND"|"REVOKED"|"USED"|"EXPIRED"|"OBJECT_NOT_READY"
 |"EMPTY_FILE"|"MIME_MISMATCH"|"SIZE_MISMATCH";
export class AssignmentFileReceiptFailure extends CoursesServiceError {
 readonly publicMessage:string;
 constructor(public readonly reason:AssignmentReceiptFailureKind){
  super(reason==="OBJECT_NOT_READY"?"ASSIGNMENT_FILE_NOT_READY":"ASSIGNMENT_UPLOAD_RECEIPT_INVALID");
  const messages:Record<AssignmentReceiptFailureKind,string>={
   NOT_FOUND:"Upload receipt not found.",
   REVOKED:"This upload receipt is no longer valid.",
   USED:"This upload receipt has already been used.",
   EXPIRED:"This upload receipt has expired. Please upload again.",
   OBJECT_NOT_READY:"The uploaded file is not ready. Please try again.",
   EMPTY_FILE:"The uploaded file is empty. Please upload a non-empty file.",
   MIME_MISMATCH:"The uploaded file type does not match the declared type.",
   SIZE_MISMATCH:"The uploaded file size does not match the declared size.",
  };
  this.publicMessage=messages[reason];
 }
}

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

async function requireLearnerFileScope(
  context: RequestContext,
  assignmentId: string,
  deliveryId: string,
) {
  const assignment =
    await loadCourseAssignmentScope(
      assignmentId,
    );
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
    !context.membership ||
    context.membership.status !== "ACTIVE" ||
    !context.membership.roles.includes(
      "LEARNER",
    ) ||
    context.user.platformStatus !==
      "ACTIVE"
  ) {
    throw new CoursesServiceError(
      "LEARNING_ACCESS_DENIED",
    );
  }
  return {
    assignment,
    membership: context.membership,
  };
}

export async function createAssignmentFileUploadGrant(
  context: RequestContext,
  assignmentId: string,
  rawInput: AssignmentFileUploadRequest,
) {
  if (!assignmentFilesRuntimeEnabled()) {
    throw new Error(
      "DB06_ASSIGNMENT_FILES_MIGRATIONS_PENDING",
    );
  }

  const input =
    assignmentFileUploadRequestSchema.parse(
      rawInput,
    );
  const { assignment, membership } =
    await requireLearnerFileScope(
      context,
      assignmentId,
      input.deliveryId,
    );

  const grant =
    await createPrivateUploadGrant({
      collegeId: assignment.collegeId,
      ownerMembershipId:
        membership.id,
      namespace:
        "assignment-submission",
      contentType:
        input.contentType,
      expectedSizeBytes:
        input.sizeBytes,
      maxSizeBytes:
        MAX_ASSIGNMENT_FILE_BYTES,
    });

  const [receipt] = await getDb()
    .insert(courseUploadReceipts)
    .values({
      collegeId: assignment.collegeId,
      ownerMembershipId:
        membership.id,
      purpose:
        "ASSIGNMENT_SUBMISSION",
      assignmentId,
      deliveryId: input.deliveryId,
      lessonContentId: null,
      objectKey: grant.objectKey,
      uploadTokenHash:
        grant.uploadTokenHash,
      originalName:
        input.originalName,
      declaredContentType:
        input.contentType,
      declaredSizeBytes:
        input.sizeBytes,
      expiresAt: grant.expiresAt,
      createdByUserId:
        context.user.id,
    })
    .returning({
      id: courseUploadReceipts.id,
    });

  if (!receipt) {
    throw new Error(
      "ASSIGNMENT_UPLOAD_RECEIPT_CREATE_FAILED",
    );
  }

  return {
    receiptId: receipt.id,
    uploadUrl: grant.uploadUrl,
    method: grant.method,
    expiresAt: grant.expiresAt,
    requiredHeaders:
      grant.requiredHeaders,
    originalName:
      input.originalName,
  };
}

export async function prepareAssignmentFileReceipt(
  context: RequestContext,
  assignmentId: string,
  deliveryId: string,
  receiptId: string,
) {
  if (!assignmentFilesRuntimeEnabled()) {
    throw new Error(
      "DB06_ASSIGNMENT_FILES_MIGRATIONS_PENDING",
    );
  }

  const { assignment, membership } =
    await requireLearnerFileScope(
      context,
      assignmentId,
      deliveryId,
    );

  const [receipt] = await getDb()
    .select()
    .from(courseUploadReceipts)
    .where(
      and(
        eq(
          courseUploadReceipts.id,
          receiptId,
        ),
        eq(
          courseUploadReceipts.assignmentId,
          assignmentId,
        ),
        // Receipt grants are delivery-specific. Never let the learner
        // present a file uploaded for another section or delivery.
        eq(
          courseUploadReceipts.deliveryId,
          deliveryId,
        ),
        eq(
          courseUploadReceipts.ownerMembershipId,
          membership.id,
        ),
        eq(
          courseUploadReceipts.collegeId,
          assignment.collegeId,
        ),
        eq(
          courseUploadReceipts.purpose,
          "ASSIGNMENT_SUBMISSION",
        ),
      ),
    )
    .limit(1);

  // Receipt lookup is already scoped to this learner, college and delivery.
  // Missing/foreign IDs get the same generic not-found reason.
  if(!receipt)throw new AssignmentFileReceiptFailure("NOT_FOUND");
  if(receipt.revoked)throw new AssignmentFileReceiptFailure("REVOKED");
  if(receipt.consumedAt)throw new AssignmentFileReceiptFailure("USED");
  if(receipt.expiresAt.getTime()<=Date.now())
    throw new AssignmentFileReceiptFailure("EXPIRED");

  const attestation =
    await readPrivateObjectAttestation(
      receipt.objectKey,
      {
        collegeId:
          assignment.collegeId,
        ownerMembershipId:
          membership.id,
        uploadTokenHash:
          receipt.uploadTokenHash,
      },
    ).catch(error => {
      if (error instanceof PrivateObjectStorageError && error.code === "PRIVATE_STORAGE_OBJECT_NOT_ATTESTED") {
        throw new AssignmentFileReceiptFailure("OBJECT_NOT_READY");
      }
      throw error;
    });

  // MIME and size are independently actionable. The storage layer's
  // attestation currently rejects missing, empty and unscanned objects
  // together; never falsely describe those unverified cases as zero bytes.
  if(attestation.contentType!==receipt.declaredContentType)
    throw new AssignmentFileReceiptFailure("MIME_MISMATCH");
  if(attestation.sizeBytes!==receipt.declaredSizeBytes)
    throw new AssignmentFileReceiptFailure("SIZE_MISMATCH");

  return {
    receipt,
    attestation,
  };
}


export type AssignmentFileMetadata = {
  originalName: string;
  mimeType: string;
  sizeBytes: number;
};

export async function listAssignmentFileMetadataIfReady(
  submissionIds: readonly string[],
) {
  const result = new Map<
    string,
    AssignmentFileMetadata
  >();
  if (
    !assignmentFilesRuntimeEnabled() ||
    submissionIds.length === 0
  ) {
    return result;
  }

  const rows = await getDb()
    .select({
      submissionId:
        assignmentSubmissionFiles.assignmentSubmissionId,
      originalName:
        assignmentSubmissionFiles.originalName,
      mimeType:
        assignmentSubmissionFiles.mimeType,
      sizeBytes:
        assignmentSubmissionFiles.sizeBytes,
    })
    .from(assignmentSubmissionFiles)
    .where(
      inArray(
        assignmentSubmissionFiles.assignmentSubmissionId,
        [...submissionIds],
      ),
    );

  for (const row of rows) {
    result.set(row.submissionId, {
      originalName: row.originalName,
      mimeType: row.mimeType,
      sizeBytes: row.sizeBytes,
    });
  }
  return result;
}

export async function createAssignmentFileReadGrant(
  context: RequestContext,
  submissionId: string,
) {
  if (!assignmentFilesRuntimeEnabled()) {
    throw new Error(
      "DB06_ASSIGNMENT_FILES_MIGRATIONS_PENDING",
    );
  }

  const submission =
    await loadAssignmentSubmissionScope(
      submissionId,
    );
  const assignment =
    await loadCourseAssignmentScope(
      submission.assignmentId,
      true,
    );

  if (
    context.membership?.id ===
      submission.membershipId &&
    context.membership.status ===
      "ACTIVE" &&
    context.membership.roles.includes(
      "LEARNER",
    )
  ) {
    const access =
      await requireLearningReadAccess(
        context,
        assignment.offeringId,
        submission.deliveryId,
      );
    if (access !== "LEARNER") {
      throw new CoursesServiceError(
        "LEARNING_ACCESS_DENIED",
      );
    }
  } else if (
    can(context, "courses.manage", {
      organizationId:
        submission.organizationId,
      collegeId: submission.collegeId,
    })
  ) {
    // College/Super Admin within persisted scope.
  } else {
    await requireDeliveryContentMutation(
      context,
      submission.deliveryId,
    );
  }

  const [file] = await getDb()
    .select({
      objectKey:
        assignmentSubmissionFiles.objectKey,
      originalName:
        assignmentSubmissionFiles.originalName,
      mimeType:
        assignmentSubmissionFiles.mimeType,
      sizeBytes:
        assignmentSubmissionFiles.sizeBytes,
    })
    .from(assignmentSubmissionFiles)
    .where(
      eq(
        assignmentSubmissionFiles.assignmentSubmissionId,
        submissionId,
      ),
    )
    .limit(1);

  if (!file) {
    throw new CoursesServiceError(
      "ASSIGNMENT_SUBMISSION_NOT_FOUND",
    );
  }

  const grant =
    await createPrivateReadGrant({
      objectKey: file.objectKey,
      collegeId: submission.collegeId,
      ownerMembershipId:
        submission.membershipId,
    }).catch(error => {
      if (error instanceof PrivateObjectStorageError && error.code === "PRIVATE_STORAGE_OBJECT_NOT_ATTESTED") {
        throw new CoursesServiceError("ASSIGNMENT_FILE_NOT_READY");
      }
      throw error;
    });

  return {
    readUrl: grant.readUrl,
    expiresAt: grant.expiresAt,
    originalName: file.originalName,
    mimeType: file.mimeType,
    sizeBytes: file.sizeBytes,
  };
}
