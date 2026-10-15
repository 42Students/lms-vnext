import { createHash } from "node:crypto";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { head, getStream, del } = vi.hoisted(() => ({
  head: vi.fn(),
  getStream: vi.fn(),
  del: vi.fn(),
}));
vi.mock("@/modules/storage/s3-client", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/modules/storage/s3-client")>()),
  headObject: head,
  getObjectStream: getStream,
  deleteObject: del,
}));

import {
  DEV_ATTESTATION_ID,
  devAttestationAllowed,
  devOnlyAttestPendingUpload,
  issueObjectReadUrl,
  issueObjectUpload,
  removeStoredObject,
  verifyUploadedObject,
} from "@/modules/storage/file-lifecycle";
import { StorageFileError } from "@/modules/storage/file-errors";

const college = "20000000-0000-4000-8000-000000000001";
const member = "40000000-0000-4000-8000-000000000001";
const objectKey = `private/${college}/${member}/assignment-submission/70000000-0000-4000-8000-000000000001`;
const token = "t".repeat(64);
const tokenHash = createHash("sha256").update(token).digest("hex");
const pdfBytes = new TextEncoder().encode("%PDF-1.7 fake body");

function stream(data: Uint8Array) {
  return {
    body: new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(data);
        controller.close();
      },
    }),
    contentType: "application/pdf",
    sizeBytes: data.length,
  };
}

function uploadedHead(overrides: Record<string, unknown> = {}, metadata: Record<string, string> = {}) {
  return {
    etag: "etag",
    lastModifiedMs: 1_760_000_000_000,
    sizeBytes: pdfBytes.length,
    contentType: "application/pdf",
    metadata: {
      "upload-token": token,
      "owner-membership-id": member,
      "college-id": college,
      "malware-scan-status": "PENDING",
      ...metadata,
    },
    ...overrides,
  };
}

const uploaded = {
  objectKey,
  collegeId: college,
  ownerMembershipId: member,
  kind: "assignment-submission" as const,
  declaredContentType: "application/pdf",
  declaredSizeBytes: pdfBytes.length,
  uploadTokenHash: tokenHash,
};

const devEnv = { APP_ENV: "development" } as unknown as NodeJS.ProcessEnv;
const prodEnv = { APP_ENV: "production" } as unknown as NodeJS.ProcessEnv;

beforeEach(() => {
  head.mockReset();
  getStream.mockReset();
  del.mockReset();
  process.env.R2_ACCOUNT_ID = "test-account";
  process.env.R2_ACCESS_KEY = "TESTACCESSKEYID";
  process.env.R2_SECRET_KEY = "test-secret-not-real";
  process.env.R2_PRIVATE_BUCKET = "test-private";
  delete process.env.R2_BUCKET_NAME;
  delete process.env.R2_PRIVATE_PREFIX;
});

describe("devAttestationAllowed", () => {
  it("is limited to explicit development and test environments (fails closed otherwise)", () => {
    expect(devAttestationAllowed({ APP_ENV: "development" } as unknown as NodeJS.ProcessEnv)).toBe(true);
    expect(devAttestationAllowed({ APP_ENV: "test" } as unknown as NodeJS.ProcessEnv)).toBe(true);
    expect(devAttestationAllowed({ APP_ENV: "production" } as unknown as NodeJS.ProcessEnv)).toBe(false);
    expect(devAttestationAllowed({} as unknown as NodeJS.ProcessEnv)).toBe(false);
    expect(devAttestationAllowed({ APP_ENV: "staging" } as unknown as NodeJS.ProcessEnv)).toBe(false);
  });
});

