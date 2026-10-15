/**
 * Pure rules for lesson video state and learner visibility. The service layer
 * calls these with rows it loaded; keeping them here makes the state machine
 * unit-testable without a database.
 */
export type VideoProcessingStatus = "UPLOADING" | "PROCESSING" | "READY" | "FAILED" | "BLOCKED";
export type VideoPublishStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";

export type VideoVisibilityInput = {
  processingStatus: VideoProcessingStatus;
  scanStatus: "PENDING" | "CLEAN" | "REJECTED";
  publishStatus: VideoPublishStatus;
  visibleToStudents: boolean;
  deleted: boolean;
  learningPathStatus: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  /** The VIDEO lesson content row the asset backs, when one is linked. */
  content: { status: "DRAFT" | "PUBLISHED" | "ARCHIVED"; visibleToStudents: boolean } | null;
};

/** Learner playback and listing rule: enrolled (checked elsewhere) AND published AND visible. */
export function videoVisibleToLearner(input: VideoVisibilityInput) {
  if (input.deleted) return false;
  if (input.processingStatus !== "READY" || input.scanStatus !== "CLEAN") return false;
  if (input.publishStatus !== "PUBLISHED" || !input.visibleToStudents) return false;
  if (input.learningPathStatus !== "PUBLISHED") return false;
  if (input.content && (input.content.status !== "PUBLISHED" || !input.content.visibleToStudents)) {
    return false;
  }
  return true;
}

/** Instructors and admins may preview any verified video, including drafts. */
export function videoPlayableForStaff(input: Pick<VideoVisibilityInput, "processingStatus" | "scanStatus" | "deleted">) {
  return !input.deleted && input.processingStatus === "READY" && input.scanStatus === "CLEAN";
}

export function videoCanBePublished(input: Pick<VideoVisibilityInput, "processingStatus" | "scanStatus" | "deleted">) {
  return videoPlayableForStaff(input);
}

/** Allowed publish transitions; archived videos can only return to draft. */
export function videoPublishTransitionAllowed(from: VideoPublishStatus, to: VideoPublishStatus) {
  if (from === to) return true;
  switch (from) {
    case "DRAFT":
      return to === "PUBLISHED" || to === "ARCHIVED";
    case "PUBLISHED":
      return to === "DRAFT" || to === "ARCHIVED";
    case "ARCHIVED":
      return to === "DRAFT";
  }
}

/** Only terminal upload states may be replaced; in-flight uploads must finish or fail first. */
export function videoCanBeReplaced(input: { processingStatus: VideoProcessingStatus; deleted: boolean }) {
  return !input.deleted && (input.processingStatus === "READY" || input.processingStatus === "FAILED" || input.processingStatus === "BLOCKED");
}

export function clampPlaybackTtlSeconds(requested: number | undefined, defaultSeconds: number, maxSeconds: number) {
  if (requested === undefined || !Number.isFinite(requested)) return defaultSeconds;
  return Math.min(Math.max(Math.trunc(requested), 60), maxSeconds);
}
