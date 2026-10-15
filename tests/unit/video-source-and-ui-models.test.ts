import { createHash, createVerify, generateKeyPairSync } from "node:crypto";
import { describe, expect, it } from "vitest";
import {
  GcsVideoSource,
  R2VideoSource,
  readGcsVideoConfig,
  resolveVideoSource,
  signGcsV4ReadUrl,
} from "@/modules/storage/video-source";
import { safeEventDetail } from "@/modules/storage/file-events";
import {
  fileStatusDescriptor,
  formatDuration,
  formatFileSize,
  isSafeSignedUrl,
  isStorageErrorCode,
  limitsSummary,
  storageErrorMessage,
  videoCanPublish,
  videoProcessingDescriptor,
  videoPublishLabel,
} from "@/modules/storage/ui-models";
import { STORAGE_FILE_ERROR_STATUS } from "@/modules/storage/file-errors";

const r2Env = {
  R2_ACCOUNT_ID: "test-account",
  R2_ACCESS_KEY: "TESTACCESSKEYID",
  R2_SECRET_KEY: "test-secret-not-real",
  R2_PRIVATE_BUCKET: "test-private",
} as unknown as NodeJS.ProcessEnv;

describe("R2 video source", () => {
  it("presigns a GET that carries no Range or content headers in the signature", () => {
    const now = new Date("2026-10-16T10:00:00Z");
    const result = new R2VideoSource(r2Env).createPlaybackUrl({
      objectKey: "private/c/m/lesson-video/v",
      ttlSeconds: 3600,
      now,
    });
    expect(result.expiresAt.getTime()).toBe(now.getTime() + 3600_000);
    const url = new URL(result.url);
    expect(url.searchParams.get("X-Amz-SignedHeaders")).toBe("host");
    expect(url.searchParams.get("X-Amz-Expires")).toBe("3600");
    expect(result.url).not.toContain("test-secret-not-real");
  });
});

describe("GCS video source", () => {
  const { privateKey, publicKey } = generateKeyPairSync("rsa", { modulusLength: 2048 });
  const pem = privateKey.export({ type: "pkcs8", format: "pem" }).toString();
  const config = { bucket: "legacy-videos", clientEmail: "reader@example-project.iam.gserviceaccount.com", privateKeyPem: pem };

  it("is disabled unless explicitly enabled and fully configured", () => {
    expect(readGcsVideoConfig({} as unknown as NodeJS.ProcessEnv)).toBeNull();
    expect(
      readGcsVideoConfig({
        GCS_VIDEO_BUCKET: "b",
        GCS_VIDEO_CLIENT_EMAIL: "e@x",
        GCS_VIDEO_PRIVATE_KEY: "k",
      } as unknown as NodeJS.ProcessEnv),
    ).toBeNull();
    expect(
      readGcsVideoConfig({ GCS_VIDEO_ENABLED: "true", GCS_VIDEO_BUCKET: "b" } as unknown as NodeJS.ProcessEnv),
    ).toBeNull();
    expect(
      readGcsVideoConfig({
        GCS_VIDEO_ENABLED: "true",
        GCS_VIDEO_BUCKET: "b",
        GCS_VIDEO_CLIENT_EMAIL: "e@x",
        GCS_VIDEO_PRIVATE_KEY: "line1\\nline2",
      } as unknown as NodeJS.ProcessEnv),
    ).toEqual({ bucket: "b", clientEmail: "e@x", privateKeyPem: "line1\nline2" });
  });

  it("fails closed when GCS is requested but not configured; R2 is the default", () => {
    expect(() => resolveVideoSource("GCS", {} as unknown as NodeJS.ProcessEnv)).toThrowError(/STORAGE_NOT_CONFIGURED/);
    expect(resolveVideoSource(undefined, r2Env).name).toBe("R2");
    expect(new GcsVideoSource(config).name).toBe("GCS");
  });

  it("produces a V4 signature that verifies against the public key and signs only the host", () => {
    const now = new Date("2026-10-16T10:15:30Z");
    const { url, expiresAt } = signGcsV4ReadUrl(config, {
      objectKey: "org-1/college-2/lesson-content/a b.mp4",
      ttlSeconds: 1800,
      now,
    });
    expect(expiresAt.getTime()).toBe(now.getTime() + 1800_000);
    const parsed = new URL(url);
    expect(parsed.origin).toBe("https://storage.googleapis.com");
    expect(parsed.pathname).toBe("/legacy-videos/org-1/college-2/lesson-content/a%20b.mp4");
    expect(parsed.searchParams.get("X-Goog-Algorithm")).toBe("GOOG4-RSA-SHA256");
    expect(parsed.searchParams.get("X-Goog-Date")).toBe("20261016T101530Z");
    expect(parsed.searchParams.get("X-Goog-Expires")).toBe("1800");
    expect(parsed.searchParams.get("X-Goog-SignedHeaders")).toBe("host");
    expect(url).not.toContain("PRIVATE KEY");

    const signature = parsed.searchParams.get("X-Goog-Signature")!;
    const query = [...parsed.searchParams.entries()]
      .filter(([name]) => name !== "X-Goog-Signature")
      .sort(([a], [b]) => (a < b ? -1 : 1))
      .map(([name, value]) => `${encodeURIComponent(name)}=${encodeURIComponent(value)}`)
      .join("&");
    const canonical = ["GET", parsed.pathname, query, "host:storage.googleapis.com\n", "host", "UNSIGNED-PAYLOAD"].join("\n");
    const stringToSign = [
      "GOOG4-RSA-SHA256",
      "20261016T101530Z",
      "20261016/auto/storage/goog4_request",
      createHash("sha256").update(canonical).digest("hex"),
    ].join("\n");
    expect(createVerify("RSA-SHA256").update(stringToSign).verify(publicKey, signature, "hex")).toBe(true);
  });

  it("rejects traversal keys and clamps the TTL to seven days", () => {
    expect(() => signGcsV4ReadUrl(config, { objectKey: "../x", ttlSeconds: 60 })).toThrowError(/STORAGE_NOT_FOUND/);
    const { url } = signGcsV4ReadUrl(config, { objectKey: "a/b.mp4", ttlSeconds: 99999999 });
    expect(new URL(url).searchParams.get("X-Goog-Expires")).toBe(String(7 * 24 * 3600));
  });
});

