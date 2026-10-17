import "server-only";

import { and, asc, eq, inArray, isNull, ne, sql } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db/client";
import {
  assignmentSubmissionFiles,
  assignmentSubmissions,
  inAppNotifications,
  courseAssignments,
  collegeMemberships,
  membershipRoles,
} from "@/db/schema";
import { recordActivityEventInTransaction } from "@/modules/activity/service";
import { ACTIVITY_EVENT_TYPES } from "@/modules/activity/taxonomy";
import type { RequestContext } from "@/modules/identity/context";
import { can } from "@/modules/permissions/policy";
import { authorizeOrNotFound } from "@/modules/storage/file-access";
import { planCompletion } from "@/modules/storage/file-completion";
import { recordStorageFileEvent } from "@/modules/storage/file-events";
import { StorageFileError } from "@/modules/storage/file-errors";
import {
  FILE_READ_TTL_SECONDS,
  issueObjectReadUrl,
  issueObjectUpload,
  removeStoredObject,
  verifyUploadedObject,
} from "@/modules/storage/file-lifecycle";
import {
  MAX_ASSIGNMENT_FILES_PER_SUBMISSION,
  validateStorageDeclaration,
} from "@/modules/storage/file-policy";
import { loadCourseAssignmentScope, loadAssignmentSubmissionScope } from "./assignment-scope";
import { assertAssignmentSubmissionDeadline } from "./assignment-submission-deadline-policy";
import { multipartAssignmentRuntimeEnabled } from "./assignment-file-readiness";
import {assignmentSubmissionLinks} from "@/db/schema/assignment-submission-links";
import { postgresConstraintName,CoursesServiceError } from "./errors";
import {allowedAssignmentMixedParts} from "./assignment-method-policy";
import {
  requireDeliveryContentMutation,
  requireLearningReadAccess,
} from "./learning-access";
import { courseSectionDeliveryIdSchema } from "./validation";

type FileRow = typeof assignmentSubmissionFiles.$inferSelect;

const idSchema = z.string().uuid();

export const submissionFileUploadInputSchema = z
  .object({
    deliveryId: courseSectionDeliveryIdSchema,
    originalName: z.string().max(255),
    contentType: z.string().max(128),
    sizeBytes: z.number().int(),
  })
  .strict();
export type SubmissionFileUploadInput = z.infer<typeof submissionFileUploadInputSchema>;

export const submitSubmissionFilesInputSchema = z
  .object({
    deliveryId: courseSectionDeliveryIdSchema,
    fileIds: z.array(idSchema).max(MAX_ASSIGNMENT_FILES_PER_SUBMISSION),
    textContent:z.string().trim().max(50000).nullable().optional(),
    links:z.array(z.object({
      kind:z.enum(["REPOSITORY_LINK","EXTERNAL_LINK"]),
      url:z.string().url().max(2048).refine(value=>{
        const parsed=new URL(value);
        return parsed.protocol==="https:"&&!parsed.username&&!parsed.password;
      },"Use a secure HTTPS link."),
      caption:z.string().trim().max(255).default(""),
    }).strict()).max(20).optional().default([]),
  })
  .strict()
  .refine(value=>value.fileIds.length>0 || Boolean(value.textContent?.trim()) || value.links.length>0,{
    message:"Include at least one written, link or file part.",
  })
  .refine((value) => new Set(value.fileIds).size === value.fileIds.length, {
    message: "fileIds must be distinct",
  }).refine(value=>new Set(value.links.map(link=>link.url.toLowerCase())).size===value.links.length,{
    message:"Duplicate submission links are not allowed",
  });
export type SubmitSubmissionFilesInput = z.infer<typeof submitSubmissionFilesInputSchema>;

