import "server-only";

import { createHash, randomUUID } from "node:crypto";
import { and, eq, sql } from "drizzle-orm";
import { getDb } from "@/db/client";
import { courses } from "@/db/schema";
import { courseDisplayContents } from "@/db/schema/course-display-staged";
import type { RequestContext } from "@/modules/identity/context";
import { can, requirePermission } from "@/modules/permissions/policy";
import { createPrivateUploadGrant, readPrivateObjectAttestation } from "@/modules/storage/private-object-storage";
import { getPrivateR2Config } from "@/modules/storage/r2-config";
import { deleteObject, getObjectStream, headObject } from "@/modules/storage/s3-client";
import { devAttestationAllowed, verifyUploadedObject } from "@/modules/storage/file-lifecycle";
import { validateStorageDeclaration } from "@/modules/storage/file-policy";
import { recordActivityEventInTransaction } from "@/modules/activity/service";
import { ACTIVITY_EVENT_TYPES } from "@/modules/activity/taxonomy";
import { courseDisplayRuntimeEnabled } from "./course-display-readiness";
import { loadCourseScope } from "./scope";
import { courseIdSchema } from "./validation";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const IMAGE_MIMES = new Set(["image/jpeg", "image/png", "image/webp"]);
const IMAGE_PATH = /^private\/[a-f0-9-]{36}\/[a-f0-9-]{36}\/course-resource\/[a-f0-9-]{36}$/i;
type Receipt = {
  id: string; key: string; ownerMembershipId: string; contentType: string;
  sizeBytes: number; tokenHash: string; status: "UPLOADING" | "VERIFYING" | "READY";
  expiresAt: string; generation?: string; etag?: string;
};
type ImageState = { active: Receipt | null; pending: Receipt | null };

export class CourseImageError extends Error {
  constructor(readonly code: string, readonly status: number) {
    super(code); this.name = "CourseImageError";
  }
}
function fail(code: string, status: number): never { throw new CourseImageError(code, status); }
function receipt(raw: unknown): Receipt | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const row = raw as Record<string, unknown>;
  if (typeof row["id"] !== "string" || !/^[a-f0-9-]{36}$/i.test(row["id"]) ||
      typeof row["key"] !== "string" ||
      !IMAGE_PATH.test(row["key"]) || typeof row["ownerMembershipId"] !== "string" ||
      typeof row["tokenHash"] !== "string" || !/^[a-f0-9]{64}$/.test(row["tokenHash"]) ||
      typeof row["contentType"] !== "string" || !IMAGE_MIMES.has(row["contentType"]) ||
      typeof row["sizeBytes"] !== "number" || row["sizeBytes"] < 1 ||
      row["sizeBytes"] > MAX_IMAGE_BYTES || typeof row["expiresAt"] !== "string" ||
      !Number.isFinite(Date.parse(row["expiresAt"])) ||
      !row["key"].includes("/" + row["ownerMembershipId"] + "/") ||
      !["UPLOADING", "VERIFYING", "READY"].includes(String(row["status"]))) return null;
  return row as unknown as Receipt;
}
function state(meta: Record<string, unknown> | null): ImageState {
  const value = meta?.["courseCoverAsset"];
  const row = value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown> : {};
  return { active: receipt(row["active"]), pending: receipt(row["pending"]) };
}
function nextMeta(meta: Record<string, unknown> | null, value: ImageState) {
  return { ...(meta ?? {}), courseCoverAsset: value };
}
function urlFor(courseId: string) {
  return "/api/courses/" + encodeURIComponent(courseId) + "/image";
}
async function authorize(context: RequestContext, rawId: string, manage: boolean) {
  const id = courseIdSchema.parse(rawId);
  const scope = await loadCourseScope(id);
  if (manage) {
    requirePermission(context, "courses.manage", {
      collegeId: scope.collegeId, organizationId: scope.organizationId,
    });
  } else {
    const ownCollegeMember = context.membership?.status === "ACTIVE" &&
      context.membership.collegeId === scope.collegeId;
    if (context.user.platformStatus !== "ACTIVE" ||
        !ownCollegeMember && !context.user.systemRoles.includes("SUPER_ADMIN"))
      fail("COURSE_IMAGE_NOT_FOUND", 404);
    if (!ownCollegeMember) requirePermission(context, "courses.read", {
      collegeId: scope.collegeId, organizationId: scope.organizationId,
    });
    if ((!scope.enabled || scope.legacyAllowedForDisplay === 0) &&
        !can(context, "courses.manage", {
          collegeId: scope.collegeId, organizationId: scope.organizationId,
        })) fail("COURSE_IMAGE_NOT_FOUND", 404);
  }
  if (!courseDisplayRuntimeEnabled()) fail("DB05_COURSE_DISPLAY_MIGRATIONS_PENDING", 503);
  return scope;
}
function uploader(context: RequestContext, collegeId: string) {
  const membership = context.membership;
  if (!membership || membership.status !== "ACTIVE" || membership.collegeId !== collegeId)
    fail("COURSE_IMAGE_UPLOADER_MEMBERSHIP_REQUIRED", 403);
  return membership.id;
}
async function safelyDelete(key: string | undefined) {
  if (key && IMAGE_PATH.test(key)) {
    try { await deleteObject(getPrivateR2Config(), key); } catch { /* Orphans are never referenced. */ }
  }
}
function safeError(error: unknown): never {
  if (error instanceof CourseImageError) throw error;
  fail("COURSE_IMAGE_STORAGE_UNAVAILABLE", 503);
}

