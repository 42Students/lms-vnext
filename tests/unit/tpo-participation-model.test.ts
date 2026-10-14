import { describe, expect, it } from "vitest";
import {
  canonicalTpoParticipationChange,
  hasTpoDecisionChanged,
  isTpoDecisionSnapshotCurrent,
  snapshotTpoMembershipDecision,
  tpoParticipationChangeSchema,
} from "@/modules/placements/tpo-participation-model";

describe("TPO registered participation decision helpers", () => {
  const expected = {
    status: null, reason: null, note: null, updatedAt: null,
  } as const;

  it("requires reasons for INELIGIBLE and rejects unknown registration choices", () => {
    expect(tpoParticipationChangeSchema.safeParse({
      status: "INELIGIBLE", expected,
    }).success).toBe(false);
    expect(tpoParticipationChangeSchema.safeParse({
      status: "HIGHER_STUDIES", reason: "Studies", expected,
    }).success).toBe(false);
    expect(tpoParticipationChangeSchema.safeParse({
      status: "PLACEMENTS", expected,
    }).success).toBe(false);
    expect(tpoParticipationChangeSchema.safeParse({
      status: "ELIGIBLE", expected, collegeId: "other",
    }).success).toBe(false);
  });

  it("clearing an override never records higher-studies registration or consent", () => {
    expect(canonicalTpoParticipationChange({
      status: "NOT_DECIDED", reason: "Higher studies", note: "No longer applicable",
    })).toEqual({ status: null, reason: null, note: null });
  });

  it("normalizes ineligible reasons and harmless notes", () => {
    expect(canonicalTpoParticipationChange({
      status: "INELIGIBLE", reason: "  College decision  ",
      note: "  Revisit  ",
    })).toEqual({
      status: "INELIGIBLE", reason: "College decision", note: "Revisit",
    });
    expect(canonicalTpoParticipationChange({
      status: "ELIGIBLE", reason: "ignored", note: "  restored ",
    })).toEqual({
      status: "ELIGIBLE", reason: null, note: "restored",
    });
  });

  it("detects no-op changes and reason-only changes", () => {
    const state = { status: "INELIGIBLE" as const, reason: "A", note: null };
    expect(hasTpoDecisionChanged(state, state)).toBe(false);
    expect(hasTpoDecisionChanged(state, { ...state, reason: "B" })).toBe(true);
  });

  it("uses a complete optimistic snapshot to reject stale writes", () => {
    const actual = snapshotTpoMembershipDecision({
      status: "ELIGIBLE",
      reason: null,
      note: "Current",
      updatedAt: new Date("2026-10-14T00:00:00.000Z"),
    });
    expect(isTpoDecisionSnapshotCurrent(actual, actual)).toBe(true);
    expect(isTpoDecisionSnapshotCurrent(actual, {
      ...actual, note: "Stale",
    })).toBe(false);
    expect(isTpoDecisionSnapshotCurrent(actual, expected)).toBe(false);
    expect(snapshotTpoMembershipDecision(null)).toEqual(expected);
  });

  it("rejects invalid reason lengths and foreign scope fields", () => {
    expect(tpoParticipationChangeSchema.safeParse({
      status: "INELIGIBLE", reason: "x".repeat(201), expected,
    }).success).toBe(false);
    expect(tpoParticipationChangeSchema.safeParse({
      status: "ELIGIBLE", expected, scopeType: "COHORT",
    }).success).toBe(false);
  });
});