export function toSubmissionFileDto(row: FileRow) {
  return {
    id: row.id,
    assignmentId: row.assignmentId,
    deliveryId: row.deliveryId,
    submissionId: row.submissionId,
    sequence: row.sequence,
    originalName: row.originalName,
    contentType: row.verifiedContentType ?? row.declaredContentType,
    sizeBytes: row.verifiedSizeBytes ?? row.declaredSizeBytes,
    status: row.status as "UPLOADING" | "VERIFYING" | "READY" | "QUARANTINED" | "FAILED" | "DELETED",
    failureCode: row.failureCode,
    createdAt: row.createdAt.toISOString(),
    completedAt: row.completedAt?.toISOString() ?? null,
  };
}
export type SubmissionFileDto = ReturnType<typeof toSubmissionFileDto>;

async function requireLearnerScope(
  context: RequestContext,
  assignmentId: string,
  deliveryId: string,
) {
  const assignment = await loadCourseAssignmentScope(assignmentId);
  if (assignment.status !== "PUBLISHED" || assignment.learningPathStatus !== "PUBLISHED" || !assignment.lessonVisibleToStudents) {
    throw new StorageFileError("STORAGE_PARENT_NOT_AVAILABLE");
  }
  if (assignment.deliveryId && assignment.deliveryId !== deliveryId) {
    throw new StorageFileError("STORAGE_NOT_FOUND");
  }
  assertAssignmentSubmissionDeadline(assignment.dueAt,new Date());
  const access = await requireLearningReadAccess(context, assignment.offeringId, deliveryId);
  const membership = context.membership;
  if (
    access !== "LEARNER" ||
    !membership ||
    membership.status !== "ACTIVE" ||
    !membership.roles.includes("LEARNER") ||
    context.user.platformStatus !== "ACTIVE" ||
    membership.collegeId !== assignment.collegeId
  ) {
    throw new StorageFileError("STORAGE_NOT_FOUND");
  }
  return { assignment, membership };
}

async function requireNoSubmission(assignmentId: string, membershipId: string) {
  const [existing] = await getDb()
    .select({ id: assignmentSubmissions.id })
    .from(assignmentSubmissions)
    .where(
      and(
        eq(assignmentSubmissions.assignmentId, assignmentId),
        eq(assignmentSubmissions.membershipId, membershipId),
      ),
    )
    .limit(1);
  if (existing) throw new StorageFileError("STORAGE_ALREADY_SUBMITTED");
}

/** Learner step 1: validates the declaration and returns a presigned PUT. */
export async function issueSubmissionFileUploadGrant(
  context: RequestContext,
  assignmentIdInput: string,
  rawInput: SubmissionFileUploadInput,
) {
  const assignmentId = idSchema.parse(assignmentIdInput);
  const input = submissionFileUploadInputSchema.parse(rawInput);
  const declaration = validateStorageDeclaration("assignment-submission", input);
  if (!declaration.ok) throw new StorageFileError(declaration.code);

  const { assignment, membership } = await authorizeOrNotFound(() =>
    requireLearnerScope(context, assignmentId, input.deliveryId),
  );
  await requireNoSubmission(assignmentId, membership.id);

  const grant = await issueObjectUpload({
    collegeId: assignment.collegeId,
    ownerMembershipId: membership.id,
    kind: "assignment-submission",
    contentType: declaration.value.contentType,
    sizeBytes: declaration.value.sizeBytes,
  });

  const row = await getDb().transaction(async (tx) => {
    await tx.execute(
      sql`select pg_advisory_xact_lock(hashtextextended(${`asf:${membership.id}:${assignmentId}`}, 0))`,
    );
    const [{ count }] = (await tx
      .select({ count: sql<number>`count(*)::int` })
      .from(assignmentSubmissionFiles)
      .where(
        and(
          eq(assignmentSubmissionFiles.ownerMembershipId, membership.id),
          eq(assignmentSubmissionFiles.assignmentId, assignmentId),
          eq(assignmentSubmissionFiles.deliveryId, input.deliveryId),
          isNull(assignmentSubmissionFiles.submissionId),
          inArray(assignmentSubmissionFiles.status, ["UPLOADING", "VERIFYING", "READY"]),
        ),
      )) as [{ count: number }];
    if (count >= MAX_ASSIGNMENT_FILES_PER_SUBMISSION) {
      throw new StorageFileError("STORAGE_FILE_LIMIT_REACHED");
    }
    const [created] = await tx
      .insert(assignmentSubmissionFiles)
      .values({
        collegeId: assignment.collegeId,
        assignmentId,
        deliveryId: input.deliveryId,
        ownerMembershipId: membership.id,
        objectKey: grant.objectKey,
        uploadTokenHash: grant.uploadTokenHash,
        uploadExpiresAt: grant.expiresAt,
        originalName: declaration.value.originalName,
        declaredContentType: declaration.value.contentType,
        declaredSizeBytes: declaration.value.sizeBytes,
        createdByUserId: context.user.id,
      })
      .returning();
    await recordStorageFileEvent(tx, context, {
      collegeId: assignment.collegeId,
      subjectKind: "ASSIGNMENT_SUBMISSION_FILE",
      subjectId: created!.id,
      eventType: "UPLOAD_GRANTED",
      detail: { sizeBytes: declaration.value.sizeBytes, contentType: declaration.value.contentType },
    });
    return created!;
  });

  return {
    file: toSubmissionFileDto(row),
    // Same shape the earlier learner UI model validates: receiptId is the file id.
    grant: {
      receiptId: row.id,
      method: grant.method,
      uploadUrl: grant.uploadUrl,
      expiresAt: grant.expiresAt,
      requiredHeaders: grant.requiredHeaders,
      originalName: row.originalName,
    },
  };
}

