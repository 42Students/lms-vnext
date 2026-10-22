import "server-only";

import { and, desc, eq, gt, isNull, or } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db/client";
import { learnerProfiles } from "@/db/schema";
import { profilePrivateDocumentReceipts } from "@/db/schema/profile-verification";
import { hasMembershipRole, type RequestContext } from "@/modules/identity/context";
import { verifyPrivateDocumentReceipt } from "@/modules/profile-verification/private-receipts";
import {
  createPrivateUploadGrant,
  readPrivateObjectAttestation,
} from "@/modules/storage/private-object-storage";

const receiptIdSchema = z.string().uuid();
const uploadInput = z.strictObject({
  contentType: z.literal("application/pdf"),
  sizeBytes: z.number().int().min(1).max(10 * 1024 * 1024),
});
const completeInput = z.strictObject({ objectKey: z.string().min(20).max(700) });

function requireOwnLearner(context: RequestContext) {
  if (context.user.platformStatus !== "ACTIVE" || !context.membership ||
      context.membership.status !== "ACTIVE" || !hasMembershipRole(context, "LEARNER")) {
    throw new Error("DEFAULT_RESUME_ACCESS_DENIED");
  }
  return context.membership;
}

/** No private object paths or storage URLs are returned in the list. */
export async function listLearnerDefaultResumes(context: RequestContext) {
  const membership = requireOwnLearner(context);
  const db = getDb();
  const now = new Date();
  const [profile, receipts] = await Promise.all([
    db.select({ selectedPath: learnerProfiles.resumeObjectPath })
      .from(learnerProfiles)
      .where(eq(learnerProfiles.membershipId, membership.id)).limit(1),
    db.select({
      id: profilePrivateDocumentReceipts.id,
      objectPath: profilePrivateDocumentReceipts.privateObjectKey,
      uploadedAt: profilePrivateDocumentReceipts.uploadedAt,
    }).from(profilePrivateDocumentReceipts)
      .where(and(
        eq(profilePrivateDocumentReceipts.owningMembershipId, membership.id),
        eq(profilePrivateDocumentReceipts.purpose, "RESUME"),
        eq(profilePrivateDocumentReceipts.scanStatus, "CLEAN"),
        isNull(profilePrivateDocumentReceipts.revokedAt),
        or(isNull(profilePrivateDocumentReceipts.retentionUntil),
           gt(profilePrivateDocumentReceipts.retentionUntil, now)),
      ))
      .orderBy(desc(profilePrivateDocumentReceipts.uploadedAt),
               desc(profilePrivateDocumentReceipts.id)).limit(100),
  ]);
  return {
    selected: receipts.find(r => r.objectPath === profile[0]?.selectedPath)?.id ?? null,
    items: receipts.map(r => ({ id: r.id, uploadedAt: r.uploadedAt.toISOString() })),
    hasUnlistedSelection: Boolean(profile[0]?.selectedPath) &&
      !receipts.some(r => r.objectPath === profile[0]?.selectedPath),
  };
}

export async function initiateLearnerDefaultResumeUpload(
  context: RequestContext, raw: unknown,
) {
  const membership = requireOwnLearner(context);
  const input = uploadInput.parse(raw);
  const grant = await createPrivateUploadGrant({
    collegeId: membership.collegeId,
    ownerMembershipId: membership.id,
    namespace: "profile-verification",
    contentType: input.contentType,
    expectedSizeBytes: input.sizeBytes,
    maxSizeBytes: 10 * 1024 * 1024,
  });
  return {
    objectKey: grant.objectKey, uploadUrl: grant.uploadUrl,
    requiredHeaders: grant.requiredHeaders,
    expiresAt: grant.expiresAt.toISOString(),
  };
}

