import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Receipt } from "@/modules/profile-verification/evidence";

const { getBucket } = vi.hoisted(() => ({ getBucket: vi.fn() }));
vi.mock("@/auth/firebase-admin", () => ({ getAdminStorageBucket: getBucket }));
import { verifyGcsPrivateDocumentReceipt } from
  "@/modules/profile-verification/gcs-private-receipts";

const college = "20000000-0000-4000-8000-000000000001";
const member = "40000000-0000-4000-8000-000000000001";
const object = "70000000-0000-4000-8000-000000000001";
const key = `private/${college}/${member}/profile-verification/${object}`;
const meta = () => ({
  generation: "3",
  size: "128",
  contentType: "application/pdf",
  metadata: {
    sha256: "a".repeat(64),
    owner_membership_id: member,
    college_id: college,
    malware_scan_status: "CLEAN",
    scan_attested_by: "lms-vnext-privileged-scanner",
  },
});
const receipt = (): Receipt => ({
  id: "receipt-1",
  owningMembershipId: member,
  purpose: "MARKSHEET",
  relatedEntryId: "education-1",
  scanStatus: "CLEAN",
  privateObjectKey: key,
  objectGeneration: "3",
  sha256Hex: "a".repeat(64),
  mimeType: "application/pdf",
  sizeBytes: 128,
  revokedAt: null,
  retentionUntil: null,
});

function bucket(options?: {
  owner?: string;
  collegeId?: string;
  sha?: string;
  scan?: string;
  publicAccessPrevention?: string;
  generation?: string;
}) {
  getBucket.mockReturnValue({
    getMetadata: vi.fn().mockResolvedValue([{
      iamConfiguration: {
        uniformBucketLevelAccess: { enabled: true },
        publicAccessPrevention: options?.publicAccessPrevention ?? "enforced",
      },
    }]),
    file: vi.fn().mockReturnValue({
      getMetadata: vi.fn().mockResolvedValue([{
        ...meta(),
        generation: options?.generation ?? "3",
        metadata: {
          ...meta().metadata,
          owner_membership_id: options?.owner ?? member,
          college_id: options?.collegeId ?? college,
          sha256: options?.sha ?? "a".repeat(64),
          malware_scan_status: options?.scan ?? "CLEAN",
        },
      }]),
    }),
  });
}

describe("DB04 GCS private receipt owner and scanner attestation", () => {
  beforeEach(() => { vi.clearAllMocks(); bucket(); });

  it("accepts a correctly scoped, CLEAN scanner-attested object", async () => {
    expect(await verifyGcsPrivateDocumentReceipt(receipt())).toBe(true);
  });

  it("rejects an object owned by another learner even if clean and same hash", async () => {
    bucket({ owner: "40000000-0000-4000-8000-000000000002" });
    expect(await verifyGcsPrivateDocumentReceipt(receipt())).toBe(false);
  });

  it("rejects an object marked as from another college", async () => {
    bucket({ collegeId: "20000000-0000-4000-8000-000000000002" });
    expect(await verifyGcsPrivateDocumentReceipt(receipt())).toBe(false);
  });

  it("rejects a receipt whose path membership disagrees with canonical owner", async () => {
    const forged = receipt();
    forged.owningMembershipId = "40000000-0000-4000-8000-000000000002";
    expect(await verifyGcsPrivateDocumentReceipt(forged)).toBe(false);
    expect(getBucket).not.toHaveBeenCalled();
  });

  it("rejects a noncanonical path even if the raw metadata could pass", async () => {
    const forged = receipt();
    forged.privateObjectKey = "private/other/membership/receipt";
    expect(await verifyGcsPrivateDocumentReceipt(forged)).toBe(false);
    expect(getBucket).not.toHaveBeenCalled();
  });

  it("rejects unsafe bucket and unclean scanner status", async () => {
    bucket({ publicAccessPrevention: "inherited" });
    expect(await verifyGcsPrivateDocumentReceipt(receipt())).toBe(false);
    bucket({ scan: "PENDING" });
    expect(await verifyGcsPrivateDocumentReceipt(receipt())).toBe(false);
  });

  it("rejects changed object generation or checksum", async () => {
    bucket({ generation: "4" });
    expect(await verifyGcsPrivateDocumentReceipt(receipt())).toBe(false);
    bucket({ sha: "b".repeat(64) });
    expect(await verifyGcsPrivateDocumentReceipt(receipt())).toBe(false);
  });

  it("rejects PENDING, revoked and expired receipts before reading GCS", async () => {
    const pending = receipt();
    pending.scanStatus = "PENDING";
    expect(await verifyGcsPrivateDocumentReceipt(pending)).toBe(false);
    const revoked = receipt();
    revoked.revokedAt = new Date();
    expect(await verifyGcsPrivateDocumentReceipt(revoked)).toBe(false);
    const expired = receipt();
    expired.retentionUntil = new Date(0);
    expect(await verifyGcsPrivateDocumentReceipt(expired)).toBe(false);
    expect(getBucket).not.toHaveBeenCalled();
  });
});