async function loadOwnedFile(
  context: RequestContext,
  assignmentId: string,
  fileId: string,
) {
  const membership = context.membership;
  if (!membership || membership.status !== "ACTIVE" || context.user.platformStatus !== "ACTIVE") {
    throw new StorageFileError("STORAGE_NOT_FOUND");
  }
  const [row] = await getDb()
    .select()
    .from(assignmentSubmissionFiles)
    .where(
      and(
        eq(assignmentSubmissionFiles.id, idSchema.parse(fileId)),
        eq(assignmentSubmissionFiles.assignmentId, assignmentId),
        eq(assignmentSubmissionFiles.ownerMembershipId, membership.id),
        eq(assignmentSubmissionFiles.collegeId, membership.collegeId),
      ),
    )
    .limit(1);
  if (!row) throw new StorageFileError("STORAGE_NOT_FOUND");
  return row;
}

/** Learner step 2: confirm the browser finished the PUT; verifies and (non-production) attests. */
export async function completeSubmissionFileUpload(
  context: RequestContext,
  assignmentIdInput: string,
  fileIdInput: string,
) {
  const assignmentId = idSchema.parse(assignmentIdInput);
  const row = await loadOwnedFile(context, assignmentId, fileIdInput);
  if (row.status === "READY") return toSubmissionFileDto(row);
  if (row.status !== "UPLOADING" && row.status !== "VERIFYING") {
    throw new StorageFileError("STORAGE_INVALID_STATE");
  }
  if (row.submissionId) throw new StorageFileError("STORAGE_ALREADY_SUBMITTED");

  const outcome = await verifyUploadedObject({
    objectKey: row.objectKey,
    collegeId: row.collegeId,
    ownerMembershipId: row.ownerMembershipId,
    kind: "assignment-submission",
    declaredContentType: row.declaredContentType,
    declaredSizeBytes: row.declaredSizeBytes,
    uploadTokenHash: row.uploadTokenHash,
  });
  const plan = planCompletion(outcome, new Date());

  if (plan.kind === "WAIT") {
    if (row.uploadExpiresAt.getTime() + 60_000 < Date.now()) {
      await getDb()
        .update(assignmentSubmissionFiles)
        .set({ status: "FAILED", failureCode: "STORAGE_UPLOAD_EXPIRED", updatedAt: new Date() })
        .where(and(eq(assignmentSubmissionFiles.id, row.id), eq(assignmentSubmissionFiles.status, row.status)));
      throw new StorageFileError("STORAGE_UPLOAD_EXPIRED");
    }
    throw new StorageFileError("STORAGE_UPLOAD_NOT_FOUND");
  }

  const updated = await getDb().transaction(async (tx) => {
    const [next] = await tx
      .update(assignmentSubmissionFiles)
      .set({
        status: plan.status,
        ...plan.fields,
        sha256Hex: plan.sha256Hex,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(assignmentSubmissionFiles.id, row.id),
          inArray(assignmentSubmissionFiles.status, ["UPLOADING", "VERIFYING"]),
        ),
      )
      .returning();
    if (!next) throw new StorageFileError("STORAGE_INVALID_STATE");
    await recordStorageFileEvent(tx, context, {
      collegeId: row.collegeId,
      subjectKind: "ASSIGNMENT_SUBMISSION_FILE",
      subjectId: row.id,
      eventType: plan.event,
      detail: { status: plan.status, failureCode: plan.fields.failureCode },
    });
    if (plan.status === "READY") {
      await recordStorageFileEvent(tx, context, {
        collegeId: row.collegeId,
        subjectKind: "ASSIGNMENT_SUBMISSION_FILE",
        subjectId: row.id,
        eventType: "SCAN_ATTESTED",
        detail: { attestedBy: plan.fields.scanAttestedBy },
      });
    }
    return next;
  });
  if (plan.deleteObject) await removeStoredObject(row.objectKey);
  if (plan.status === "QUARANTINED") throw new StorageFileError("STORAGE_CONTENT_REJECTED");
  if (plan.status === "FAILED") throw new StorageFileError("STORAGE_UPLOAD_MISMATCH");
  return toSubmissionFileDto(updated);
}