describe("issueObjectUpload", () => {
  it("binds type, scope and size and never returns the bucket secret", async () => {
    const grant = await issueObjectUpload({
      collegeId: college,
      ownerMembershipId: member,
      kind: "lesson-video",
      contentType: "video/mp4",
      sizeBytes: 3 * 1024 * 1024 * 1024,
    });
    expect(grant.objectKey).toMatch(new RegExp(`^private/${college}/${member}/lesson-video/[0-9a-f-]{36}$`));
    expect(grant.requiredHeaders["content-type"]).toBe("video/mp4");
    expect(grant.requiredHeaders["x-amz-meta-malware-scan-status"]).toBe("PENDING");
    expect(grant.requiredHeaders["x-amz-meta-expected-size"]).toBe(String(3 * 1024 * 1024 * 1024));
    expect(grant.uploadUrl).toContain("X-Amz-Signature=");
    expect(grant.uploadUrl).not.toContain("test-secret-not-real");
    expect(grant.uploadTokenHash).toMatch(/^[0-9a-f]{64}$/);
    const lifetime = grant.expiresAt.getTime() - Date.now();
    expect(lifetime).toBeGreaterThan(60_000);
    expect(lifetime).toBeLessThanOrEqual(15 * 60_000);
  });

  it("refuses sizes above the kind cap", async () => {
    await expect(
      issueObjectUpload({
        collegeId: college,
        ownerMembershipId: member,
        kind: "assignment-submission",
        contentType: "application/pdf",
        sizeBytes: 51 * 1024 * 1024,
      }),
    ).rejects.toBeInstanceOf(StorageFileError);
  });

  it("reports missing configuration as STORAGE_NOT_CONFIGURED", async () => {
    delete process.env.R2_PRIVATE_BUCKET;
    await expect(
      issueObjectUpload({
        collegeId: college,
        ownerMembershipId: member,
        kind: "assignment-submission",
        contentType: "application/pdf",
        sizeBytes: 10,
      }),
    ).rejects.toMatchObject({ code: "STORAGE_NOT_CONFIGURED" });
  });
});

describe("verifyUploadedObject", () => {
  it("reports NOT_UPLOADED when the object is missing", async () => {
    head.mockResolvedValue(null);
    await expect(verifyUploadedObject(uploaded, { env: devEnv })).resolves.toEqual({ outcome: "NOT_UPLOADED" });
  });

  it("rejects a wrong upload token, owner scope or scan claim", async () => {
    const cases: Record<string, string>[] = [
      { "upload-token": "x".repeat(64) },
      { "owner-membership-id": "40000000-0000-4000-8000-0000000000ff" },
      { "college-id": "20000000-0000-4000-8000-0000000000ff" },
      { "malware-scan-status": "CLEAN" },
    ];
    for (const metadata of cases) {
      head.mockResolvedValue(uploadedHead({}, metadata));
      await expect(verifyUploadedObject(uploaded, { env: devEnv })).resolves.toMatchObject({
        outcome: "MISMATCH",
        failureCode: "STORAGE_UPLOAD_MISMATCH",
      });
    }
  });

  it("rejects size and content-type mismatches", async () => {
    head.mockResolvedValue(uploadedHead({ sizeBytes: pdfBytes.length + 1 }));
    await expect(verifyUploadedObject(uploaded, { env: devEnv })).resolves.toMatchObject({ outcome: "MISMATCH" });
    head.mockResolvedValue(uploadedHead({ contentType: "text/html" }));
    await expect(verifyUploadedObject(uploaded, { env: devEnv })).resolves.toMatchObject({ outcome: "MISMATCH" });
  });

  it("stays VERIFYING in production and never reads the object body", async () => {
    head.mockResolvedValue(uploadedHead());
    const result = await verifyUploadedObject(uploaded, { env: prodEnv });
    expect(result).toEqual({
      outcome: "VERIFYING",
      generation: "1760000000000",
      sizeBytes: pdfBytes.length,
      contentType: "application/pdf",
    });
    expect(getStream).not.toHaveBeenCalled();
  });

  it("attests a matching upload outside production and records the SHA-256", async () => {
    head.mockResolvedValue(uploadedHead());
    getStream.mockResolvedValue(stream(pdfBytes));
    const result = await verifyUploadedObject(uploaded, { env: devEnv });
    expect(result).toEqual({
      outcome: "READY",
      generation: "1760000000000",
      sizeBytes: pdfBytes.length,
      contentType: "application/pdf",
      sha256Hex: createHash("sha256").update(pdfBytes).digest("hex"),
      attestedBy: DEV_ATTESTATION_ID,
    });
  });

  it("quarantines content whose magic bytes do not match the declared type", async () => {
    const html = new TextEncoder().encode("<html><script>alert(1)</script></html>");
    head.mockResolvedValue(uploadedHead({ sizeBytes: html.length }));
    getStream.mockResolvedValue(stream(html));
    await expect(
      verifyUploadedObject({ ...uploaded, declaredSizeBytes: html.length }, { env: devEnv }),
    ).resolves.toEqual({ outcome: "QUARANTINED", failureCode: "STORAGE_CONTENT_REJECTED" });
  });

  it("only range-reads the first bytes of a video (no full download or hash)", async () => {
    const mp4 = new Uint8Array(64);
    mp4.set(new TextEncoder().encode("ftypisom"), 4);
    head.mockResolvedValue(uploadedHead({ sizeBytes: 4_000_000_000, contentType: "video/mp4" }));
    getStream.mockResolvedValue({ ...stream(mp4), contentType: "video/mp4" });
    const result = await verifyUploadedObject(
      {
        ...uploaded,
        kind: "lesson-video",
        declaredContentType: "video/mp4",
        declaredSizeBytes: 4_000_000_000,
      },
      { env: devEnv },
    );
    expect(result).toMatchObject({ outcome: "READY", sha256Hex: null });
    expect(getStream).toHaveBeenCalledWith(expect.anything(), objectKey, { start: 0, end: 4095 });
  });
});