describe("audit detail sanitizing", () => {
  it("drops anything that could carry a URL, token or object key", () => {
    expect(
      safeEventDetail({
        sizeBytes: 10,
        status: "READY",
        flag: true,
        readUrl: "https://x/y",
        uploadToken: "abc",
        objectKey: "private/a/b",
        note: "https://leak.example/path",
        longText: "x".repeat(300),
        nested: { a: 1 },
      }),
    ).toEqual({ sizeBytes: 10, status: "READY", flag: true });
  });
});

describe("ui model helpers", () => {
  it("formats sizes and durations", () => {
    expect(formatFileSize(0)).toBe("0 B");
    expect(formatFileSize(1023)).toBe("1023 B");
    expect(formatFileSize(1536)).toBe("1.5 KiB");
    expect(formatFileSize(50 * 1024 * 1024)).toBe("50 MiB");
    expect(formatFileSize(4900 * 1024 * 1024)).toBe("4.8 GiB");
    expect(formatFileSize(-1)).toBe("Unknown size");
    expect(formatDuration(75)).toBe("1:15");
    expect(formatDuration(3725)).toBe("1:02:05");
    expect(formatDuration(null)).toBe("--:--");
  });

  it("describes statuses and only marks READY as usable", () => {
    expect(fileStatusDescriptor("READY")).toMatchObject({ label: "Available", usable: true });
    for (const status of ["UPLOADING", "VERIFYING", "QUARANTINED", "FAILED", "DELETED"] as const) {
      expect(fileStatusDescriptor(status).usable).toBe(false);
    }
    expect(videoProcessingDescriptor("PROCESSING").usable).toBe(false);
    expect(videoProcessingDescriptor("READY").usable).toBe(true);
    expect(videoPublishLabel("PUBLISHED", false)).toBe("Published (hidden from learners)");
    expect(videoPublishLabel("DRAFT", true)).toBe("Draft");
    expect(videoCanPublish({ processingStatus: "READY", publishStatus: "DRAFT" })).toBe(true);
    expect(videoCanPublish({ processingStatus: "PROCESSING", publishStatus: "DRAFT" })).toBe(false);
    expect(videoCanPublish({ processingStatus: "READY", publishStatus: "PUBLISHED" })).toBe(false);
  });

  it("has a message for every API error code and a safe fallback", () => {
    for (const code of Object.keys(STORAGE_FILE_ERROR_STATUS)) {
      expect(isStorageErrorCode(code)).toBe(true);
      expect(storageErrorMessage(code)).not.toBe("Something went wrong. Please try again.");
    }
    expect(storageErrorMessage("SOMETHING_ELSE")).toBe("Something went wrong. Please try again.");
    expect(storageErrorMessage(null)).toBe("Something went wrong. Please try again.");
  });

  it("summarizes limits and validates signed URLs", () => {
    expect(limitsSummary("assignment-submission")).toContain("50 MiB");
    expect(limitsSummary("lesson-video")).toContain("MP4");
    expect(isSafeSignedUrl("https://bucket.example/obj?sig=1")).toBe(true);
    expect(isSafeSignedUrl("http://bucket.example/obj")).toBe(false);
    expect(isSafeSignedUrl("https://user:pw@bucket.example/obj")).toBe(false);
    expect(isSafeSignedUrl("not a url")).toBe(false);
  });
});
