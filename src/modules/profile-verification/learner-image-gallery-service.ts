import "server-only";

import { and, asc, eq, isNull } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { getDb } from "@/db/client";
import {
  collegeMemberships, membershipRoles, profilePrivateDocumentReceipts, users,
} from "@/db/schema";
import { learnerProfileImages } from "@/db/schema/db04-profile-education-images.staged";
import {
  createPrivateReadGrant, createPrivateUploadGrant, readPrivateObjectAttestation,
  PrivateObjectStorageError,
} from "@/modules/storage/private-object-storage";
import { hasMembershipRole, isSuperAdmin, type RequestContext } from "@/modules/identity/context";
import {
  learnerGalleryUploadSchema, MAX_LEARNER_PROFILE_IMAGES,
} from "./learner-image-gallery-parity-model";

const uuid = z.string().uuid();
export type GalleryAccess = { membershipId: string; collegeId: string; canEdit: boolean; canUpload: boolean };
export class LearnerGalleryError extends Error {
  constructor(public readonly code:
    "GALLERY_NOT_READY" | "GALLERY_FORBIDDEN" | "GALLERY_NOT_FOUND" |
    "GALLERY_LIMIT" | "GALLERY_RECEIPT_INVALID") {
    super(code);
    this.name = "LearnerGalleryError";
  }
}
function requireGalleryReady() {
  // Promotion requires receipt-owned migration replay and scanner negative tests.
  if (process.env["DB04_PROFILE_GALLERY_READY"] !== "DB04_VERIFIED")
    throw new LearnerGalleryError("GALLERY_NOT_READY");
}
async function galleryAccess(context: RequestContext, rawMembershipId: unknown): Promise<GalleryAccess> {
  requireGalleryReady();
  if (context.user.platformStatus !== "ACTIVE")
    throw new LearnerGalleryError("GALLERY_FORBIDDEN");
  const targetId = uuid.parse(rawMembershipId ?? context.membership?.id);
  const [target] = await getDb().select({
    id: collegeMemberships.id,
    userId: collegeMemberships.userId,
    collegeId: collegeMemberships.collegeId,
    status: collegeMemberships.status,
    role: membershipRoles.role,
  }).from(collegeMemberships)
    .innerJoin(membershipRoles, and(
      eq(membershipRoles.membershipId, collegeMemberships.id),
      eq(membershipRoles.role, "LEARNER"),
    ))
    .innerJoin(users, and(
      eq(users.id, collegeMemberships.userId),
      eq(users.platformStatus, "ACTIVE"),
    ))
    .where(eq(collegeMemberships.id, targetId)).limit(1);
  if (!target) throw new LearnerGalleryError("GALLERY_NOT_FOUND");
  const self = hasMembershipRole(context, "LEARNER") &&
    context.membership?.id === target.id && context.user.id === target.userId;
  const staff = hasMembershipRole(context, "COLLEGE_ADMIN") &&
    context.membership?.collegeId === target.collegeId;
  const superAdmin = isSuperAdmin(context) &&
    context.adminScope?.collegeId === target.collegeId;
  if (!self && !staff && !superAdmin)
    throw new LearnerGalleryError("GALLERY_FORBIDDEN");
  return { membershipId: target.id, collegeId: target.collegeId,
    canEdit: target.status === "ACTIVE" && (self || staff || superAdmin),
    // Staff may remove unsafe pictures, but publishing is learner-owned.
    canUpload: target.status === "ACTIVE" && self && context.membership?.status === "ACTIVE" };
}
function summary(row: typeof learnerProfileImages.$inferSelect) {
  return {
    id: row.id,
    imageId: row.legacyImageId ?? row.id,
    displayOrder: row.displayOrder,
    isActive: row.isActive,
    createdAt: row.createdAt.toISOString(),
  };
}
const MAX_GALLERY_UPLOAD_BYTES = 5 * 1024 * 1024;
const galleryFileSchema = z.strictObject({
  originalName: z.string().trim().min(5).max(255),
  contentType: z.enum(["image/jpeg", "image/png"]),
  sizeBytes: z.number().int().min(1).max(MAX_GALLERY_UPLOAD_BYTES),
});
const galleryKeySchema = z.string().regex(
  /^private\/[0-9a-f-]{36}\/[0-9a-f-]{36}\/profile-verification\/[0-9a-f-]{36}$/i,
);