describe("devOnlyAttestPendingUpload", () => {
  it("throws in production so uploads can never be self-attested there", async () => {
    await expect(
      devOnlyAttestPendingUpload({
        objectKey,
        kind: "assignment-submission",
        contentType: "application/pdf",
        sizeBytes: pdfBytes.length,
        env: prodEnv,
      }),
    ).rejects.toMatchObject({ code: "STORAGE_FORBIDDEN" });
    expect(head).not.toHaveBeenCalled();
    expect(getStream).not.toHaveBeenCalled();
  });

  it("flags a body shorter than the declared size", async () => {
    getStream.mockResolvedValue(stream(pdfBytes));
    await expect(
      devOnlyAttestPendingUpload({
        objectKey,
        kind: "assignment-submission",
        contentType: "application/pdf",
        sizeBytes: pdfBytes.length + 10,
        env: devEnv,
      }),
    ).resolves.toEqual({ ok: false, failureCode: "STORAGE_UPLOAD_MISMATCH" });
  });
});

describe("issueObjectReadUrl", () => {
  const readable = {
    objectKey,
    collegeId: college,
    ownerMembershipId: member,
    generation: "1760000000000",
    sizeBytes: pdfBytes.length,
    contentType: "application/pdf",
  };

  it("returns a short-lived signed GET and enforces the TTL ceiling", async () => {
    head.mockResolvedValue(uploadedHead());
    const grant = await issueObjectReadUrl(readable, { ttlSeconds: 99999, maxTtlSeconds: 900 });
    expect(grant.expiresInSeconds).toBe(900);
    expect(grant.url).toContain("X-Amz-Expires=900");
    expect(grant.url).toContain("X-Amz-Signature=");
    expect(grant.url).not.toContain("test-secret-not-real");
    expect(grant.url).not.toContain("response-content-disposition");
  });

  it("adds a safe content-disposition for downloads", async () => {
    head.mockResolvedValue(uploadedHead());
    const grant = await issueObjectReadUrl(readable, {
      ttlSeconds: 300,
      maxTtlSeconds: 900,
      disposition: "attachment",
      fileName: 'we"ird\r\nname é.pdf',
    });
    const url = new URL(grant.url);
    const disposition = url.searchParams.get("response-content-disposition") ?? "";
    expect(disposition.startsWith("attachment; filename=\"")).toBe(true);
    expect(disposition).not.toMatch(/[\r\n]/);
    expect(disposition).toContain("filename*=UTF-8''");
  });

  it("fails closed when the object changed after attestation", async () => {
    head.mockResolvedValue(uploadedHead({ lastModifiedMs: 1_760_000_000_001 }));
    await expect(issueObjectReadUrl(readable, { ttlSeconds: 300, maxTtlSeconds: 900 })).rejects.toMatchObject({
      code: "STORAGE_FILE_NOT_READY",
    });
    head.mockResolvedValue(uploadedHead({ sizeBytes: 1 }));
    await expect(issueObjectReadUrl(readable, { ttlSeconds: 300, maxTtlSeconds: 900 })).rejects.toMatchObject({
      code: "STORAGE_FILE_NOT_READY",
    });
    head.mockResolvedValue(null);
    await expect(issueObjectReadUrl(readable, { ttlSeconds: 300, maxTtlSeconds: 900 })).rejects.toMatchObject({
      code: "STORAGE_FILE_NOT_READY",
    });
  });

  it("refuses keys outside the recorded college and owner scope", async () => {
    head.mockResolvedValue(uploadedHead());
    await expect(
      issueObjectReadUrl(
        { ...readable, ownerMembershipId: "40000000-0000-4000-8000-0000000000ff" },
        { ttlSeconds: 300, maxTtlSeconds: 900 },
      ),
    ).rejects.toMatchObject({ code: "STORAGE_NOT_FOUND" });
    expect(head).not.toHaveBeenCalled();
  });
});

describe("removeStoredObject", () => {
  it("swallows storage errors because rows are the source of truth", async () => {
    del.mockRejectedValue(new Error("S3_DELETE_500"));
    await expect(removeStoredObject(objectKey)).resolves.toBeUndefined();
    expect(del).toHaveBeenCalledTimes(1);
  });
});
