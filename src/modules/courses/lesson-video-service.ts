import "server-only";

import { and, asc, desc, eq, isNotNull, isNull, ne, or, sql } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db/client";
import { learnerContentProgress, lessonContents, lessonVideoAssets, collegeMemberships } from "@/db/schema";
import { isSuperAdmin, type RequestContext } from "@/modules/identity/context";
import { can } from "@/modules/permissions/policy";
import { authorizeOrNotFound } from "@/modules/storage/file-access";
import { planCompletion, videoStatusForPlan } from "@/modules/storage/file-completion";
import { recordStorageFileEvent, type StorageEventType } from "@/modules/storage/file-events";
import { StorageFileError } from "@/modules/storage/file-errors";
import {
  FILE_READ_TTL_SECONDS,
  VIDEO_PLAYBACK_DEFAULT_TTL_SECONDS,
  VIDEO_PLAYBACK_MAX_TTL_SECONDS,
  issueObjectReadUrl,
  issueObjectUpload,
  removeStoredObject,
  verifyUploadedObject,
} from "@/modules/storage/file-lifecycle";
import {
  MAX_VIDEOS_PER_LESSON_DELIVERY,
  MAX_VIDEO_BYTES,
  MAX_VIDEO_DURATION_SECONDS,
  validateStorageDeclaration,
} from "@/modules/storage/file-policy";
import { CoursesServiceError } from "./errors";
import { requireDeliveryContentMutation, requireLearningReadAccess } from "./learning-access";
import {
  clampPlaybackTtlSeconds,
  videoCanBeReplaced,
  videoCanBePublished,
  videoPlayableForStaff,
  videoPublishTransitionAllowed,
  videoVisibleToLearner,
} from "./lesson-video-policy";
import {
  loadCourseLessonScope,
  loadCourseSectionDeliveryScope,
  loadLessonContentScope,
} from "./scope";

/** Legacy remote-URL imports were a browser-to-backend fetch. They cannot be
 * reenabled by forwarding arbitrary URLs: the old flow lacks DNS/IP SSRF
 * pinning, a bounded download worker and object-scan attestations. The only
 * currently authorized path is a size-checked private signed PUT followed by
 * asynchronous READY/FAILED/QUARANTINED verification.
 * Do not claim legacy import benchmark or success while disabled. */
export const LESSON_VIDEO_IMPORT_POLICY={
 remoteUrlImportEnabled:false,
 privateSignedUploadEnabled:true,
 requiresScannerAttestation:true,
 requiresDeclaredByteLimit:true,
 cleanupRetainsAuditRows:true,
 operatorMessage:"Remote URL import is unavailable. Upload a verified file directly; publishing is enabled only after the scan completes.",
} as const;
/** Legacy remote URL imports remain disabled until a bounded, scanned worker
 * exists. Expose only the safe progress/status and declared size ceiling for
 * asynchronous signed uploads. Never expose object keys or grant URLs here. */
export function lessonVideoUploadFeedback(row: {
  processingStatus: string;
  scanStatus: string;
}) {
  if (row.processingStatus === "READY") return {
    phase: "READY" as const,
    message: "Video is verified and ready to publish.",
    maxUploadBytes: MAX_VIDEO_BYTES,
  };
  if (row.processingStatus === "FAILED" || row.processingStatus === "BLOCKED") return {
    phase: "FAILED" as const,
    message: row.scanStatus === "REJECTED"
      ? "Video failed the security scan. Upload a different file."
      : "Video could not be verified. Upload the file again.",
    maxUploadBytes: MAX_VIDEO_BYTES,
  };
  return {
    phase: row.processingStatus === "UPLOADING" ? "UPLOADING" as const : "VERIFYING" as const,
    message: row.processingStatus === "UPLOADING"
      ? "Upload the file using the signed link, then confirm completion."
      : "Video is being verified. It cannot be published until scanning finishes.",
    maxUploadBytes: MAX_VIDEO_BYTES,
  };
}
type VideoRow = typeof lessonVideoAssets.$inferSelect;

/** Signed-storage operations require a persisted college membership owner.
 * Historical platform-user-only provenance is not a substitute for a
 * membership in private object authorization or scan attestation.
 */
function requirePersistedVideoUploaderMembership(row:VideoRow):string{
 const owner=row.uploaderMembershipId;
 if(!owner)throw new StorageFileError("STORAGE_UPLOADER_MEMBERSHIP_REQUIRED");
 return owner;
}

const idSchema = z.string().uuid();
const durationSchema = z.number().int().min(1).max(MAX_VIDEO_DURATION_SECONDS);

export const videoUploadInputSchema = z
  .object({
    title: z.string().trim().min(1).max(255),
    originalName: z.string().max(255),
    contentType: z.string().max(128),
    sizeBytes: z.number().int(),
    durationSeconds: durationSchema.nullable().optional(),
    /** Required for faculty; null/omitted means every delivery (college administrators only). */
    deliveryId: idSchema.nullable().optional(),
    lessonContentId: idSchema.nullable().optional(),
    /** Starts a replacement of this video; the old one is retired when the new one is verified. */
    replaceVideoId: idSchema.optional(),
  })
  .strict();
