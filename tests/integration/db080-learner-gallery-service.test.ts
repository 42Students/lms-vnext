import { randomUUID } from "node:crypto";
import { afterAll, describe, expect, it, vi } from "vitest";
import { eq, and } from "drizzle-orm";
import { getDb, closeDatabaseConnection } from "@/db/client";
import { profilePrivateDocumentReceipts } from "@/db/schema/profile-verification";
import { learnerProfileImages } from "@/db/schema/db04-profile-education-images.staged";
import { SEED_IDS } from "../../scripts/db-seed-data";
import { assertDb018DisposableTarget } from "../support/db018-test-target.mjs";
import type { RequestContext } from "@/modules/identity/context";

vi.mock("@/modules/storage/private-object-storage", () => ({
  PrivateObjectStorageError: class PrivateObjectStorageError extends Error {
    constructor(public code: string) { super(code); }
  },
  readPrivateObjectAttestation: vi.fn(async (objectKey: string) => ({
    objectKey, generation: "1", sha256Hex: "a".repeat(64),
    contentType: "image/png", sizeBytes: 128,
  })),
  createPrivateReadGrant: vi.fn(async () => ({
    readUrl: "https://private.invalid/test-only",
    expiresAt: new Date(Date.now() + 60000),
    generation: "1", contentType: "image/png",
  })),
  createPrivateUploadGrant: vi.fn(),
}));
import {
  appendLearnerGalleryImage, deactivateLearnerGalleryImage,
  listLearnerGallery, openLearnerGalleryImage,
} from "@/modules/profile-verification/learner-image-gallery-service";

const enabled = Boolean(process.env.TEST_DATABASE_URL) &&
  process.env.DB03_ISOLATED_TEST_DATABASE === "1" &&
  process.env.DB04_REGISTERED_PG === "YES";
if (enabled) assertDb018DisposableTarget(process.env, { serviceBound: true });
afterAll(async () => { if (enabled) await closeDatabaseConnection(); });

const owner = SEED_IDS.learnerCollegeAMembership;
const context: RequestContext = {
  user: {
    id: SEED_IDS.learnerUser,
    identityUid: "db080-disposable-learner",
    platformStatus: "ACTIVE",
    systemRoles: [],
  },
  membership: {
    id: owner, collegeId: SEED_IDS.collegeA,
    organizationId: SEED_IDS.organization, status: "ACTIVE",
    roles: ["LEARNER"],
  },
};

async function addReceipt(membershipId: string, purpose: "PROFILE_IMAGE" | "MARKSHEET") {
  const [row] = await getDb().insert(profilePrivateDocumentReceipts).values({
    owningMembershipId: membershipId,
    purpose,
    privateObjectKey: "private/" + SEED_IDS.collegeA + "/" + membershipId +
      "/profile-verification/" + randomUUID(),
    objectGeneration: "1",
    sha256Hex: "a".repeat(64),
    mimeType: "image/png",
    sizeBytes: 128,
    scanStatus: "CLEAN",
    uploadedByUserId: SEED_IDS.learnerUser,
  }).returning({ id: profilePrivateDocumentReceipts.id });
  if (!row) throw new Error("Disposable receipt insert failed");
  return row.id;
}

describe.skipIf(!enabled)("DB-080 registered gallery real producer/persistence/consumer", () => {
  it("persists verified learner photo, reads it, and retains idempotent deactivation without reviving receipt", async () => {
    const receipt = await addReceipt(owner, "PROFILE_IMAGE");
    let imageId: string | undefined;
    try {
      const published = await appendLearnerGalleryImage(context, {
        receiptId: receipt, idempotencyKey: randomUUID(),
      });
      imageId = published.image.id;
      expect(published.alreadyAdded).toBe(false);
      expect(published.image.isActive).toBe(true);
      const replay = await appendLearnerGalleryImage(context, {
        receiptId: receipt, idempotencyKey: randomUUID(),
      });
      expect(replay.alreadyAdded).toBe(true);
      expect(replay.image.id).toBe(imageId);
      const listed = await listLearnerGallery(context);
      expect(listed.images.some(image => image.id === imageId)).toBe(true);
      const signed = await openLearnerGalleryImage(context, imageId);
      expect(signed.url).toBe("https://private.invalid/test-only");
      const removed = await deactivateLearnerGalleryImage(context, imageId);
      expect(removed.alreadyDeactivated).toBe(false);
      const repeated = await deactivateLearnerGalleryImage(context, imageId);
      expect(repeated.alreadyDeactivated).toBe(true);
      const [stored] = await getDb().select().from(learnerProfileImages)
        .where(eq(learnerProfileImages.id, imageId));
      expect(stored?.isActive).toBe(false);
      expect(stored?.deactivatedAt).toBeInstanceOf(Date);
      const afterRemove = await listLearnerGallery(context);
      expect(afterRemove.images.some(image => image.id === imageId)).toBe(false);
      await expect(openLearnerGalleryImage(context, imageId))
        .rejects.toMatchObject({code: "GALLERY_NOT_FOUND"});
      await expect(appendLearnerGalleryImage(context, {
        receiptId: receipt, idempotencyKey: randomUUID(),
      })).rejects.toMatchObject({code: "GALLERY_IMAGE_REMOVED"});
    } finally {
      if (imageId) await getDb().delete(learnerProfileImages)
        .where(and(eq(learnerProfileImages.id, imageId),
          eq(learnerProfileImages.learnerMembershipId, owner)));
      await getDb().delete(profilePrivateDocumentReceipts)
        .where(eq(profilePrivateDocumentReceipts.id, receipt));
    }
  });

  it("denies using a different member's receipt or mismatched image purpose", async () => {
    const otherReceipt = await addReceipt(SEED_IDS.facultyCollegeBMembership, "PROFILE_IMAGE");
    const marksheet = await addReceipt(owner, "MARKSHEET");
    try {
      for (const receiptId of [otherReceipt, marksheet]) {
        await expect(appendLearnerGalleryImage(context, {
          receiptId, idempotencyKey: randomUUID(),
        })).rejects.toMatchObject({code: "GALLERY_RECEIPT_INVALID"});
      }
    } finally {
      await getDb().delete(profilePrivateDocumentReceipts)
        .where(eq(profilePrivateDocumentReceipts.id, otherReceipt));
      await getDb().delete(profilePrivateDocumentReceipts)
        .where(eq(profilePrivateDocumentReceipts.id, marksheet));
    }
  });
});