/** The persisted pending receipt lives in courses.legacyMetadata, so no new
 * polymorphic file table or global storage namespace is needed. Never return
 * its key, token hash, or owner membership to the browser. */
export async function grantCourseImage(context: RequestContext, rawId: string, raw: unknown) {
  const scope = await authorize(context, rawId, true);
  const ownerMembershipId = uploader(context, scope.collegeId);
  const declaration = raw && typeof raw === "object" && !Array.isArray(raw)
    ? raw as Record<string, unknown> : {};
  if (Object.keys(declaration).some(key =>
    !["originalName", "contentType", "sizeBytes"].includes(key)))
    fail("INVALID_REQUEST", 400);
  if (typeof declaration["originalName"] !== "string" ||
      typeof declaration["contentType"] !== "string" ||
      typeof declaration["sizeBytes"] !== "number") fail("INVALID_REQUEST", 400);
  const parsed = validateStorageDeclaration("lesson-video-thumbnail", {
    originalName: declaration["originalName"],
    contentType: declaration["contentType"],
    sizeBytes: declaration["sizeBytes"],
  });
  if (!parsed.ok) fail(parsed.code, parsed.code === "STORAGE_FILE_TOO_LARGE" ? 413 : 400);
  let grant: Awaited<ReturnType<typeof createPrivateUploadGrant>>;
  try {
    grant = await createPrivateUploadGrant({
      collegeId: scope.collegeId, ownerMembershipId, namespace: "course-resource",
      contentType: parsed.value.contentType, expectedSizeBytes: parsed.value.sizeBytes,
      maxSizeBytes: MAX_IMAGE_BYTES,
    });
  } catch (error) { return safeError(error); }
  const pending: Receipt = {
    id: randomUUID(), key: grant.objectKey, ownerMembershipId,
    contentType: parsed.value.contentType, sizeBytes: parsed.value.sizeBytes,
    tokenHash: grant.uploadTokenHash, expiresAt: grant.expiresAt.toISOString(),
    status: "UPLOADING",
  };
  let oldPending: string | undefined;
  try {
    await getDb().transaction(async tx => {
      const [locked] = await tx.select({
        status: courses.status, departmentId: courses.departmentId,
        legacyMetadata: courses.legacyMetadata,
      }).from(courses).where(and(eq(courses.id, scope.id),
        eq(courses.departmentId, scope.departmentId))).for("update").limit(1);
      if (!locked || locked.status !== "ACTIVE") fail("COURSE_IMAGE_NOT_FOUND", 404);
      const previous = state(locked.legacyMetadata);
      oldPending = previous.pending?.key;
      await tx.update(courses).set({
        legacyMetadata: nextMeta(locked.legacyMetadata, {
          active: previous.active, pending,
        }),
      }).where(eq(courses.id, scope.id));
    });
  } catch (error) {
    await safelyDelete(grant.objectKey);
    throw error;
  }
  if (oldPending !== grant.objectKey) await safelyDelete(oldPending);
  return {
    receiptId: pending.id, method: "PUT" as const, uploadUrl: grant.uploadUrl,
    expiresAt: grant.expiresAt.toISOString(), requiredHeaders: grant.requiredHeaders,
  };
}

