import { afterEach, describe, expect, it, vi } from "vitest";
import { getPrivateR2Config } from "@/modules/storage/r2-config";
import { createPrivateUploadGrant } from "@/modules/storage/private-object-storage";
import { presignUrl } from "@/modules/storage/s3-client";

const base = {
  R2_ACCOUNT_ID: "acct",
  R2_ACCESS_KEY: "id",
  R2_SECRET_KEY: "secret",
  R2_PRIVATE_BUCKET: "shared-bucket",
  R2_BUCKET_NAME: "shared-bucket",
} as unknown as NodeJS.ProcessEnv;
const env = (extra: Record<string, string>) =>
  ({ ...base, ...extra }) as NodeJS.ProcessEnv;

afterEach(() => vi.unstubAllEnvs());

describe("shared legacy bucket guard", () => {
  it("is strict in production, even with a prefix", () => {
    for (const appEnv of ["production", "staging", ""]) {
      expect(() =>
        getPrivateR2Config(env({ APP_ENV: appEnv, R2_PRIVATE_PREFIX: "vnext-dev/" })),
      ).toThrowError(expect.objectContaining({ code: "PRIVATE_STORAGE_BUCKET_UNSAFE" }));
    }
  });

  it("is strict in development without a prefix or with a bad prefix", () => {
    for (const prefix of ["", "vnext-dev", "/vnext-dev/", "a/../b/"]) {
      expect(() =>
        getPrivateR2Config(env({ APP_ENV: "development", R2_PRIVATE_PREFIX: prefix })),
      ).toThrowError(expect.objectContaining({ code: "PRIVATE_STORAGE_BUCKET_UNSAFE" }));
    }
  });

  it("is allowed in development with a trailing-slash prefix", () => {
    const config = getPrivateR2Config(
      env({ APP_ENV: "development", R2_PRIVATE_PREFIX: "vnext-dev/" }),
    );
    expect(config.bucket).toBe("shared-bucket");
    expect(config.keyPrefix).toBe("vnext-dev/");
  });

  it("leaves distinct buckets unprefixed by default", () => {
    const config = getPrivateR2Config(env({ R2_PRIVATE_BUCKET: "private-only" }));
    expect(config.keyPrefix).toBeUndefined();
  });
});

describe("key prefix", () => {
  it("is applied to presigned URLs", () => {
    const cfg = {
      endpoint: "https://acct.r2.cloudflarestorage.com",
      bucket: "b",
      accessKeyId: "id",
      secretAccessKey: "s",
      keyPrefix: "vnext-dev/",
    };
    const url = new URL(presignUrl(cfg, { method: "GET", key: "private/x" }));
    expect(url.pathname).toBe("/b/vnext-dev/private/x");
    const plain = new URL(presignUrl({ ...cfg, keyPrefix: undefined }, { method: "GET", key: "private/x" }));
    expect(plain.pathname).toBe("/b/private/x");
  });

  it("is applied to upload grants while the logical key stays unprefixed", async () => {
    vi.stubEnv("APP_ENV", "development");
    vi.stubEnv("R2_ACCOUNT_ID", "acct");
    vi.stubEnv("R2_ACCESS_KEY", "id");
    vi.stubEnv("R2_SECRET_KEY", "secret");
    vi.stubEnv("R2_PRIVATE_BUCKET", "shared-bucket");
    vi.stubEnv("R2_BUCKET_NAME", "shared-bucket");
    vi.stubEnv("R2_PRIVATE_PREFIX", "vnext-dev/");
    const grant = await createPrivateUploadGrant({
      collegeId: "20000000-0000-4000-8000-000000000001",
      ownerMembershipId: "40000000-0000-4000-8000-000000000001",
      namespace: "assignment-submission",
      contentType: "application/pdf",
      expectedSizeBytes: 1000,
    });
    expect(grant.objectKey.startsWith("private/")).toBe(true);
    expect(new URL(grant.uploadUrl).pathname.startsWith("/shared-bucket/vnext-dev/private/")).toBe(true);
  });
});