/** Gallery photos may only be initiated and published by the actual learner.
 * Staff may review and deactivate but cannot place identity evidence in a
 * learner's public-facing photo set without the learner's own choice. */
async function requireOwnGalleryUpload(context: RequestContext) {
  if (!context.membership || !hasMembershipRole(context, "LEARNER") ||
      context.user.platformStatus !== "ACTIVE" ||
      context.membership.status !== "ACTIVE")
    throw new LearnerGalleryError("GALLERY_FORBIDDEN");
  const access = await galleryAccess(context, context.membership.id);
  if (!access.canUpload || access.membershipId !== context.membership.id)
    throw new LearnerGalleryError("GALLERY_FORBIDDEN");
  return access;
}

/** Pending, missing or unscanned objects are retryable conflicts, not success.
 * Actual provider outages must propagate; never fabricate a CLEAN receipt. */
export async function checkedGalleryObjectAttestation(
  objectKey: string, access: GalleryAccess,
) {
  try {
    return await readPrivateObjectAttestation(objectKey, {
      collegeId: access.collegeId, ownerMembershipId: access.membershipId,
    });
  } catch (error) {
    if (error instanceof PrivateObjectStorageError &&
        error.code === "PRIVATE_STORAGE_OBJECT_NOT_ATTESTED")
      throw new LearnerGalleryError("GALLERY_RECEIPT_INVALID");
    throw error;
  }
}

export async function initiateOwnLearnerGalleryUpload(
  context: RequestContext, raw: unknown,
) {
  const input = galleryFileSchema.parse(raw);
  const suffix = input.originalName.toLowerCase().split(".").at(-1);
  if (/[\/\\\x00-\x1f\x7f]/.test(input.originalName) ||
      (input.contentType === "image/jpeg" && suffix !== "jpg" && suffix !== "jpeg") ||
      (input.contentType === "image/png" && suffix !== "png"))
    throw new LearnerGalleryError("GALLERY_RECEIPT_INVALID");
  const access = await requireOwnGalleryUpload(context);
  const grant = await createPrivateUploadGrant({
    collegeId: access.collegeId,
    ownerMembershipId: access.membershipId,
    namespace: "profile-verification",
    contentType: input.contentType,
    expectedSizeBytes: input.sizeBytes,
    maxSizeBytes: MAX_GALLERY_UPLOAD_BYTES,
    originalName: input.originalName,
  });
  return { objectKey: grant.objectKey, uploadUrl: grant.uploadUrl,
    requiredHeaders: grant.requiredHeaders, expiresAt: grant.expiresAt.toISOString() };
}

/** Publish only a scanner-attested, owner-scoped image. Repeating the confirm
 * is idempotent by storage generation; no raw public URL is persisted. A
 * scanner still processing the PUT must produce a retryable 409, never READY. */
