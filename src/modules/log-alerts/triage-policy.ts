import type { KnownErrorMutation } from "./validation";

/**
 * Legacy LogAlertAdminService state machine, independent of DB and provider.
 * Only return mutated fields: poller's occurrence counts and cursor must never
 * be overwritten by a stale full-row save from an admin action.
 */
export type KnownErrorTriageState = {
  fixStatus: "OPEN" | "FIXED" | "EXPECTED";
  muted: boolean;
  mutedReason: string | null;
  fixedAt: Date | null;
  fixedInCommit: string | null;
  regressedAt: Date | null;
  statusNote: string | null;
  issuePublicId: string | null;
};

export function knownErrorTriagePatch(
  current: KnownErrorTriageState,
  mutation: KnownErrorMutation,
  now: Date,
): Partial<KnownErrorTriageState> {
  if (!Number.isFinite(now.getTime())) throw new Error("INVALID_CLOCK");
  if (mutation.action === "ACKNOWLEDGE") return {};
  if (mutation.action === "MUTE") {
    return {
      muted: mutation.muted,
      mutedReason: mutation.muted ? mutation.reason?.trim() || null : null,
    };
  }
  if (mutation.action === "LINK_ISSUE") {
    return { issuePublicId: mutation.issuePublicId?.trim() || null };
  }

  const note = mutation.note?.trim() || null;
  const patch: Partial<KnownErrorTriageState> = {
    fixStatus: mutation.status,
    statusNote: note,
    regressedAt: null,
  };
  if (mutation.issuePublicId) patch.issuePublicId = mutation.issuePublicId;
  if (mutation.status === "FIXED") {
    patch.fixedInCommit = mutation.commit?.trim() || null;
    patch.fixedAt = new Date(now.getTime());
  } else if (mutation.status === "EXPECTED") {
    patch.fixedInCommit = null;
    patch.fixedAt = null;
    patch.muted = true;
    patch.mutedReason = note?.slice(0, 255) || "Marked expected";
  } else {
    patch.fixedInCommit = null;
    patch.fixedAt = null;
    if (current.fixStatus === "EXPECTED") {
      patch.muted = false;
      patch.mutedReason = null;
    }
  }
  return patch;
}