export type VideoUploadInput = z.infer<typeof videoUploadInputSchema>;

export const videoUpdateInputSchema = z
  .object({
    title: z.string().trim().min(1).max(255).optional(),
    durationSeconds: durationSchema.nullable().optional(),
    sequence: z.number().int().min(0).max(10000).optional(),
    publishStatus: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).optional(),
    visibleToStudents: z.boolean().optional(),
    lessonContentId: idSchema.nullable().optional(),
  })
  .strict()
  .refine((value) => Object.values(value).some((entry) => entry !== undefined), {
    message: "Nothing to update",
  });
export type VideoUpdateInput = z.infer<typeof videoUpdateInputSchema>;

export const thumbnailUploadInputSchema = z
  .object({
    originalName: z.string().max(255),
    contentType: z.string().max(128),
    sizeBytes: z.number().int(),
  })
  .strict();
export type ThumbnailUploadInput = z.infer<typeof thumbnailUploadInputSchema>;

export const playbackInputSchema = z
  .object({
    deliveryId: idSchema,
    ttlSeconds: z.number().int().min(60).max(VIDEO_PLAYBACK_MAX_TTL_SECONDS).optional(),
  })
  .strict();
export type PlaybackInput = z.infer<typeof playbackInputSchema>;

export function toVideoDto(row: VideoRow) {
  return {
    id: row.id,
    lessonId: row.lessonId,
    deliveryId: row.deliveryId,
    lessonContentId: row.lessonContentId,
    title: row.title,
    sequence: row.sequence,
    publishStatus: row.publishStatus as "DRAFT" | "PUBLISHED" | "ARCHIVED",
    visibleToStudents: row.visibleToStudents,
    processingStatus: row.processingStatus as "UPLOADING" | "PROCESSING" | "READY" | "FAILED" | "BLOCKED",
    durationSeconds: row.durationSeconds,
    originalName: row.originalName,
    contentType: row.verifiedContentType ?? row.declaredContentType,
    sizeBytes: row.verifiedSizeBytes ?? row.declaredSizeBytes,
    thumbnailStatus: row.thumbnailStatus as "NONE" | "UPLOADING" | "READY",
    replacesVideoId: row.replacesAssetId,
    failureCode: row.failureCode,
    uploadFeedback: lessonVideoUploadFeedback(row),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    completedAt: row.completedAt?.toISOString() ?? null,
  };
}
export type VideoDto = ReturnType<typeof toVideoDto>;

/** Learner-facing projection: no internal state, scope ids or failure details. */
export function toLearnerVideoDto(row: VideoRow) {
  return {
    id: row.id,
    lessonId: row.lessonId,
    lessonContentId: row.lessonContentId,
    title: row.title,
    sequence: row.sequence,
    durationSeconds: row.durationSeconds,
    contentType: row.verifiedContentType ?? row.declaredContentType,
    hasThumbnail: row.thumbnailStatus === "READY",
  };
}

async function requireManage(
  context: RequestContext,
  lesson: Awaited<ReturnType<typeof loadCourseLessonScope>>,
  deliveryId: string | null,
) {
  if (can(context, "courses.manage", { organizationId: lesson.organizationId, collegeId: lesson.collegeId })) {
    return "ADMIN" as const;
  }
  if (!deliveryId) throw new StorageFileError("STORAGE_FORBIDDEN");
  const delivery = await loadCourseSectionDeliveryScope(deliveryId, true);
  if (delivery.offeringId !== lesson.offeringId) {
    throw new CoursesServiceError("CONTENT_DELIVERY_MISMATCH");
  }
  return requireDeliveryContentMutation(context, deliveryId);
}

async function requireUploader(context: RequestContext, collegeId: string) {
  const membership=context.membership;
  if(context.user.platformStatus!=="ACTIVE")
    throw new StorageFileError("STORAGE_UPLOADER_MEMBERSHIP_REQUIRED");
  if(membership?.status==="ACTIVE"&&membership.collegeId===collegeId)
    return membership;
  // Acting Super Admin permissions grant authoring, but private storage
  // ownership remains a persisted college membership; never manufacture an
  // uploader ID from a global platform role.
  if(!isSuperAdmin(context)||context.adminScope?.collegeId!==collegeId)
    throw new StorageFileError("STORAGE_UPLOADER_MEMBERSHIP_REQUIRED");
  const [persisted]=await getDb().select({id:collegeMemberships.id})
   .from(collegeMemberships).where(and(
    eq(collegeMemberships.userId,context.user.id),
    eq(collegeMemberships.collegeId,collegeId),
    eq(collegeMemberships.status,"ACTIVE"),
   )).limit(1);
  if(!persisted)throw new StorageFileError("STORAGE_UPLOADER_MEMBERSHIP_REQUIRED");
  return persisted;
}

async function loadVideo(videoId: string) {
  const [row] = await getDb()
    .select()
    .from(lessonVideoAssets)
    .where(eq(lessonVideoAssets.id, idSchema.parse(videoId)))
    .limit(1);
  if (!row || row.deletedAt) throw new StorageFileError("STORAGE_NOT_FOUND");
  return row;
}