/** Learner: files staged or submitted for one assignment and delivery. */
export async function listMySubmissionFiles(
  context: RequestContext,
  assignmentIdInput: string,
  deliveryIdInput: string,
) {
  const assignmentId = idSchema.parse(assignmentIdInput);
  const deliveryId = courseSectionDeliveryIdSchema.parse(deliveryIdInput);
  const { membership } = await authorizeOrNotFound(async () => {
    const assignment = await loadCourseAssignmentScope(assignmentId, true);
    const access = await requireLearningReadAccess(context, assignment.offeringId, deliveryId, {
      includeHistorical: true,
    });
    if (access !== "LEARNER" || !context.membership) {
      throw new StorageFileError("STORAGE_NOT_FOUND");
    }
    return { assignment, membership: context.membership };
  });
  const rows = await getDb()
    .select()
    .from(assignmentSubmissionFiles)
    .where(
      and(
        eq(assignmentSubmissionFiles.ownerMembershipId, membership.id),
        eq(assignmentSubmissionFiles.assignmentId, assignmentId),
        eq(assignmentSubmissionFiles.deliveryId, deliveryId),
        ne(assignmentSubmissionFiles.status, "DELETED"),
      ),
    )
    .orderBy(asc(assignmentSubmissionFiles.createdAt));
  return rows.map(toSubmissionFileDto);
}

/** Learner: remove a staged file that has not been submitted. */
export async function removeStagedSubmissionFile(
  context: RequestContext,
  assignmentIdInput: string,
  fileIdInput: string,
) {
  const assignmentId = idSchema.parse(assignmentIdInput);
  const row = await loadOwnedFile(context, assignmentId, fileIdInput);
  if (row.submissionId) throw new StorageFileError("STORAGE_ALREADY_SUBMITTED");
  if (row.status === "DELETED") return toSubmissionFileDto(row);

  const updated = await getDb().transaction(async (tx) => {
    const [next] = await tx
      .update(assignmentSubmissionFiles)
      .set({
        status: "DELETED",
        deletedAt: new Date(),
        deletedByUserId: context.user.id,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(assignmentSubmissionFiles.id, row.id),
          isNull(assignmentSubmissionFiles.submissionId),
          ne(assignmentSubmissionFiles.status, "DELETED"),
        ),
      )
      .returning();
    if (!next) throw new StorageFileError("STORAGE_INVALID_STATE");
    await recordStorageFileEvent(tx, context, {
      collegeId: row.collegeId,
      subjectKind: "ASSIGNMENT_SUBMISSION_FILE",
      subjectId: row.id,
      eventType: "DELETED",
    });
    return next;
  });
  await removeStoredObject(row.objectKey);
  return toSubmissionFileDto(updated);
}

