import type { CompletionOutcome } from "./file-lifecycle";

export type CompletionFields = {
  objectGeneration: string | null;
  verifiedContentType: string | null;
  verifiedSizeBytes: number | null;
  scanStatus: "PENDING" | "CLEAN" | "REJECTED";
  scanAttestedBy: string | null;
  scanAttestedAt: Date | null;
  failureCode: string | null;
  completedAt: Date | null;
};

export type CompletionPlan =
  | { kind: "WAIT" }
  | {
      kind: "APPLY";
      /** Neutral status; the video feature maps it onto its own processing states. */
      status: "VERIFYING" | "READY" | "QUARANTINED" | "FAILED";
      fields: CompletionFields;
      sha256Hex: string | null;
      deleteObject: boolean;
      event: "UPLOAD_COMPLETED" | "UPLOAD_FAILED" | "SCAN_REJECTED";
    };

/**
 * Turns a verification outcome into the exact column values to persist. Kept
 * pure so the state machine is unit-testable without storage or a database.
 */
export function planCompletion(outcome: CompletionOutcome, now: Date): CompletionPlan {
  switch (outcome.outcome) {
    case "NOT_UPLOADED":
      return { kind: "WAIT" };
    case "MISMATCH":
      return {
        kind: "APPLY",
        status: "FAILED",
        fields: {
          objectGeneration: null,
          verifiedContentType: null,
          verifiedSizeBytes: null,
          scanStatus: "PENDING",
          scanAttestedBy: null,
          scanAttestedAt: null,
          failureCode: outcome.failureCode,
          completedAt: null,
        },
        sha256Hex: null,
        deleteObject: true,
        event: "UPLOAD_FAILED",
      };
    case "QUARANTINED":
      return {
        kind: "APPLY",
        status: "QUARANTINED",
        fields: {
          objectGeneration: null,
          verifiedContentType: null,
          verifiedSizeBytes: null,
          scanStatus: "REJECTED",
          scanAttestedBy: null,
          scanAttestedAt: null,
          failureCode: outcome.failureCode,
          completedAt: null,
        },
        sha256Hex: null,
        deleteObject: true,
        event: "SCAN_REJECTED",
      };
    case "VERIFYING":
      return {
        kind: "APPLY",
        status: "VERIFYING",
        fields: {
          objectGeneration: outcome.generation,
          verifiedContentType: outcome.contentType,
          verifiedSizeBytes: outcome.sizeBytes,
          scanStatus: "PENDING",
          scanAttestedBy: null,
          scanAttestedAt: null,
          failureCode: null,
          completedAt: null,
        },
        sha256Hex: null,
        deleteObject: false,
        event: "UPLOAD_COMPLETED",
      };
    case "READY":
      return {
        kind: "APPLY",
        status: "READY",
        fields: {
          objectGeneration: outcome.generation,
          verifiedContentType: outcome.contentType,
          verifiedSizeBytes: outcome.sizeBytes,
          scanStatus: "CLEAN",
          scanAttestedBy: outcome.attestedBy,
          scanAttestedAt: now,
          failureCode: null,
          completedAt: now,
        },
        sha256Hex: outcome.sha256Hex,
        deleteObject: false,
        event: "UPLOAD_COMPLETED",
      };
  }
}

export type VideoProcessing = "UPLOADING" | "PROCESSING" | "READY" | "FAILED" | "BLOCKED";

export function videoStatusForPlan(status: "VERIFYING" | "READY" | "QUARANTINED" | "FAILED"): VideoProcessing {
  switch (status) {
    case "VERIFYING":
      return "PROCESSING";
    case "READY":
      return "READY";
    case "QUARANTINED":
      return "BLOCKED";
    case "FAILED":
      return "FAILED";
  }
}
