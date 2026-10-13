import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Receipt } from "@/modules/profile-verification/evidence";

const { head, replace } = vi.hoisted(() => ({
  head: vi.fn(),
  replace: vi.fn(),
}));
vi.mock("@/modules/storage/s3-client", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/modules/storage/s3-client")>()),
  headObject: head,
  replaceObjectMetadata: replace,
}));

import { getPrivateR2Config } from "@/modules/storage/r2-config";
import {
  createPrivateReadGrant,
  createPrivateUploadGrant,
  PrivateObjectStorageError,
  readPrivateObjectAttestation,
  recordPrivateObjectScanVerdict,
} from "@/modules/storage/private-object-storage";
import { verifyPrivateDocumentReceipt } from "@/modules/profile-verification/private-receipts";

const college = "20000000-0000-4000-8000-000000000001";
const member = "40000000-0000-4000-8000-000000000001";
const other = "40000000-0000-4000-8000-000000000002";
const object = "70000000-0000-4000-8000-000000000001";
const key = `private/${college}/${member}/profile-verification/${object}`;
const sha = "a".repeat(64);

const cleanHead = (overrides: Record<string, string> = {}) => ({
  etag: "x",
  lastModifiedMs: 1_760_000_000_000,
  sizeBytes: 128,
  contentType: "application/pdf",
  metadata: {
    sha256: sha,
    "owner-membership-id": member,
    "college-id": college,
    "malware-scan-status": "CLEAN",
    "scan-attested-by": "lms-vnext-privileged-scanner",
    ...overrides,
  },
});

const receipt = (): Receipt => ({
  id: "receipt-1",
  owningMembershipId: member,
  purpose: "MARKSHEET",
  relatedEntryId: "education-1",
  scanStatus: "CLEAN",
  privateObjectKey: key,
  objectGeneration: "1760000000000",
  sha256Hex: sha,
  mimeType: "application/pdf",
  sizeBytes: 128,
  revokedAt: null,
  retentionUntil: null,
});

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv("R2_ACCOUNT_ID", "acct");
  vi.stubEnv("R2_ACCESS_KEY", "id");
  vi.stubEnv("R2_SECRET_KEY", "secret");
  vi.stubEnv("R2_PRIVATE_BUCKET", "lms-vnext-private");
  vi.stubEnv("R2_BUCKET_NAME", "legacy-public");
  head.mockResolvedValue(cleanHead());
});

describe("R2 private storage configuration", () => {
  it("refuses the legacy public bucket", () => {
    vi.stubEnv("R2_PRIVATE_BUCKET", "legacy-public");
    expect(() => getPrivateR2Config()).toThrowError(
      expect.objectContaining({ code: "PRIVATE_STORAGE_BUCKET_UNSAFE" }),
    );
  });

  it("fails closed when not configured", () => {
    vi.stubEnv("R2_SECRET_KEY", "");
    expect(() => getPrivateR2Config()).toThrowError(
      expect.objectContaining({ code: "PRIVATE_STORAGE_NOT_CONFIGURED" }),
    );
  });
});

describe("upload and read grants", () => {
  it("pins PENDING scan status and tenant scope in signed headers", async () => {
    const grant = await createPrivateUploadGrant({
      collegeId: college,
      ownerMembershipId: member,
      namespace: "assignment-submission",
      contentType: "application/pdf",
      expectedSizeBytes: 1000,
    });
    const url = new URL(grant.uploadUrl);
    expect(grant.requiredHeaders["x-amz-meta-malware-scan-status"]).toBe("PENDING");
    expect(url.searchParams.get("X-Amz-SignedHeaders")).toContain(
      "x-amz-meta-malware-scan-status",
    );
    expect(url.pathname.startsWith("/lms-vnext-private/private/")).toBe(true);
    expect(grant.uploadTokenHash).toMatch(/^[0-9a-f]{64}$/);
  });

  it("issues read grants only for attested objects in the caller's scope", async () => {
    const grant = await createPrivateReadGrant({
      objectKey: key,
      collegeId: college,
      ownerMembershipId: member,
    });
    expect(grant.generation).toBe("1760000000000");
    await expect(
      createPrivateReadGrant({
        objectKey: key,
        collegeId: college,
        ownerMembershipId: other,
      }),
    ).rejects.toBeInstanceOf(PrivateObjectStorageError);
  });
});

describe("attestation", () => {
  const expected = { collegeId: college, ownerMembershipId: member };

  it("rejects pending, foreign-owner, foreign-college and missing objects", async () => {
    const cases: Record<string, string>[] = [
      { "malware-scan-status": "PENDING" },
      { "owner-membership-id": other },
      { "college-id": "20000000-0000-4000-8000-000000000002" },
      { "scan-attested-by": "client" },
      { sha256: "b".repeat(63) },
    ];
    for (const bad of cases) {
      head.mockResolvedValueOnce(cleanHead(bad));
      await expect(readPrivateObjectAttestation(key, expected)).rejects.toBeInstanceOf(
        PrivateObjectStorageError,
      );
    }
    head.mockResolvedValueOnce(null);
    await expect(readPrivateObjectAttestation(key, expected)).rejects.toBeInstanceOf(
      PrivateObjectStorageError,
    );
  });

  it("scanner verdict rewrites metadata only for the owning member", async () => {
    await recordPrivateObjectScanVerdict(key, {
      collegeId: college,
      ownerMembershipId: member,
      sha256Hex: sha,
      verdict: "CLEAN",
    });
    expect(replace).toHaveBeenCalledOnce();
    await expect(
      recordPrivateObjectScanVerdict(key, {
        collegeId: college,
        ownerMembershipId: other,
        sha256Hex: sha,
        verdict: "CLEAN",
      }),
    ).rejects.toBeInstanceOf(PrivateObjectStorageError);
  });
});

describe("profile receipt verification", () => {
  it("accepts a scoped CLEAN scanner-attested object", async () => {
    expect(await verifyPrivateDocumentReceipt(receipt())).toBe(true);
  });

  it("rejects changed generation, checksum, owner or scan state", async () => {
    head.mockResolvedValueOnce({ ...cleanHead(), lastModifiedMs: 1 });
    expect(await verifyPrivateDocumentReceipt(receipt())).toBe(false);
    head.mockResolvedValueOnce(cleanHead({ sha256: "b".repeat(64) }));
    expect(await verifyPrivateDocumentReceipt(receipt())).toBe(false);
    head.mockResolvedValueOnce(cleanHead({ "owner-membership-id": other }));
    expect(await verifyPrivateDocumentReceipt(receipt())).toBe(false);
    head.mockResolvedValueOnce(cleanHead({ "malware-scan-status": "PENDING" }));
    expect(await verifyPrivateDocumentReceipt(receipt())).toBe(false);
  });

  it("rejects before reading storage when the receipt itself is bad", async () => {
    const forged = receipt();
    forged.privateObjectKey = "private/other/membership/receipt";
    expect(await verifyPrivateDocumentReceipt(forged)).toBe(false);
    const revoked = receipt();
    revoked.revokedAt = new Date();
    expect(await verifyPrivateDocumentReceipt(revoked)).toBe(false);
    expect(head).not.toHaveBeenCalled();
  });
});