/**
 * Learner step 3: creates the FILE submission and binds the chosen READY
 * files to it in one transaction. A deferred database trigger additionally
 * guarantees every FILE submission has at least one READY file at commit.
 */
export async function submitAssignmentWithFiles(
  context: RequestContext,
  assignmentIdInput: string,
  rawInput: SubmitSubmissionFilesInput,
) {
  const assignmentId = idSchema.parse(assignmentIdInput);
  const input = submitSubmissionFilesInputSchema.parse(rawInput);
  const multipart=Boolean(input.textContent?.trim()||input.links.length);

  const { assignment, membership } = await authorizeOrNotFound(() =>
    requireLearnerScope(context, assignmentId, input.deliveryId),
  );
  await requireNoSubmission(assignmentId, membership.id);

  try {
    return await getDb().transaction(async (tx) => {
      const [current] = await tx
        .select({ status: courseAssignments.status, deliveryId: courseAssignments.deliveryId, dueAt: courseAssignments.dueAt })
        .from(courseAssignments)
        .where(eq(courseAssignments.id, assignmentId))
        .for("share")
        .limit(1);
      if (!current || current.status !== "PUBLISHED") {
        throw new StorageFileError("STORAGE_PARENT_NOT_AVAILABLE");
      }
      if (current.deliveryId && current.deliveryId !== input.deliveryId) {
        throw new StorageFileError("STORAGE_NOT_FOUND");
      }
      assertAssignmentSubmissionDeadline(current.dueAt,new Date());

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
        .where(and(eq(membershipRoles.membershipId, membership.id), eq(membershipRoles.role, "LEARNER")))
        .for("share")
        .limit(1);
      if (
        !persistedMembership ||
        !learnerRole ||
        persistedMembership.userId !== context.user.id ||
        persistedMembership.collegeId !== assignment.collegeId ||
        persistedMembership.status !== "ACTIVE"
      ) {
        throw new StorageFileError("STORAGE_NOT_FOUND");
      }

      const files = await tx
        .select()
        .from(assignmentSubmissionFiles)
        .where(
          and(
            inArray(assignmentSubmissionFiles.id, input.fileIds),
            eq(assignmentSubmissionFiles.ownerMembershipId, membership.id),
            eq(assignmentSubmissionFiles.assignmentId, assignmentId),
            eq(assignmentSubmissionFiles.deliveryId, input.deliveryId),
          ),
        )
        .for("update");
      if (files.length !== input.fileIds.length) {
        throw new StorageFileError("STORAGE_NOT_FOUND");
      }
      if (files.some((file) => file.status !== "READY" || file.submissionId !== null)) {
        throw new StorageFileError("STORAGE_FILE_NOT_READY");
      }
      {
        const [policy]=await tx.select({
          methods:courseAssignments.allowedSubmissionMethods,
        }).from(courseAssignments).where(eq(courseAssignments.id,assignmentId)).limit(1);
        if(!policy||!allowedAssignmentMixedParts(policy.methods,{
          hasWrittenResponse:Boolean(input.textContent?.trim()),
          links:input.links,
          fileMimeTypes:files.map(file=>file.verifiedContentType??file.declaredContentType),
        }))throw new CoursesServiceError("ASSIGNMENT_METHOD_NOT_ALLOWED");
      }
      const byId = new Map(files.map((file) => [file.id, file]));

      const [submission] = await tx
        .insert(assignmentSubmissions)
        .values({
          assignmentId,
          deliveryId: input.deliveryId,
          membershipId: membership.id,
          submissionType: "FILE",
          textContent:multipart?(input.textContent?.trim()||null):null,
          submissionUrl:multipart?(input.links[0]?.url??null):null,
        })
        .returning();

      // Only execute against registered DB06. Persist all link parts in the
      // same transaction as the one-shot submission and bound READY files.
      if(multipart){
        for(const [sequence,link] of input.links.entries()){
          await tx.insert(assignmentSubmissionLinks).values({
            submissionId:submission!.id,sequence,kind:link.kind,url:link.url,caption:link.caption,
          });
        }
      }
      const bound: FileRow[] = [];
      for (const [index, fileId] of input.fileIds.entries()) {
        const [updated] = await tx
          .update(assignmentSubmissionFiles)
          .set({ submissionId: submission!.id, sequence: index, updatedAt: new Date() })
          .where(and(eq(assignmentSubmissionFiles.id, byId.get(fileId)!.id), isNull(assignmentSubmissionFiles.submissionId)))
          .returning();
        if (!updated) throw new StorageFileError("STORAGE_FILE_NOT_READY");
        bound.push(updated);
        await recordStorageFileEvent(tx, context, {
          collegeId: assignment.collegeId,
          subjectKind: "ASSIGNMENT_SUBMISSION_FILE",
          subjectId: updated.id,
          eventType: "SUBMITTED",
          detail: { sequence: index },
        });
      }

      const submissionEvent=await recordActivityEventInTransaction(tx, context, {
        eventType: ACTIVITY_EVENT_TYPES.COURSES_ASSIGNMENT_SUBMITTED,
        collegeId: assignment.collegeId,
        organizationId: assignment.organizationId,
        subjectType: "course_assignment",
        subjectId: assignmentId,
        summary: "Learner submitted assignment",
        metadata: {
          submissionId: submission!.id,
          deliveryId: input.deliveryId,
          submissionType: "FILE",
          fileCount: bound.length,
          ...(multipart?{hasText:Boolean(input.textContent?.trim()),linkCount:input.links.length}:{}),
        },
        dedupeKey: `assignment-submission:${submission!.id}:submitted`,
      });
      await tx.insert(inAppNotifications).values({
        userId:context.user.id,eventId:submissionEvent.id,
        title:"Assignment submitted",
        body:"Your assignment submission was recorded. You can review it while waiting for a grade.",
        actionHref:"/learn/allAssignments/"+encodeURIComponent(assignmentId)+
          "?deliveryId="+encodeURIComponent(input.deliveryId),
      }).onConflictDoNothing();

      return {
        submission: {
          id: submission!.id,
          assignmentId,
          deliveryId: input.deliveryId,
          submissionType: "FILE" as const,
          submittedAt: submission!.submittedAt.toISOString(),
        },
        files: bound.map(toSubmissionFileDto),
      };
    });
  } catch (error) {
    if (postgresConstraintName(error) === "assignment_submissions_assignment_membership_uq") {
      throw new StorageFileError("STORAGE_ALREADY_SUBMITTED");
    }
    throw error;
  }
}

