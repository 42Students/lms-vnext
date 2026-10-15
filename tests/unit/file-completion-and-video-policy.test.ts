import { describe, expect, it } from "vitest";
import { planCompletion, videoStatusForPlan } from "@/modules/storage/file-completion";
import {
  clampPlaybackTtlSeconds,
  videoCanBePublished,
  videoCanBeReplaced,
  videoPlayableForStaff,
  videoPublishTransitionAllowed,
  videoVisibleToLearner,
  type VideoVisibilityInput,
} from "@/modules/courses/lesson-video-policy";

const now = new Date("2026-10-16T10:00:00Z");

describe("planCompletion state machine", () => {
  it("waits when the object has not arrived", () => {
    expect(planCompletion({ outcome: "NOT_UPLOADED" }, now)).toEqual({ kind: "WAIT" });
  });

  it("stays VERIFYING and never marks CLEAN without an attestation (production)", () => {
    const plan = planCompletion(
      { outcome: "VERIFYING", generation: "1760000000000", sizeBytes: 10, contentType: "application/pdf" },
      now,
    );
    expect(plan).toMatchObject({ kind: "APPLY", status: "VERIFYING", deleteObject: false });
    if (plan.kind !== "APPLY") throw new Error("expected APPLY");
    expect(plan.fields.scanStatus).toBe("PENDING");
    expect(plan.fields.scanAttestedBy).toBeNull();
    expect(plan.fields.completedAt).toBeNull();
  });

  it("marks READY with CLEAN scan, attester and timestamps after attestation", () => {
    const plan = planCompletion(
      {
        outcome: "READY",
        generation: "1760000000000",
        sizeBytes: 10,
        contentType: "application/pdf",
        sha256Hex: "a".repeat(64),
        attestedBy: "lms-vnext-dev-attestation",
      },
      now,
    );
    if (plan.kind !== "APPLY") throw new Error("expected APPLY");
    expect(plan.status).toBe("READY");
    expect(plan.fields).toMatchObject({
      scanStatus: "CLEAN",
      scanAttestedBy: "lms-vnext-dev-attestation",
      objectGeneration: "1760000000000",
      completedAt: now,
      scanAttestedAt: now,
    });
    expect(plan.sha256Hex).toBe("a".repeat(64));
    expect(plan.event).toBe("UPLOAD_COMPLETED");
  });

  it("quarantines rejected content and deletes the object", () => {
    const plan = planCompletion({ outcome: "QUARANTINED", failureCode: "STORAGE_CONTENT_REJECTED" }, now);
    if (plan.kind !== "APPLY") throw new Error("expected APPLY");
    expect(plan).toMatchObject({ status: "QUARANTINED", deleteObject: true, event: "SCAN_REJECTED" });
    expect(plan.fields.scanStatus).toBe("REJECTED");
    expect(plan.fields.completedAt).toBeNull();
  });

  it("fails mismatches and deletes the object", () => {
    const plan = planCompletion({ outcome: "MISMATCH", failureCode: "STORAGE_UPLOAD_MISMATCH" }, now);
    if (plan.kind !== "APPLY") throw new Error("expected APPLY");
    expect(plan).toMatchObject({ status: "FAILED", deleteObject: true, event: "UPLOAD_FAILED" });
    expect(plan.fields.failureCode).toBe("STORAGE_UPLOAD_MISMATCH");
  });

  it("maps neutral statuses onto video processing states", () => {
    expect(videoStatusForPlan("VERIFYING")).toBe("PROCESSING");
    expect(videoStatusForPlan("READY")).toBe("READY");
    expect(videoStatusForPlan("QUARANTINED")).toBe("BLOCKED");
    expect(videoStatusForPlan("FAILED")).toBe("FAILED");
  });
});

const base: VideoVisibilityInput = {
  processingStatus: "READY",
  scanStatus: "CLEAN",
  publishStatus: "PUBLISHED",
  visibleToStudents: true,
  deleted: false,
  learningPathStatus: "PUBLISHED",
  content: null,
};

describe("learner video visibility", () => {
  it("allows only verified, published, visible videos in a published path", () => {
    expect(videoVisibleToLearner(base)).toBe(true);
  });

  it.each([
    ["processing", { processingStatus: "PROCESSING" as const }],
    ["failed", { processingStatus: "FAILED" as const }],
    ["blocked", { processingStatus: "BLOCKED" as const }],
    ["pending scan", { scanStatus: "PENDING" as const }],
    ["rejected scan", { scanStatus: "REJECTED" as const }],
    ["draft", { publishStatus: "DRAFT" as const }],
    ["archived", { publishStatus: "ARCHIVED" as const }],
    ["hidden", { visibleToStudents: false }],
    ["deleted", { deleted: true }],
    ["draft path", { learningPathStatus: "DRAFT" as const }],
    ["archived path", { learningPathStatus: "ARCHIVED" as const }],
    ["draft content", { content: { status: "DRAFT" as const, visibleToStudents: true } }],
    ["hidden content", { content: { status: "PUBLISHED" as const, visibleToStudents: false } }],
  ])("hides a video that is %s", (_label, override) => {
    expect(videoVisibleToLearner({ ...base, ...override })).toBe(false);
  });

  it("shows a video whose linked content is published and visible", () => {
    expect(videoVisibleToLearner({ ...base, content: { status: "PUBLISHED", visibleToStudents: true } })).toBe(true);
  });
});

describe("staff rules and transitions", () => {
  it("lets staff preview any verified video, drafts included", () => {
    expect(videoPlayableForStaff({ processingStatus: "READY", scanStatus: "CLEAN", deleted: false })).toBe(true);
    expect(videoPlayableForStaff({ processingStatus: "PROCESSING", scanStatus: "PENDING", deleted: false })).toBe(false);
    expect(videoCanBePublished({ processingStatus: "READY", scanStatus: "PENDING", deleted: false })).toBe(false);
  });

  it("allows only sensible publish transitions", () => {
    expect(videoPublishTransitionAllowed("DRAFT", "PUBLISHED")).toBe(true);
    expect(videoPublishTransitionAllowed("PUBLISHED", "DRAFT")).toBe(true);
    expect(videoPublishTransitionAllowed("PUBLISHED", "ARCHIVED")).toBe(true);
    expect(videoPublishTransitionAllowed("ARCHIVED", "DRAFT")).toBe(true);
    expect(videoPublishTransitionAllowed("ARCHIVED", "PUBLISHED")).toBe(false);
    expect(videoPublishTransitionAllowed("DRAFT", "DRAFT")).toBe(true);
  });

  it("allows replacing only terminal upload states", () => {
    expect(videoCanBeReplaced({ processingStatus: "READY", deleted: false })).toBe(true);
    expect(videoCanBeReplaced({ processingStatus: "FAILED", deleted: false })).toBe(true);
    expect(videoCanBeReplaced({ processingStatus: "UPLOADING", deleted: false })).toBe(false);
    expect(videoCanBeReplaced({ processingStatus: "PROCESSING", deleted: false })).toBe(false);
    expect(videoCanBeReplaced({ processingStatus: "READY", deleted: true })).toBe(false);
  });

  it("clamps playback TTL between 60 seconds and the maximum", () => {
    expect(clampPlaybackTtlSeconds(undefined, 3600, 7200)).toBe(3600);
    expect(clampPlaybackTtlSeconds(5, 3600, 7200)).toBe(60);
    expect(clampPlaybackTtlSeconds(999999, 3600, 7200)).toBe(7200);
    expect(clampPlaybackTtlSeconds(Number.NaN, 3600, 7200)).toBe(3600);
  });
});