async function verifiedReceipt(pending: Receipt, collegeId: string) {
  const expected = {
    objectKey: pending.key, collegeId, ownerMembershipId: pending.ownerMembershipId,
    kind: "lesson-video-thumbnail" as const, declaredContentType: pending.contentType,
    declaredSizeBytes: pending.sizeBytes, uploadTokenHash: pending.tokenHash,
  };
  const head = await headObject(getPrivateR2Config(), pending.key);
  if (!head) fail("COURSE_IMAGE_UPLOAD_NOT_FOUND", 409);
  if (!devAttestationAllowed() &&
      (pending.status === "VERIFYING" || head.metadata["malware-scan-status"] === "CLEAN")) {
    try {
      const scan = await readPrivateObjectAttestation(pending.key, {
        collegeId, ownerMembershipId: pending.ownerMembershipId,
        uploadTokenHash: pending.tokenHash,
      });
      if (scan.sizeBytes !== pending.sizeBytes || scan.contentType !== pending.contentType)
        fail("COURSE_IMAGE_UPLOAD_MISMATCH", 409);
      return { status: "READY" as const, generation: scan.generation, etag: head.etag };
    } catch (error) {
      if (error instanceof CourseImageError) throw error;
      return { status: "VERIFYING" as const };
    }
  }
  const outcome = await verifyUploadedObject(expected);
  if (outcome.outcome === "NOT_UPLOADED") fail("COURSE_IMAGE_UPLOAD_NOT_FOUND", 409);
  if (outcome.outcome === "MISMATCH" || outcome.outcome === "QUARANTINED")
    fail("COURSE_IMAGE_UPLOAD_MISMATCH", 409);
  return { status: outcome.outcome, generation: outcome.generation, etag: head.etag };
}

/** Rechecks the private object and scanner verdict before atomically swapping
 * the active thumbnail. The previously visible image survives failed uploads. */
export async function completeCourseImage(context: RequestContext, rawId: string, receiptId: string) {
  const scope = await authorize(context, rawId, true);
  uploader(context, scope.collegeId);
  const outcome = {
    oldKey: undefined as string | undefined,
    status: "VERIFYING" as "READY" | "VERIFYING",
  };
  try {
    await getDb().transaction(async tx => {
      const [locked] = await tx.select({
        status: courses.status, departmentId: courses.departmentId,
        legacyMetadata: courses.legacyMetadata,
      }).from(courses).where(and(eq(courses.id, scope.id),
        eq(courses.departmentId, scope.departmentId))).for("update").limit(1);
      if (!locked || locked.status !== "ACTIVE") fail("COURSE_IMAGE_NOT_FOUND", 404);
      const previous = state(locked.legacyMetadata);
      const pending = previous.pending;
      if (!pending || pending.id !== receiptId ||
          !pending.key.startsWith("private/" + scope.collegeId + "/"))
        fail("COURSE_IMAGE_RECEIPT_NOT_FOUND", 404);
      if (Date.parse(pending.expiresAt) + 60 * 60 * 1000 < Date.now() &&
        pending.status === "UPLOADING") fail("COURSE_IMAGE_UPLOAD_EXPIRED", 409);
      const verification = await verifiedReceipt(pending, scope.collegeId);
      outcome.status = verification.status;
      if (verification.status === "VERIFYING") {
        await tx.update(courses).set({
          legacyMetadata: nextMeta(locked.legacyMetadata, {
            ...previous, pending: { ...pending, status: "VERIFYING" },
          }),
        }).where(eq(courses.id, scope.id));
        return;
      }
      outcome.oldKey = previous.active?.key;
      const active: Receipt = {
        ...pending, status: "READY",
        generation: verification.generation, etag: verification.etag,
      };
      await tx.update(courses).set({
        legacyMetadata: nextMeta(locked.legacyMetadata, { active, pending: null }),
      }).where(eq(courses.id, scope.id));
      const [display] = await tx.select({ version: courseDisplayContents.version })
        .from(courseDisplayContents).where(eq(courseDisplayContents.courseId, scope.id))
        .for("update").limit(1);
      if (display) {
        await tx.update(courseDisplayContents).set({
          thumbnailUrl: urlFor(scope.id),
          version: sql.raw("course_display_contents.version + 1"),
          updatedByUserId: context.user.id, updatedAt: new Date(),
        }).where(eq(courseDisplayContents.courseId, scope.id));
      } else {
        await tx.insert(courseDisplayContents).values({
          courseId: scope.id, thumbnailUrl: urlFor(scope.id),
          updatedByUserId: context.user.id,
        });
      }
      await recordActivityEventInTransaction(tx, context, {
        eventType: ACTIVITY_EVENT_TYPES.COURSES_CATALOG_UPDATED,
        organizationId: scope.organizationId, collegeId: scope.collegeId,
        subjectType: "course", subjectId: scope.id,
        summary: "Course image uploaded",
        metadata: { assetType: "course-image", action: "REPLACED", verified: true },
      });
    });
  } catch (error) { return safeError(error); }
  if (outcome.status === "READY" && outcome.oldKey)
    await safelyDelete(outcome.oldKey);
  return {
    status: outcome.status,
    imageUrl: outcome.status === "READY" ? urlFor(scope.id) : null,
  };
}