export async function selectLearnerDefaultResume(
  context: RequestContext, rawReceiptId: unknown,
) {
  const membership = requireOwnLearner(context);
  const receiptId = receiptIdSchema.parse(rawReceiptId);
  const now = new Date();
  const db = getDb();
  const [receipt] = await db.select().from(profilePrivateDocumentReceipts)
    .where(and(
      eq(profilePrivateDocumentReceipts.id, receiptId),
      eq(profilePrivateDocumentReceipts.owningMembershipId, membership.id),
      eq(profilePrivateDocumentReceipts.purpose, "RESUME"),
      eq(profilePrivateDocumentReceipts.scanStatus, "CLEAN"),
      isNull(profilePrivateDocumentReceipts.revokedAt),
      or(isNull(profilePrivateDocumentReceipts.retentionUntil),
         gt(profilePrivateDocumentReceipts.retentionUntil, now)),
    )).limit(1);
  if (!receipt || receipt.mimeType !== "application/pdf" ||
      receipt.sizeBytes > 10 * 1024 * 1024) {
    throw new Error("DEFAULT_RESUME_NOT_VERIFIED");
  }
  const evidence = { ...receipt, purpose: "RESUME" as const, scanStatus: "CLEAN" as const };
  if (!await verifyPrivateDocumentReceipt(evidence)) {
    throw new Error("DEFAULT_RESUME_NOT_VERIFIED");
  }
  const attestation = await readPrivateObjectAttestation(receipt.privateObjectKey, {
    collegeId: membership.collegeId, ownerMembershipId: membership.id,
  });
  if (attestation.generation !== receipt.objectGeneration ||
      attestation.sha256Hex.toLowerCase() !== receipt.sha256Hex.toLowerCase() ||
      attestation.contentType !== "application/pdf" ||
      attestation.sizeBytes !== receipt.sizeBytes) {
    throw new Error("DEFAULT_RESUME_NOT_VERIFIED");
  }
  // Repeat the ownership and active checks inside the write transaction.
  await db.transaction(async tx => {
    const [current] = await tx.select({ id: profilePrivateDocumentReceipts.id })
      .from(profilePrivateDocumentReceipts)
      .where(and(
        eq(profilePrivateDocumentReceipts.id, receipt.id),
        eq(profilePrivateDocumentReceipts.owningMembershipId, membership.id),
        eq(profilePrivateDocumentReceipts.purpose, "RESUME"),
        eq(profilePrivateDocumentReceipts.scanStatus, "CLEAN"),
        isNull(profilePrivateDocumentReceipts.revokedAt),
        or(isNull(profilePrivateDocumentReceipts.retentionUntil),
           gt(profilePrivateDocumentReceipts.retentionUntil, new Date())),
      )).for("update").limit(1);
    if (!current) throw new Error("DEFAULT_RESUME_NOT_VERIFIED");
    const updated = await tx.update(learnerProfiles)
      .set({
        resumeObjectPath: receipt.privateObjectKey,
        resumeScanStatus: "CLEAN",
        resumeVerifiedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(learnerProfiles.membershipId, membership.id))
      .returning({ membershipId: learnerProfiles.membershipId });
    if (updated.length !== 1) throw new Error("DEFAULT_RESUME_ACCESS_DENIED");
  });
  return { selected: receipt.id };
}

/** Uploads remain PENDING until the privileged scanner verifies the object. */
export async function confirmLearnerDefaultResumeUpload(
  context: RequestContext, raw: unknown,
) {
  const membership = requireOwnLearner(context);
  const { objectKey } = completeInput.parse(raw);
  const attestation = await readPrivateObjectAttestation(objectKey, {
    collegeId: membership.collegeId, ownerMembershipId: membership.id,
  });
  if (attestation.contentType !== "application/pdf" ||
      attestation.sizeBytes > 10 * 1024 * 1024 ||
      !objectKey.includes("/profile-verification/")) {
    throw new Error("DEFAULT_RESUME_NOT_VERIFIED");
  }
  const db = getDb();
  await db.insert(profilePrivateDocumentReceipts).values({
    owningMembershipId: membership.id,
    purpose: "RESUME",
    relatedEntryId: null,
    privateObjectKey: objectKey,
    objectGeneration: attestation.generation,
    sha256Hex: attestation.sha256Hex,
    mimeType: attestation.contentType,
    sizeBytes: attestation.sizeBytes,
    scanStatus: "CLEAN",
    uploadedByUserId: context.user.id,
  }).onConflictDoNothing();
  const [receipt] = await db.select({ id: profilePrivateDocumentReceipts.id })
    .from(profilePrivateDocumentReceipts)
    .where(and(
      eq(profilePrivateDocumentReceipts.owningMembershipId, membership.id),
      eq(profilePrivateDocumentReceipts.purpose, "RESUME"),
      eq(profilePrivateDocumentReceipts.privateObjectKey, objectKey),
      eq(profilePrivateDocumentReceipts.objectGeneration, attestation.generation),
      eq(profilePrivateDocumentReceipts.scanStatus, "CLEAN"),
      isNull(profilePrivateDocumentReceipts.revokedAt),
    )).limit(1);
  if (!receipt) throw new Error("DEFAULT_RESUME_NOT_VERIFIED");
  return selectLearnerDefaultResume(context, receipt.id);
}