export async function confirmOwnLearnerGalleryUpload(
  context: RequestContext, raw: unknown,
) {
  const input = z.strictObject({ objectKey: galleryKeySchema }).parse(raw);
  const access = await requireOwnGalleryUpload(context);
  const segments = input.objectKey.split("/");
  if (segments[1] !== access.collegeId || segments[2] !== access.membershipId)
    throw new LearnerGalleryError("GALLERY_FORBIDDEN");
  const attestation = await checkedGalleryObjectAttestation(input.objectKey, access);
  if (!["image/jpeg", "image/png"].includes(attestation.contentType) ||
      attestation.sizeBytes > MAX_GALLERY_UPLOAD_BYTES)
    throw new LearnerGalleryError("GALLERY_RECEIPT_INVALID");
  const [inserted] = await getDb().insert(profilePrivateDocumentReceipts).values({
    owningMembershipId: access.membershipId,
    purpose: "PROFILE_IMAGE",
    privateObjectKey: attestation.objectKey,
    objectGeneration: attestation.generation,
    sha256Hex: attestation.sha256Hex,
    mimeType: attestation.contentType,
    sizeBytes: attestation.sizeBytes,
    scanStatus: "CLEAN",
    uploadedByUserId: context.user.id,
  }).onConflictDoNothing().returning({ id: profilePrivateDocumentReceipts.id });
  const receipt = inserted ?? (await getDb().select({
    id: profilePrivateDocumentReceipts.id,
    purpose: profilePrivateDocumentReceipts.purpose,
    owningMembershipId: profilePrivateDocumentReceipts.owningMembershipId,
  }).from(profilePrivateDocumentReceipts).where(and(
    eq(profilePrivateDocumentReceipts.privateObjectKey, attestation.objectKey),
    eq(profilePrivateDocumentReceipts.objectGeneration, attestation.generation),
  )).limit(1))[0];
  if (!receipt || ("purpose" in receipt && receipt.purpose !== "PROFILE_IMAGE") ||
      ("owningMembershipId" in receipt && receipt.owningMembershipId !== access.membershipId))
    throw new LearnerGalleryError("GALLERY_RECEIPT_INVALID");
  return appendLearnerGalleryImage(context, {
    receiptId: receipt.id, idempotencyKey: randomUUID(),
  }, access.membershipId);
}

export async function listLearnerGallery(context: RequestContext, membershipId?: string) {
  const access = await galleryAccess(context, membershipId);
  const rows = await getDb().select().from(learnerProfileImages)
    .where(and(eq(learnerProfileImages.learnerMembershipId, access.membershipId),
      eq(learnerProfileImages.isActive, true),
      isNull(learnerProfileImages.deactivatedAt)))
    .orderBy(asc(learnerProfileImages.displayOrder), asc(learnerProfileImages.id))
    .limit(MAX_LEARNER_PROFILE_IMAGES + 1);
  return { images: rows.map(summary), canEdit: access.canEdit,
    canUpload: access.canUpload,
    remaining: Math.max(0, MAX_LEARNER_PROFILE_IMAGES - rows.length) };
}

/** An existing scanner-approved, scoped receipt is mandatory. Uploading bytes
 * still goes through the private-object storage flow, not through this route. */
type GalleryTx = Parameters<Parameters<ReturnType<typeof getDb>["transaction"]>[0]>[0];
async function recheckGalleryWriteActor(
  tx: GalleryTx, context: RequestContext, access: GalleryAccess,
) {
  // Context was constructed before the upload began. A demoted learner or
  // college admin must not publish/deactivate a photo after their grant ends.
  const [currentUser] = await tx.select({ id: users.id }).from(users)
    .where(and(eq(users.id, context.user.id),
      eq(users.platformStatus, "ACTIVE"))).for("share").limit(1);
  if (!currentUser) throw new LearnerGalleryError("GALLERY_FORBIDDEN");
  if (isSuperAdmin(context)) {
    if (context.adminScope?.collegeId !== access.collegeId)
      throw new LearnerGalleryError("GALLERY_FORBIDDEN");
    return;
  }
  const actor = context.membership;
  const ownLearner = actor?.id === access.membershipId &&
    hasMembershipRole(context, "LEARNER");
  const collegeStaff = actor?.collegeId === access.collegeId &&
    hasMembershipRole(context, "COLLEGE_ADMIN");
  if (!actor || (!ownLearner && !collegeStaff))
    throw new LearnerGalleryError("GALLERY_FORBIDDEN");
  const [active] = await tx.select({ id: collegeMemberships.id })
    .from(collegeMemberships)
    .innerJoin(membershipRoles, and(
      eq(membershipRoles.membershipId, collegeMemberships.id),
      eq(membershipRoles.role, ownLearner ? "LEARNER" : "COLLEGE_ADMIN"),
    ))
    .where(and(eq(collegeMemberships.id, actor.id),
      eq(collegeMemberships.userId, context.user.id),
      eq(collegeMemberships.collegeId, access.collegeId),
      eq(collegeMemberships.status, "ACTIVE")))
    .for("share").limit(1);
  if (!active) throw new LearnerGalleryError("GALLERY_FORBIDDEN");
}