async function authorizeFileRead(context: RequestContext, row: FileRow) {
  const assignment = await loadCourseAssignmentScope(row.assignmentId, true);
  if (assignment.collegeId !== row.collegeId) throw new StorageFileError("STORAGE_NOT_FOUND");
  const membership = context.membership;
  if (
    membership &&
    membership.id === row.ownerMembershipId &&
    membership.status === "ACTIVE" &&
    context.user.platformStatus === "ACTIVE"
  ) {
    const access = await requireLearningReadAccess(context, assignment.offeringId, row.deliveryId, {
      includeHistorical: true,
    });
    if (access !== "LEARNER") throw new StorageFileError("STORAGE_NOT_FOUND");
    return "OWNER" as const;
  }
  // Staged (unsubmitted) files are private to the learner.
  if (!row.submissionId) throw new StorageFileError("STORAGE_NOT_FOUND");
  if (can(context, "courses.manage", { organizationId: assignment.organizationId, collegeId: assignment.collegeId })) {
    return "ADMIN" as const;
  }
  await requireDeliveryContentMutation(context, row.deliveryId);
  return "FACULTY" as const;
}

/**
 * Download grant for a submitted or staged file. POST because it appends an
 * audit event; the returned URL is short lived and never stored.
 */
export async function issueSubmissionFileDownloadGrant(
  context: RequestContext,
  fileIdInput: string,
  options: { disposition?: "inline" | "attachment" } = {},
) {
  const fileId = idSchema.parse(fileIdInput);
  const [row] = await getDb()
    .select()
    .from(assignmentSubmissionFiles)
    .where(eq(assignmentSubmissionFiles.id, fileId))
    .limit(1);
  if (!row) throw new StorageFileError("STORAGE_NOT_FOUND");
  await authorizeOrNotFound(() => authorizeFileRead(context, row));
  if (
    row.status !== "READY" ||
    row.scanStatus !== "CLEAN" ||
    !row.objectGeneration ||
    row.verifiedSizeBytes === null ||
    !row.verifiedContentType
  ) {
    throw new StorageFileError(row.status === "DELETED" ? "STORAGE_NOT_FOUND" : "STORAGE_FILE_NOT_READY");
  }
  const disposition =
    options.disposition === "inline" && /^(application\/pdf|image\/(png|jpeg|webp))$/.test(row.verifiedContentType)
      ? "inline"
      : "attachment";
  const grant = await issueObjectReadUrl(
    {
      objectKey: row.objectKey,
      collegeId: row.collegeId,
      ownerMembershipId: row.ownerMembershipId,
      generation: row.objectGeneration,
      sizeBytes: row.verifiedSizeBytes,
      contentType: row.verifiedContentType,
    },
    {
      ttlSeconds: FILE_READ_TTL_SECONDS,
      maxTtlSeconds: 15 * 60,
      disposition,
      fileName: row.originalName,
    },
  );
  await recordStorageFileEvent(getDb(), context, {
    collegeId: row.collegeId,
    subjectKind: "ASSIGNMENT_SUBMISSION_FILE",
    subjectId: row.id,
    eventType: "DOWNLOAD_GRANTED",
    detail: { disposition },
  });
  return {
    url: grant.url,
    expiresAt: grant.expiresAt.toISOString(),
    expiresInSeconds: grant.expiresInSeconds,
    file: toSubmissionFileDto(row),
  };
}

