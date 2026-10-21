import "server-only";

import { and, asc, eq, isNull } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db/client";
import {
  collegeMemberships, membershipRoles, profilePrivateDocumentReceipts, users,
} from "@/db/schema";
import { learnerProfileImages } from "@/db/schema/db04-profile-education-images.staged";
import { createPrivateReadGrant, readPrivateObjectAttestation } from "@/modules/storage/private-object-storage";
import { hasMembershipRole, isSuperAdmin, type RequestContext } from "@/modules/identity/context";
import {
  learnerGalleryUploadSchema, MAX_LEARNER_PROFILE_IMAGES,
} from "./learner-image-gallery-parity-model";

const uuid = z.string().uuid();
export type GalleryAccess = { membershipId: string; collegeId: string; canEdit: boolean };
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
  if (process.env.DB04_PROFILE_GALLERY_READY !== "DB04_VERIFIED")
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
    canEdit: target.status === "ACTIVE" && (self || staff || superAdmin) };
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
export async function listLearnerGallery(context: RequestContext, membershipId?: string) {
  const access = await galleryAccess(context, membershipId);
  const rows = await getDb().select().from(learnerProfileImages)
    .where(and(eq(learnerProfileImages.learnerMembershipId, access.membershipId),
      eq(learnerProfileImages.isActive, true),
      isNull(learnerProfileImages.deactivatedAt)))
    .orderBy(asc(learnerProfileImages.displayOrder), asc(learnerProfileImages.id))
    .limit(MAX_LEARNER_PROFILE_IMAGES + 1);
  return { images: rows.map(summary), canEdit: access.canEdit,
    remaining: Math.max(0, MAX_LEARNER_PROFILE_IMAGES - rows.length) };
}

/** An existing scanner-approved, scoped receipt is mandatory. Uploading bytes
 * still goes through the private-object storage flow, not through this route. */
export async function appendLearnerGalleryImage(
  context: RequestContext, raw: unknown, membershipId?: string,
) {
  const input = learnerGalleryUploadSchema.parse(raw);
  const access = await galleryAccess(context, membershipId);
  if (!access.canEdit) throw new LearnerGalleryError("GALLERY_FORBIDDEN");
  const [candidate] = await getDb().select().from(profilePrivateDocumentReceipts)
    .where(and(eq(profilePrivateDocumentReceipts.id, input.receiptId),
      eq(profilePrivateDocumentReceipts.owningMembershipId, access.membershipId),
      eq(profilePrivateDocumentReceipts.purpose, "PROFILE_IMAGE"),
      eq(profilePrivateDocumentReceipts.scanStatus, "CLEAN"),
      isNull(profilePrivateDocumentReceipts.revokedAt))).limit(1);
  if (!candidate || (candidate.retentionUntil && candidate.retentionUntil <= new Date()) ||
      !["image/jpeg", "image/png"].includes(candidate.mimeType))
    throw new LearnerGalleryError("GALLERY_RECEIPT_INVALID");
  const attestation = await readPrivateObjectAttestation(candidate.privateObjectKey, {
    collegeId: access.collegeId, ownerMembershipId: access.membershipId,
  });
  if (attestation.generation !== candidate.objectGeneration ||
      attestation.sha256Hex.toLowerCase() !== candidate.sha256Hex.toLowerCase() ||
      attestation.contentType !== candidate.mimeType ||
      attestation.sizeBytes !== candidate.sizeBytes)
    throw new LearnerGalleryError("GALLERY_RECEIPT_INVALID");
  return getDb().transaction(async tx => {
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
    const [receipt] = await tx.select({ id: profilePrivateDocumentReceipts.id })
      .from(profilePrivateDocumentReceipts)
      .where(and(eq(profilePrivateDocumentReceipts.id, candidate.id),
        eq(profilePrivateDocumentReceipts.owningMembershipId, access.membershipId),
        eq(profilePrivateDocumentReceipts.purpose, "PROFILE_IMAGE"),
        eq(profilePrivateDocumentReceipts.scanStatus, "CLEAN"),
        isNull(profilePrivateDocumentReceipts.revokedAt))).for("share").limit(1);
    if (!receipt) throw new LearnerGalleryError("GALLERY_RECEIPT_INVALID");
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