export async function appendLearnerGalleryImage(
  context: RequestContext, raw: unknown, membershipId?: string,
) {
  const input = learnerGalleryUploadSchema.parse(raw);
  // Publishing a gallery photo is the learner's choice, not a college-staff
  // maintenance action. An administrator may review or deactivate existing
  // photos, but cannot publish a private receipt in a learner's gallery.
  // Check the optional target explicitly, rather than accepting a staff
  // membership supplied by a caller.
  const access = await requireOwnGalleryUpload(context);
  if (membershipId !== undefined && uuid.parse(membershipId) !== access.membershipId)
    throw new LearnerGalleryError("GALLERY_FORBIDDEN");
  const [candidate] = await getDb().select().from(profilePrivateDocumentReceipts)
    .where(and(eq(profilePrivateDocumentReceipts.id, input.receiptId),
      eq(profilePrivateDocumentReceipts.owningMembershipId, access.membershipId),
      eq(profilePrivateDocumentReceipts.purpose, "PROFILE_IMAGE"),
      eq(profilePrivateDocumentReceipts.scanStatus, "CLEAN"),
      isNull(profilePrivateDocumentReceipts.revokedAt))).limit(1);
  if (!candidate || (candidate.retentionUntil && candidate.retentionUntil <= new Date()) ||
      !["image/jpeg", "image/png"].includes(candidate.mimeType))
    throw new LearnerGalleryError("GALLERY_RECEIPT_INVALID");
  const attestation = await checkedGalleryObjectAttestation(candidate.privateObjectKey, access);
  if (attestation.generation !== candidate.objectGeneration ||
      attestation.sha256Hex.toLowerCase() !== candidate.sha256Hex.toLowerCase() ||
      attestation.contentType !== candidate.mimeType ||
      attestation.sizeBytes !== candidate.sizeBytes)
    throw new LearnerGalleryError("GALLERY_RECEIPT_INVALID");
  return getDb().transaction(async tx => {
    await recheckGalleryWriteActor(tx, context, access);
    // Lock one membership, not the global gallery: concurrent appends cannot
    // exceed the ten-picture limit or reuse an unverified upload.
    const [member] = await tx.select({ id: collegeMemberships.id,
      status: collegeMemberships.status })
      .from(collegeMemberships).where(and(
        eq(collegeMemberships.id, access.membershipId),
        eq(collegeMemberships.collegeId, access.collegeId)))
      .for("update").limit(1);
    if (!member || member.status !== "ACTIVE")
      throw new LearnerGalleryError("GALLERY_FORBIDDEN");
    const [receipt] = await tx.select({ id: profilePrivateDocumentReceipts.id,
      retentionUntil: profilePrivateDocumentReceipts.retentionUntil })
      .from(profilePrivateDocumentReceipts)
      .where(and(eq(profilePrivateDocumentReceipts.id, candidate.id),
        eq(profilePrivateDocumentReceipts.owningMembershipId, access.membershipId),
        eq(profilePrivateDocumentReceipts.purpose, "PROFILE_IMAGE"),
        eq(profilePrivateDocumentReceipts.scanStatus, "CLEAN"),
        isNull(profilePrivateDocumentReceipts.revokedAt))).for("share").limit(1);
    if (!receipt || (receipt.retentionUntil && receipt.retentionUntil <= new Date()))
      throw new LearnerGalleryError("GALLERY_RECEIPT_INVALID");
    const existing = await tx.select().from(learnerProfileImages)
      .where(eq(learnerProfileImages.learnerMembershipId, access.membershipId))
      .orderBy(asc(learnerProfileImages.displayOrder), asc(learnerProfileImages.id));
    const same = existing.find(image => image.receiptId === candidate.id);
    if (same) return { image: summary(same), alreadyAdded: true };
    const active = existing.filter(image => image.isActive && !image.deactivatedAt);
    if (active.length >= MAX_LEARNER_PROFILE_IMAGES)
      throw new LearnerGalleryError("GALLERY_LIMIT");
    const highest = active.reduce((max, image) => Math.max(max, image.displayOrder), -1);
    const [created] = await tx.insert(learnerProfileImages).values({
      learnerMembershipId: access.membershipId, receiptId: candidate.id,
      receiptPurpose: "PROFILE_IMAGE", isActive: true,
      displayOrder: highest + 1,
    }).returning();
    if (!created) throw new LearnerGalleryError("GALLERY_RECEIPT_INVALID");
    return { image: summary(created), alreadyAdded: false };
  });
}