/** A manager may resume verification after a refresh, but never receives
 * raw R2 object keys or token hashes. */
export async function getCourseImageStatus(context: RequestContext, rawId: string) {
  const scope = await authorize(context, rawId, true);
  const [row] = await getDb().select({ legacyMetadata: courses.legacyMetadata })
    .from(courses).where(and(eq(courses.id, scope.id),
      eq(courses.departmentId, scope.departmentId))).limit(1);
  const image = state(row?.legacyMetadata ?? null);
  return {
    pending: image.pending ? {
      receiptId: image.pending.id, status: image.pending.status,
      expiresAt: image.pending.expiresAt,
    } : null,
    ready: image.active?.status === "READY",
    imageUrl: image.active?.status === "READY" ? urlFor(scope.id) : null,
  };
}

export async function removeCourseImage(context: RequestContext, rawId: string) {
  const scope = await authorize(context, rawId, true);
  let oldKey: string | undefined;
  let pendingKey: string | undefined;
  await getDb().transaction(async tx => {
    const [locked] = await tx.select({
      status: courses.status, departmentId: courses.departmentId,
      legacyMetadata: courses.legacyMetadata,
    }).from(courses).where(and(eq(courses.id, scope.id),
      eq(courses.departmentId, scope.departmentId))).for("update").limit(1);
    if (!locked || locked.status !== "ACTIVE") fail("COURSE_IMAGE_NOT_FOUND", 404);
    const before = state(locked.legacyMetadata);
    oldKey = before.active?.key;
    pendingKey = before.pending?.key;
    await tx.update(courses).set({
      legacyMetadata: nextMeta(locked.legacyMetadata, { active: null, pending: null }),
    }).where(eq(courses.id, scope.id));
    const [display] = await tx.select({ url: courseDisplayContents.thumbnailUrl })
      .from(courseDisplayContents).where(eq(courseDisplayContents.courseId, scope.id))
      .for("update").limit(1);
    if (display?.url === urlFor(scope.id)) {
      await tx.update(courseDisplayContents).set({
        thumbnailUrl: null, version: sql.raw("course_display_contents.version + 1"),
        updatedAt: new Date(), updatedByUserId: context.user.id,
      }).where(eq(courseDisplayContents.courseId, scope.id));
    }
    await recordActivityEventInTransaction(tx, context, {
      eventType: ACTIVITY_EVENT_TYPES.COURSES_CATALOG_UPDATED,
      collegeId: scope.collegeId, organizationId: scope.organizationId,
      subjectType: "course", subjectId: scope.id, summary: "Course image removed",
      metadata: { assetType: "course-image", action: "REMOVED" },
    });
  });
  await safelyDelete(oldKey);
  await safelyDelete(pendingKey);
  return { removed: Boolean(oldKey || pendingKey) };
}

/** Authenticated, college-bound image stream; never expose R2 keys or signed
 * storage URLs and do not serve unverified or replaced object generations. */
export async function readCourseImage(context: RequestContext, rawId: string) {
  const scope = await authorize(context, rawId, false);
  const [row] = await getDb().select({
    legacyMetadata: courses.legacyMetadata,
  }).from(courses).where(eq(courses.id, scope.id)).limit(1);
  const active = state(row?.legacyMetadata ?? null).active;
  if (!active || active.status !== "READY" ||
      !active.key.startsWith("private/" + scope.collegeId + "/"))
    fail("COURSE_IMAGE_NOT_FOUND", 404);
  const head = await headObject(getPrivateR2Config(), active.key);
  if (!head || !active.generation || String(head.lastModifiedMs) !== active.generation ||
      head.etag !== active.etag || head.sizeBytes !== active.sizeBytes ||
      head.contentType.toLowerCase() !== active.contentType ||
      head.metadata["college-id"] !== scope.collegeId ||
      head.metadata["owner-membership-id"] !== active.ownerMembershipId ||
      createHash("sha256").update(head.metadata["upload-token"] ?? "").digest("hex") !== active.tokenHash)
    fail("COURSE_IMAGE_NOT_READY", 409);
  const file = await getObjectStream(getPrivateR2Config(), active.key);
  if (!file || file.contentType.toLowerCase() !== active.contentType ||
      file.sizeBytes !== active.sizeBytes) fail("COURSE_IMAGE_NOT_READY", 409);
  return { body: file.body, contentType: active.contentType };
}