/** Files of one submission for the learner who owns it, faculty and admins. */
export async function listSubmissionFiles(context: RequestContext, submissionIdInput: string) {
  const submissionId = idSchema.parse(submissionIdInput);
  const rows = await authorizeOrNotFound(async () => {
    const submission = await loadAssignmentSubmissionScope(submissionId);
    const probe = {
      assignmentId: submission.assignmentId,
      deliveryId: submission.deliveryId,
      ownerMembershipId: submission.membershipId,
      collegeId: submission.collegeId,
      submissionId,
    } as FileRow;
    await authorizeFileRead(context, probe);
    return getDb()
      .select()
      .from(assignmentSubmissionFiles)
      .where(
        and(
          eq(assignmentSubmissionFiles.submissionId, submissionId),
          ne(assignmentSubmissionFiles.status, "DELETED"),
        ),
      )
      .orderBy(asc(assignmentSubmissionFiles.sequence));
  });
  return rows.map(toSubmissionFileDto);
}

/** Typed links for the same audience as the submitted private files. */
export async function listAssignmentSubmissionLinks(context:RequestContext,submissionIdInput:string){
 const submissionId=idSchema.parse(submissionIdInput);
 await listSubmissionFiles(context,submissionId);

 return getDb().select({
  id:assignmentSubmissionLinks.id,kind:assignmentSubmissionLinks.kind,
  url:assignmentSubmissionLinks.url,caption:assignmentSubmissionLinks.caption,
  sequence:assignmentSubmissionLinks.sequence,
 }).from(assignmentSubmissionLinks)
  .where(eq(assignmentSubmissionLinks.submissionId,submissionId))
  .orderBy(asc(assignmentSubmissionLinks.sequence)).limit(20);
}