/** Loads the asset and proves the caller may manage it (admin or teaching faculty). */
async function loadManagedVideo(context: RequestContext, videoId: string) {
  const row = await loadVideo(videoId);
  const lesson = await authorizeOrNotFound(() => loadCourseLessonScope(row.lessonId, true));
  if (lesson.collegeId !== row.collegeId) throw new StorageFileError("STORAGE_NOT_FOUND");
  await authorizeOrNotFound(() => requireManage(context, lesson, row.deliveryId));
  return { row, lesson };
}

async function assertContentLink(
  lessonId: string,
  deliveryId: string | null,
  lessonContentId: string,
) {
  const content = await authorizeOrNotFound(() => loadLessonContentScope(lessonContentId));
  if (content.contentType !== "VIDEO" || content.lessonId !== lessonId) {
    throw new StorageFileError("STORAGE_NOT_FOUND");
  }
  if (content.deliveryId && content.deliveryId !== deliveryId) {
    throw new StorageFileError("STORAGE_NOT_FOUND");
  }
}

/** Instructor step 1: validate and return a presigned PUT for a new (or replacement) video. */
export async function issueVideoUploadGrant(
  context: RequestContext,
  lessonIdInput: string,
  rawInput: VideoUploadInput,
) {
  const lessonId = idSchema.parse(lessonIdInput);
  const input = videoUploadInputSchema.parse(rawInput);
  const declaration = validateStorageDeclaration("lesson-video", input);
  if (!declaration.ok) throw new StorageFileError(declaration.code);

  const lesson = await authorizeOrNotFound(() => loadCourseLessonScope(lessonId));
  const deliveryId = input.deliveryId ?? null;
  await requireManage(context, lesson, deliveryId);
  const uploader = await requireUploader(context, lesson.collegeId);

  let replaced: VideoRow | null = null;
  if (input.replaceVideoId) {
    replaced = await loadVideo(input.replaceVideoId);
    if (replaced.lessonId !== lessonId || replaced.deliveryId !== deliveryId) {
      throw new StorageFileError("STORAGE_NOT_FOUND");
    }
    if (!videoCanBeReplaced({ processingStatus: replaced.processingStatus as never, deleted: false })) {
      throw new StorageFileError("STORAGE_INVALID_STATE");
    }
  }
  const lessonContentId = input.lessonContentId ?? replaced?.lessonContentId ?? null;
  if (lessonContentId) await assertContentLink(lessonId, deliveryId, lessonContentId);

  const grant = await issueObjectUpload({
    collegeId: lesson.collegeId,
    ownerMembershipId: uploader.id,
    kind: "lesson-video",
    contentType: declaration.value.contentType,
    sizeBytes: declaration.value.sizeBytes,
  });

  const row = await getDb().transaction(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(hashtextextended(${`lva:${lessonId}`}, 0))`);
    const scopeFilter = and(
      eq(lessonVideoAssets.lessonId, lessonId),
      deliveryId ? eq(lessonVideoAssets.deliveryId, deliveryId) : isNull(lessonVideoAssets.deliveryId),
      isNull(lessonVideoAssets.deletedAt),
    );
    const [{ count, maxSequence }] = (await tx
      .select({
        count: sql<number>`count(*)::int`,
        maxSequence: sql<number>`coalesce(max(${lessonVideoAssets.sequence}), -1)::int`,
      })
      .from(lessonVideoAssets)
      .where(and(scopeFilter, ne(lessonVideoAssets.publishStatus, "ARCHIVED")))) as [
      { count: number; maxSequence: number },
    ];
    if (!replaced && count >= MAX_VIDEOS_PER_LESSON_DELIVERY) {
      throw new StorageFileError("STORAGE_FILE_LIMIT_REACHED");
    }
    const [created] = await tx
      .insert(lessonVideoAssets)
      .values({
        collegeId: lesson.collegeId,
        lessonId,
        deliveryId,
        lessonContentId,
        uploaderMembershipId: uploader.id,
        title: input.title,
        sequence: replaced ? replaced.sequence : maxSequence + 1,
        durationSeconds: input.durationSeconds ?? replaced?.durationSeconds ?? null,
        objectKey: grant.objectKey,
        uploadTokenHash: grant.uploadTokenHash,
        uploadExpiresAt: grant.expiresAt,
        originalName: declaration.value.originalName,
        declaredContentType: declaration.value.contentType,
        declaredSizeBytes: declaration.value.sizeBytes,
        replacesAssetId: replaced?.id ?? null,
        createdByUserId: context.user.id,
      })
      .returning();
    await recordStorageFileEvent(tx, context, {
      collegeId: lesson.collegeId,
      subjectKind: "LESSON_VIDEO",
      subjectId: created!.id,
      eventType: "UPLOAD_GRANTED",
      detail: {
        sizeBytes: declaration.value.sizeBytes,
        contentType: declaration.value.contentType,
        replaces: replaced?.id ?? null,
      },
    });
    return created!;
  });

  return {
    video: toVideoDto(row),
    grant: {
      videoId: row.id,
      method: grant.method,
      uploadUrl: grant.uploadUrl,
      expiresAt: grant.expiresAt,
      requiredHeaders: grant.requiredHeaders,
      originalName: row.originalName,
    },
  };
}

/** Instructor step 2: confirm the PUT finished; verifies, attests (non-production) and finishes a replacement. */
export async function completeVideoUpload(context: RequestContext, videoIdInput: string) {
  const { row } = await loadManagedVideo(context, videoIdInput);
  if (row.processingStatus === "READY") return toVideoDto(row);
  if (row.processingStatus !== "UPLOADING" && row.processingStatus !== "PROCESSING") {
    throw new StorageFileError("STORAGE_INVALID_STATE");
  }

  const outcome = await verifyUploadedObject({
    objectKey: row.objectKey,
    collegeId: row.collegeId,
    ownerMembershipId: requirePersistedVideoUploaderMembership(row),
    kind: "lesson-video",
    declaredContentType: row.declaredContentType,
    declaredSizeBytes: row.declaredSizeBytes,
    uploadTokenHash: row.uploadTokenHash,
  });
  const plan = planCompletion(outcome, new Date());

  if (plan.kind === "WAIT") {
    if (row.uploadExpiresAt.getTime() + 60_000 < Date.now()) {
      await getDb()
        .update(lessonVideoAssets)
        .set({ processingStatus: "FAILED", failureCode: "STORAGE_UPLOAD_EXPIRED", updatedAt: new Date() })
        .where(and(eq(lessonVideoAssets.id, row.id), eq(lessonVideoAssets.processingStatus, row.processingStatus)));
      throw new StorageFileError("STORAGE_UPLOAD_EXPIRED");
    }
    throw new StorageFileError("STORAGE_UPLOAD_NOT_FOUND");
  }

  const retiredKeys: string[] = [];
  const updated = await getDb().transaction(async (tx) => {
    const [next] = await tx
      .update(lessonVideoAssets)
      .set({
        processingStatus: videoStatusForPlan(plan.status),
        ...plan.fields,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(lessonVideoAssets.id, row.id),
          or(eq(lessonVideoAssets.processingStatus, "UPLOADING"), eq(lessonVideoAssets.processingStatus, "PROCESSING")),
        ),
      )
      .returning();
    if (!next) throw new StorageFileError("STORAGE_INVALID_STATE");
    await recordStorageFileEvent(tx, context, {
      collegeId: row.collegeId,
      subjectKind: "LESSON_VIDEO",
      subjectId: row.id,
      eventType: plan.event,
      detail: { status: plan.status, failureCode: plan.fields.failureCode },
    });
    if (plan.status !== "READY") return next;

    await recordStorageFileEvent(tx, context, {
      collegeId: row.collegeId,
      subjectKind: "LESSON_VIDEO",
      subjectId: row.id,
      eventType: "SCAN_ATTESTED",
      detail: { attestedBy: plan.fields.scanAttestedBy },
    });
    if (!row.replacesAssetId) return next;

    // The verified replacement takes over publication and ordering from the
    // video it retires, in the same transaction.
    const [old] = await tx
      .select()
      .from(lessonVideoAssets)
      .where(and(eq(lessonVideoAssets.id, row.replacesAssetId), isNull(lessonVideoAssets.deletedAt)))
      .for("update")
      .limit(1);
    if (!old) return next;
    await tx
      .update(lessonVideoAssets)
      .set({
        deletedAt: new Date(),
        deletedByUserId: context.user.id,
        publishStatus: "ARCHIVED",
        updatedAt: new Date(),
      })
      .where(eq(lessonVideoAssets.id, old.id));
    retiredKeys.push(old.objectKey);
    if (old.thumbnailObjectKey) retiredKeys.push(old.thumbnailObjectKey);
    const [inherited] = await tx
      .update(lessonVideoAssets)
      .set({
        publishStatus: old.publishStatus === "ARCHIVED" ? "DRAFT" : old.publishStatus,
        visibleToStudents: old.visibleToStudents,
        lessonContentId: old.lessonContentId ?? next.lessonContentId,
        sequence: old.sequence,
        updatedAt: new Date(),
      })
      .where(eq(lessonVideoAssets.id, row.id))
      .returning();
    await recordStorageFileEvent(tx, context, {
      collegeId: row.collegeId,
      subjectKind: "LESSON_VIDEO",
      subjectId: row.id,
      eventType: "REPLACED",
      detail: { replaced: old.id },
    });
    return inherited ?? next;
  });
  for (const key of retiredKeys) await removeStoredObject(key);
  if (plan.deleteObject) await removeStoredObject(row.objectKey);
  if (plan.status === "QUARANTINED") throw new StorageFileError("STORAGE_CONTENT_REJECTED");
  if (plan.status === "FAILED") throw new StorageFileError("STORAGE_UPLOAD_MISMATCH");
  return toVideoDto(updated);
}

/** Instructor or admin: videos of one lesson including drafts and in-flight uploads. */
export async function listLessonVideosForManagement(
  context: RequestContext,
  lessonIdInput: string,
  deliveryIdInput: string | null,
) {
  const lessonId = idSchema.parse(lessonIdInput);
  const deliveryId = deliveryIdInput ? idSchema.parse(deliveryIdInput) : null;
  const lesson = await authorizeOrNotFound(() => loadCourseLessonScope(lessonId, true));
  await authorizeOrNotFound(() => requireManage(context, lesson, deliveryId));
  const rows = await getDb()
    .select()
    .from(lessonVideoAssets)
    .where(
      and(
        eq(lessonVideoAssets.lessonId, lessonId),
        isNull(lessonVideoAssets.deletedAt),
        deliveryId
          ? or(eq(lessonVideoAssets.deliveryId, deliveryId), isNull(lessonVideoAssets.deliveryId))
          : undefined,
      ),
    )
    .orderBy(asc(lessonVideoAssets.sequence), asc(lessonVideoAssets.createdAt));
  return rows.map(toVideoDto);
}

/** Instructor or admin: edit metadata, ordering, visibility and publication. */
export async function updateLessonVideo(
  context: RequestContext,
  videoIdInput: string,
  rawInput: VideoUpdateInput,
) {
  const input = videoUpdateInputSchema.parse(rawInput);
  const { row } = await loadManagedVideo(context, videoIdInput);
  if (input.lessonContentId) await assertContentLink(row.lessonId, row.deliveryId, input.lessonContentId);

  const current = row.publishStatus as "DRAFT" | "PUBLISHED" | "ARCHIVED";
  const nextPublish = input.publishStatus ?? current;
  if (!videoPublishTransitionAllowed(current, nextPublish)) {
    throw new StorageFileError("STORAGE_INVALID_STATE");
  }
  if (
    nextPublish === "PUBLISHED" &&
    current !== "PUBLISHED" &&
    !videoCanBePublished({
      processingStatus: row.processingStatus as never,
      scanStatus: row.scanStatus as never,
      deleted: false,
    })
  ) {
    throw new StorageFileError("STORAGE_FILE_NOT_READY");
  }

  const events: StorageEventType[] = ["UPDATED"];
  if (input.publishStatus && input.publishStatus !== current) {
    events.push(input.publishStatus === "PUBLISHED" ? "PUBLISHED" : "UNPUBLISHED");
  }
  const updated = await getDb().transaction(async (tx) => {
    const [next] = await tx
      .update(lessonVideoAssets)
      .set({
        ...(input.title !== undefined ? { title: input.title } : {}),
        ...(input.durationSeconds !== undefined ? { durationSeconds: input.durationSeconds } : {}),
        ...(input.sequence !== undefined ? { sequence: input.sequence } : {}),
        ...(input.publishStatus !== undefined ? { publishStatus: input.publishStatus } : {}),
        ...(input.visibleToStudents !== undefined ? { visibleToStudents: input.visibleToStudents } : {}),
        ...(input.lessonContentId !== undefined ? { lessonContentId: input.lessonContentId } : {}),
        updatedAt: new Date(),
      })
      .where(and(eq(lessonVideoAssets.id, row.id), isNull(lessonVideoAssets.deletedAt)))
      .returning();
    if (!next) throw new StorageFileError("STORAGE_NOT_FOUND");
    // Legacy VideoDrawer updated the lesson content itself: keep the linked
    // lesson content title in step with the managed video title.
    const linkedContentId = next.lessonContentId;
    if (input.title !== undefined && linkedContentId && input.title !== row.title) {
      await tx.update(lessonContents).set({
        title: input.title, version: sql`${lessonContents.version} + 1`, updatedAt: new Date(),
      }).where(and(eq(lessonContents.id, linkedContentId), ne(lessonContents.status, "ARCHIVED")));
    }
    for (const eventType of events) {
      await recordStorageFileEvent(tx, context, {
        collegeId: row.collegeId,
        subjectKind: "LESSON_VIDEO",
        subjectId: row.id,
        eventType,
        detail: { publishStatus: next.publishStatus, visibleToStudents: next.visibleToStudents },
      });
    }
    return next;
  });
  return toVideoDto(updated);
}

/** Instructor or admin: soft delete (row kept for audit); stored objects are removed best-effort. */
export async function removeLessonVideo(context: RequestContext, videoIdInput: string) {
  const { row } = await loadManagedVideo(context, videoIdInput);
  await getDb().transaction(async (tx) => {
    const [next] = await tx
      .update(lessonVideoAssets)
      .set({
        deletedAt: new Date(),
        deletedByUserId: context.user.id,
        publishStatus: "ARCHIVED",
        updatedAt: new Date(),
      })
      .where(and(eq(lessonVideoAssets.id, row.id), isNull(lessonVideoAssets.deletedAt)))
      .returning();
    if (!next) throw new StorageFileError("STORAGE_NOT_FOUND");
    // Legacy teacher delete removed the lesson content itself. Retire the linked
    // lesson content in the same transaction (unless another live video still
    // uses it) so learners are never left with a published item whose video is gone.
    if (row.lessonContentId) {
      const [otherVideo] = await tx.select({ id: lessonVideoAssets.id }).from(lessonVideoAssets)
        .where(and(eq(lessonVideoAssets.lessonContentId, row.lessonContentId),
          ne(lessonVideoAssets.id, row.id), isNull(lessonVideoAssets.deletedAt))).limit(1);
      if (!otherVideo) {
        await tx.update(lessonContents).set({
          status: "ARCHIVED", version: sql`${lessonContents.version} + 1`, updatedAt: new Date(),
        }).where(and(eq(lessonContents.id, row.lessonContentId), ne(lessonContents.status, "ARCHIVED")));
      }
    }
    await recordStorageFileEvent(tx, context, {
      collegeId: row.collegeId,
      subjectKind: "LESSON_VIDEO",
      subjectId: row.id,
      eventType: "DELETED",
    });
  });
  await removeStoredObject(row.objectKey);
  if (row.thumbnailObjectKey) await removeStoredObject(row.thumbnailObjectKey);
  return { id: row.id, deleted: true as const };
}

/** Retry best-effort object cleanup after a previously authorized delete.
 * The historical row, uploader and storage event remain for audit; no new
 * deletion event is forged, and no active video can be removed by this path.
 * An operator may safely replay cleanup if the original backend deletion
 * succeeded but cloud storage was temporarily unavailable. */
export async function retryDeletedLessonVideoObjectCleanup(
 context:RequestContext,videoIdInput:string,
){
 const id=idSchema.parse(videoIdInput);
 const [row]=await getDb().select().from(lessonVideoAssets)
  .where(and(eq(lessonVideoAssets.id,id),isNotNull(lessonVideoAssets.deletedAt)))
  .limit(1);
 if(!row||!row.deletedAt)throw new StorageFileError("STORAGE_NOT_FOUND");
 const lesson=await authorizeOrNotFound(()=>loadCourseLessonScope(row.lessonId,true));
 if(lesson.collegeId!==row.collegeId)throw new StorageFileError("STORAGE_NOT_FOUND");
 await authorizeOrNotFound(()=>requireManage(context,lesson,row.deliveryId));
 await removeStoredObject(row.objectKey);
 if(row.thumbnailObjectKey)await removeStoredObject(row.thumbnailObjectKey);
 return {id:row.id,cleanupRetried:true as const,historyRetained:true as const};
}

/** Instructor or admin: optional thumbnail image (JPEG, PNG or WebP up to 5 MiB). */
export async function issueVideoThumbnailUploadGrant(
  context: RequestContext,
  videoIdInput: string,
  rawInput: ThumbnailUploadInput,
) {
  const input = thumbnailUploadInputSchema.parse(rawInput);
  const declaration = validateStorageDeclaration("lesson-video-thumbnail", input);
  if (!declaration.ok) throw new StorageFileError(declaration.code);
  const { row } = await loadManagedVideo(context, videoIdInput);
  const grant = await issueObjectUpload({
    collegeId: row.collegeId,
    ownerMembershipId: requirePersistedVideoUploaderMembership(row),
    kind: "lesson-video-thumbnail",
    contentType: declaration.value.contentType,
    sizeBytes: declaration.value.sizeBytes,
  });
  const previousKey = row.thumbnailObjectKey;
  const updated = await getDb().transaction(async (tx) => {
    const [next] = await tx
      .update(lessonVideoAssets)
      .set({
        thumbnailStatus: "UPLOADING",
        thumbnailObjectKey: grant.objectKey,
        thumbnailUploadTokenHash: grant.uploadTokenHash,
        thumbnailUploadExpiresAt: grant.expiresAt,
        thumbnailContentType: declaration.value.contentType,
        thumbnailSizeBytes: declaration.value.sizeBytes,
        thumbnailGeneration: null,
        updatedAt: new Date(),
      })
      .where(and(eq(lessonVideoAssets.id, row.id), isNull(lessonVideoAssets.deletedAt)))
      .returning();
    if (!next) throw new StorageFileError("STORAGE_NOT_FOUND");
    await recordStorageFileEvent(tx, context, {
      collegeId: row.collegeId,
      subjectKind: "LESSON_VIDEO",
      subjectId: row.id,
      eventType: "THUMBNAIL_GRANTED",
      detail: { sizeBytes: declaration.value.sizeBytes, contentType: declaration.value.contentType },
    });
    return next;
  });
  if (previousKey) await removeStoredObject(previousKey);
  return {
    video: toVideoDto(updated),
    grant: {
      videoId: row.id,
      method: grant.method,
      uploadUrl: grant.uploadUrl,
      expiresAt: grant.expiresAt,
      requiredHeaders: grant.requiredHeaders,
      originalName: declaration.value.originalName,
    },
  };
}

export async function completeVideoThumbnailUpload(context: RequestContext, videoIdInput: string) {
  const { row } = await loadManagedVideo(context, videoIdInput);
  if (row.thumbnailStatus === "READY") return toVideoDto(row);
  if (
    row.thumbnailStatus !== "UPLOADING" ||
    !row.thumbnailObjectKey ||
    !row.thumbnailUploadTokenHash ||
    !row.thumbnailContentType ||
    !row.thumbnailSizeBytes
  ) {
    throw new StorageFileError("STORAGE_INVALID_STATE");
  }
  const outcome = await verifyUploadedObject({
    objectKey: row.thumbnailObjectKey,
    collegeId: row.collegeId,
    ownerMembershipId: requirePersistedVideoUploaderMembership(row),
    kind: "lesson-video-thumbnail",
    declaredContentType: row.thumbnailContentType,
    declaredSizeBytes: row.thumbnailSizeBytes,
    uploadTokenHash: row.thumbnailUploadTokenHash,
  });
  const plan = planCompletion(outcome, new Date());
  if (plan.kind === "WAIT") throw new StorageFileError("STORAGE_UPLOAD_NOT_FOUND");
  // Outside production a thumbnail is usable once attested; in production it
  // stays UPLOADING (never served) until a scanner records a verdict.
  if (plan.status === "VERIFYING") return toVideoDto(row);
  if (plan.status !== "READY") {
    await getDb()
      .update(lessonVideoAssets)
      .set({
        thumbnailStatus: "NONE",
        thumbnailObjectKey: null,
        thumbnailUploadTokenHash: null,
        thumbnailUploadExpiresAt: null,
        thumbnailContentType: null,
        thumbnailSizeBytes: null,
        thumbnailGeneration: null,
        updatedAt: new Date(),
      })
      .where(eq(lessonVideoAssets.id, row.id));
    await removeStoredObject(row.thumbnailObjectKey);
    throw new StorageFileError(plan.status === "QUARANTINED" ? "STORAGE_CONTENT_REJECTED" : "STORAGE_UPLOAD_MISMATCH");
  }
  const updated = await getDb().transaction(async (tx) => {
    const [next] = await tx
      .update(lessonVideoAssets)
      .set({
        thumbnailStatus: "READY",
        thumbnailGeneration: plan.fields.objectGeneration,
        updatedAt: new Date(),
      })
      .where(and(eq(lessonVideoAssets.id, row.id), eq(lessonVideoAssets.thumbnailStatus, "UPLOADING")))
      .returning();
    if (!next) throw new StorageFileError("STORAGE_INVALID_STATE");
    await recordStorageFileEvent(tx, context, {
      collegeId: row.collegeId,
      subjectKind: "LESSON_VIDEO",
      subjectId: row.id,
      eventType: "THUMBNAIL_COMPLETED",
    });
    return next;
  });
  return toVideoDto(updated);
}

type LessonScope = Awaited<ReturnType<typeof loadCourseLessonScope>>;

async function learnerVisibility(row: VideoRow, lesson: LessonScope) {
  if (!lesson.visibleToStudents) return false;
  let content: { status: "DRAFT" | "PUBLISHED" | "ARCHIVED"; visibleToStudents: boolean } | null = null;
  if (row.lessonContentId) {
    const [linked] = await getDb()
      .select({ status: lessonContents.status, visibleToStudents: lessonContents.visibleToStudents })
      .from(lessonContents)
      .where(eq(lessonContents.id, row.lessonContentId))
      .limit(1);
    // A dangling link must hide the video rather than expose it.
    content = linked ?? { status: "ARCHIVED", visibleToStudents: false };
  }
  return videoVisibleToLearner({
    processingStatus: row.processingStatus as never,
    scanStatus: row.scanStatus as never,
    publishStatus: row.publishStatus as never,
    visibleToStudents: row.visibleToStudents,
    deleted: row.deletedAt !== null,
    learningPathStatus: lesson.learningPathStatus,
    content,
  });
}

/**
 * Enrolled learners see only verified, published and visible videos. Staff
 * (admin or teaching faculty of the delivery) see the same learner projection
 * here; they use the management list to see drafts.
 */
export async function listLessonVideosForViewer(
  context: RequestContext,
  lessonIdInput: string,
  deliveryIdInput: string,
) {
  const lessonId = idSchema.parse(lessonIdInput);
  const deliveryId = idSchema.parse(deliveryIdInput);
  const lesson = await authorizeOrNotFound(() => loadCourseLessonScope(lessonId));
  await authorizeOrNotFound(() => requireLearningReadAccess(context, lesson.offeringId, deliveryId));
  const rows = await getDb()
    .select()
    .from(lessonVideoAssets)
    .where(
      and(
        eq(lessonVideoAssets.lessonId, lessonId),
        isNull(lessonVideoAssets.deletedAt),
        or(eq(lessonVideoAssets.deliveryId, deliveryId), isNull(lessonVideoAssets.deliveryId)),
      ),
    )
    .orderBy(asc(lessonVideoAssets.sequence), desc(lessonVideoAssets.createdAt));
  const visible: VideoRow[] = [];
  for (const row of rows) {
    if (await learnerVisibility(row, lesson)) visible.push(row);
  }
  return visible.map(toLearnerVideoDto);
}

/**
 * Short-lived presigned GET for playback. POST because every grant is
 * audited; the URL is returned once and never stored. R2 presigned GET URLs
 * honour HTTP Range requests, so browsers can seek and resume without a
 * proxy. When the video backs a lesson content row, the learner's saved
 * position is returned as resumePositionSeconds.
 */
export async function issueVideoPlaybackGrant(
  context: RequestContext,
  videoIdInput: string,
  rawInput: PlaybackInput,
) {
  const input = playbackInputSchema.parse(rawInput);
  const [row] = await getDb()
    .select()
    .from(lessonVideoAssets)
    .where(eq(lessonVideoAssets.id, idSchema.parse(videoIdInput)))
    .limit(1);
  if (!row || row.deletedAt) throw new StorageFileError("STORAGE_NOT_FOUND");
  if (row.deliveryId && row.deliveryId !== input.deliveryId) throw new StorageFileError("STORAGE_NOT_FOUND");

  const { lesson, access } = await authorizeOrNotFound(async () => {
    const lessonScope = await loadCourseLessonScope(row.lessonId);
    if (lessonScope.collegeId !== row.collegeId) throw new StorageFileError("STORAGE_NOT_FOUND");
    const mode = await requireLearningReadAccess(context, lessonScope.offeringId, input.deliveryId);
    return { lesson: lessonScope, access: mode };
  });

  if (access === "LEARNER") {
    if (!(await learnerVisibility(row, lesson))) throw new StorageFileError("STORAGE_NOT_FOUND");
  } else if (
    !videoPlayableForStaff({
      processingStatus: row.processingStatus as never,
      scanStatus: row.scanStatus as never,
      deleted: false,
    })
  ) {
    throw new StorageFileError("STORAGE_FILE_NOT_READY");
  }
  if (!row.objectGeneration || row.verifiedSizeBytes === null || !row.verifiedContentType) {
    throw new StorageFileError("STORAGE_FILE_NOT_READY");
  }

  const ttl = clampPlaybackTtlSeconds(
    input.ttlSeconds,
    VIDEO_PLAYBACK_DEFAULT_TTL_SECONDS,
    VIDEO_PLAYBACK_MAX_TTL_SECONDS,
  );
  const grant = await issueObjectReadUrl(
    {
      objectKey: row.objectKey,
      collegeId: row.collegeId,
      ownerMembershipId: requirePersistedVideoUploaderMembership(row),
      generation: row.objectGeneration,
      sizeBytes: row.verifiedSizeBytes,
      contentType: row.verifiedContentType,
    },
    { ttlSeconds: ttl, maxTtlSeconds: VIDEO_PLAYBACK_MAX_TTL_SECONDS },
  );

  let thumbnailUrl: string | null = null;
  if (
    row.thumbnailStatus === "READY" &&
    row.thumbnailObjectKey &&
    row.thumbnailGeneration &&
    row.thumbnailSizeBytes &&
    row.thumbnailContentType
  ) {
    try {
      thumbnailUrl = (
        await issueObjectReadUrl(
          {
            objectKey: row.thumbnailObjectKey,
            collegeId: row.collegeId,
            ownerMembershipId: requirePersistedVideoUploaderMembership(row),
            generation: row.thumbnailGeneration,
            sizeBytes: row.thumbnailSizeBytes,
            contentType: row.thumbnailContentType,
          },
          { ttlSeconds: FILE_READ_TTL_SECONDS, maxTtlSeconds: 15 * 60 },
        )
      ).url;
    } catch {
      thumbnailUrl = null; // a missing poster must never block playback
    }
  }

  let resumePositionSeconds = 0;
  if (access === "LEARNER" && row.lessonContentId && context.membership) {
    const [progress] = await getDb()
      .select({ lastPositionSeconds: learnerContentProgress.lastPositionSeconds })
      .from(learnerContentProgress)
      .where(
        and(
          eq(learnerContentProgress.membershipId, context.membership.id),
          eq(learnerContentProgress.lessonContentId, row.lessonContentId),
        ),
      )
      .limit(1);
    resumePositionSeconds = progress?.lastPositionSeconds ?? 0;
  }

  await recordStorageFileEvent(getDb(), context, {
    collegeId: row.collegeId,
    subjectKind: "LESSON_VIDEO",
    subjectId: row.id,
    eventType: "PLAYBACK_GRANTED",
    detail: { mode: access, ttlSeconds: grant.expiresInSeconds },
  });

  return {
    url: grant.url,
    expiresAt: grant.expiresAt.toISOString(),
    expiresInSeconds: grant.expiresInSeconds,
    contentType: row.verifiedContentType,
    sizeBytes: row.verifiedSizeBytes,
    durationSeconds: row.durationSeconds,
    supportsRange: true as const,
    resumePositionSeconds,
    thumbnailUrl,
    video: toLearnerVideoDto(row),
  };
}

/** Super Admin's selected college may request a short-lived inline playback
 * grant only for a video already linked to an authorized course delivery.
 * Reuse the learner/staff playback access checks; no raw R2 key is returned.
 */
export async function issueSuperAdminContentVideoPlaybackGrant(
 context:RequestContext,rawVideoId:unknown,rawDeliveryId:unknown,
){
 if(!isSuperAdmin(context)||context.user.platformStatus!=="ACTIVE"||
    !context.adminScope?.collegeId)
   throw new StorageFileError("STORAGE_FORBIDDEN");
 const videoId=idSchema.parse(rawVideoId);
 const deliveryId=idSchema.parse(rawDeliveryId);
 const row=await loadVideo(videoId);
 if(row.collegeId!==context.adminScope.collegeId)
   throw new StorageFileError("STORAGE_NOT_FOUND");
 return issueVideoPlaybackGrant(context,videoId,{deliveryId});
}
