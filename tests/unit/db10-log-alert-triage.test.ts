import { describe, expect, it } from "vitest";
import { knownErrorMutationSchema } from "@/modules/log-alerts/validation";
import {
  knownErrorTriagePatch,
  type KnownErrorTriageState,
} from "@/modules/log-alerts/triage-policy";

const prior: KnownErrorTriageState = {
  fixStatus: "OPEN",
  muted: false,
  mutedReason: null,
  fixedInCommit: null,
  fixedAt: null,
  regressedAt: new Date("2026-10-11T00:00:00.000Z"),
  statusNote: null,
  issuePublicId: null,
};
const now = new Date("2026-10-12T12:00:00.000Z");

describe("W06 durable Known Errors state transitions", () => {
  it("never overwrites error counters, poll cursor, or actor privacy by patch", () => {
    const patch = knownErrorTriagePatch(prior, {
      action: "STATUS", status: "FIXED", commit: "abcdef1234567",
      note: "Resolved", issuePublicId: "BUG-42",
    }, now);
    expect(patch).toMatchObject({
      fixStatus: "FIXED",
      fixedInCommit: "abcdef1234567",
      fixedAt: now,
      regressedAt: null,
      issuePublicId: "BUG-42",
    });
    expect(Object.keys(patch)).not.toContain("occurrenceCount");
    expect(Object.keys(patch)).not.toContain("pollCursorAt");
    expect(prior.fixStatus).toBe("OPEN");
  });

  it("EXPECTED mutes, then OPEN clears only EXPECTED mute and fix markers", () => {
    const expected = knownErrorTriagePatch(prior, {
      action: "STATUS", status: "EXPECTED", note: "Intentional retry",
    }, now);
    expect(expected).toMatchObject({
      fixStatus: "EXPECTED", muted: true, mutedReason: "Intentional retry",
      fixedAt: null, fixedInCommit: null, regressedAt: null,
    });
    const reopened = knownErrorTriagePatch({
      ...prior, ...expected,
    }, { action: "STATUS", status: "OPEN" }, now);
    expect(reopened).toMatchObject({
      fixStatus: "OPEN", muted: false, mutedReason: null, fixedAt: null,
    });
  });

  it("OPEN after independent MUTE does not silently unmute the alert", () => {
    const patch = knownErrorTriagePatch({
      ...prior, muted: true, mutedReason: "On-call decision",
    }, { action: "STATUS", status: "OPEN" }, now);
    expect(patch).not.toHaveProperty("muted");
  });

  it("LINK_ISSUE retains triage and clears association on request", () => {
    expect(knownErrorTriagePatch(prior, {
      action: "LINK_ISSUE", issuePublicId: "BT-100",
    }, now)).toEqual({ issuePublicId: "BT-100" });
    expect(knownErrorTriagePatch(prior, {
      action: "LINK_ISSUE", issuePublicId: null,
    }, now)).toEqual({ issuePublicId: null });
  });

  it("rejects unknown changes and overlong or invalid issue/commit fields", () => {
    for (const invalid of [
      { action: "DELETE" },
      { action: "STATUS", status: "FIXED", commit: "not a commit" },
      { action: "STATUS", status: "EXPECTED", note: "a".repeat(501) },
      { action: "LINK_ISSUE", issuePublicId: "X".repeat(33) },
      { action: "MUTE", muted: "yes" },
    ]) expect(knownErrorMutationSchema.safeParse(invalid).success).toBe(false);
  });
});