export async function deactivateLearnerGalleryImage(
  context: RequestContext, rawImageId: string, membershipId?: string,
) {
  const imageId = uuid.parse(rawImageId);
  const access = await galleryAccess(context, membershipId);
  if (!access.canEdit) throw new LearnerGalleryError("GALLERY_FORBIDDEN");
  return getDb().transaction(async tx => {
    await recheckGalleryWriteActor(tx, context, access);
    const [member] = await tx.select({ id: collegeMemberships.id })
      .from(collegeMemberships).where(and(
        eq(collegeMemberships.id, access.membershipId),
        eq(collegeMemberships.collegeId, access.collegeId),
        eq(collegeMemberships.status, "ACTIVE")))
      .for("update").limit(1);
    if (!member) throw new LearnerGalleryError("GALLERY_FORBIDDEN");
    const [image] = await tx.select().from(learnerProfileImages).where(and(
      eq(learnerProfileImages.id, imageId),
      eq(learnerProfileImages.learnerMembershipId, access.membershipId),
    )).for("update").limit(1);
    if (!image) throw new LearnerGalleryError("GALLERY_NOT_FOUND");
    if (!image.isActive) return { image: summary(image), alreadyDeactivated: true };
    const [saved] = await tx.update(learnerProfileImages).set({
      isActive: false, deactivatedAt: new Date(),
    }).where(and(eq(learnerProfileImages.id, imageId),
      eq(learnerProfileImages.learnerMembershipId, access.membershipId),
      eq(learnerProfileImages.isActive, true))).returning();
    if (!saved) throw new LearnerGalleryError("GALLERY_NOT_FOUND");
    // Never delete the private receipt: retain ownership/review history.
    return { image: summary(saved), alreadyDeactivated: false };
  });
}

export async function openLearnerGalleryImage(
  context: RequestContext, rawImageId: string, membershipId?: string,
) {
  const id = uuid.parse(rawImageId);
  const access = await galleryAccess(context, membershipId);
  const [image] = await getDb().select({
    id: learnerProfileImages.id,
    objectKey: profilePrivateDocumentReceipts.privateObjectKey,
    receiptId: profilePrivateDocumentReceipts.id,
    purpose: profilePrivateDocumentReceipts.purpose,
    mimeType: profilePrivateDocumentReceipts.mimeType,
    generation: profilePrivateDocumentReceipts.objectGeneration,
    revokedAt: profilePrivateDocumentReceipts.revokedAt,
    retentionUntil: profilePrivateDocumentReceipts.retentionUntil,
  }).from(learnerProfileImages)
    .innerJoin(profilePrivateDocumentReceipts,
      eq(profilePrivateDocumentReceipts.id, learnerProfileImages.receiptId))
    .where(and(eq(learnerProfileImages.id, id),
      eq(learnerProfileImages.learnerMembershipId, access.membershipId),
      eq(profilePrivateDocumentReceipts.owningMembershipId, access.membershipId),
      eq(profilePrivateDocumentReceipts.purpose, "PROFILE_IMAGE"),
      eq(profilePrivateDocumentReceipts.scanStatus, "CLEAN"),
      eq(learnerProfileImages.isActive, true),
      isNull(learnerProfileImages.deactivatedAt))).limit(1);
  if (!image || image.revokedAt ||
      (image.retentionUntil && image.retentionUntil <= new Date()))
    throw new LearnerGalleryError("GALLERY_NOT_FOUND");
  const grant = await createPrivateReadGrant({
    objectKey: image.objectKey,
    collegeId: access.collegeId,
    ownerMembershipId: access.membershipId,
  });
  if (grant.generation !== image.generation || grant.contentType !== image.mimeType)
    throw new LearnerGalleryError("GALLERY_RECEIPT_INVALID");
  return { url: grant.readUrl, expiresAt: grant.expiresAt.toISOString() };
}
