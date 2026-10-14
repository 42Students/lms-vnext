import { describe, expect, it } from "vitest";
import {
  buildTpoDebarDecision,
  isTpoDebarDecision,
  tpoDebarActionSchema,
  TPO_DEBAR_REASON_PREFIX,
} from "@/modules/placements/tpo-debar-model";
import {
  canonicalTpoParticipationChange,
  type TpoMembershipDecisionSnapshot,
} from "@/modules/placements/tpo-participation-model";
import { canUseLearnerPlacements } from "@/modules/placements/learner-participation-guard";
import { resolvePlacementParticipationFromDecisions } from "@/modules/placements/access-service";

const eligible: TpoMembershipDecisionSnapshot = {
  status: "ELIGIBLE",
  reason: null,
  note: null,
  updatedAt: "2026-10-14T00:00:00.000Z",
};

describe("TPO Debar as member-level participation restriction", () => {
  it("requires a bounded nonempty reason and rejects forged fields", () => {
    for (const invalid of [
      { action: "DEBAR" },
      { action: "DEBAR", reason: "   " },
      { action: "DEBAR", reason: "x".repeat(194) },
      { action: "DEBAR", reason: "Valid", collegeId: "foreign" },
      { action: "REMOVE_DEBAR", reason: "unexpected" },
      { action: "OTHER", reason: "unexpected" },
    ]) {
      expect(tpoDebarActionSchema.safeParse(invalid).success).toBe(false);
    }
  });

  it("builds the existing validated INELIGIBLE payload with an optimistic snapshot", () => {
    const input = buildTpoDebarDecision(
      { action: "DEBAR", reason: "  Placement misconduct  " },
      eligible,
    );
    expect(input).toEqual({
      status: "INELIGIBLE",
      reason: "Debar: Placement misconduct",
      expected: eligible,
    });
    expect(canonicalTpoParticipationChange(input)).toEqual({
      status: "INELIGIBLE",
      reason: "Debar: Placement misconduct",
      note: null,
    });
    expect(isTpoDebarDecision({
      ...eligible,
      status: "INELIGIBLE",
      reason: input.reason,
    })).toBe(true);
  });

  it("does not override or remove unrelated INELIGIBLE decisions", () => {
    const unrelated: TpoMembershipDecisionSnapshot = {
      ...eligible,
      status: "INELIGIBLE",
      reason: "Higher studies",
    };
    expect(isTpoDebarDecision(unrelated)).toBe(false);
    expect(() => buildTpoDebarDecision(
      { action: "DEBAR", reason: "Misconduct" },
      unrelated,
    )).toThrow();
    expect(() => buildTpoDebarDecision(
      { action: "REMOVE_DEBAR" },
      unrelated,
    )).toThrow();
  });

  it("removes only Debar-tagged membership overrides, restoring inherited decision", () => {
    const current: TpoMembershipDecisionSnapshot = {
      ...eligible,
      status: "INELIGIBLE",
      reason: TPO_DEBAR_REASON_PREFIX + "Policy violation",
    };
    const input = buildTpoDebarDecision(
      { action: "REMOVE_DEBAR" },
      current,
    );
    expect(input).toEqual({
      status: "NOT_DECIDED",
      expected: current,
    });
    expect(canonicalTpoParticipationChange(input)).toEqual({
      status: null, reason: null, note: null,
    });
  });

  it("the existing participation resolver blocks module access while Debar applies", () => {
    const chain = [
      { scopeType: "MEMBERSHIP" as const, scopeId: "learner" },
      { scopeType: "SECTION" as const, scopeId: "class" },
    ];
    const direct = {
      scopeType: "MEMBERSHIP",
      scopeId: "learner",
      status: "INELIGIBLE",
      reason: "Debar: Restricted",
      note: null,
    };
    const inherited = {
      scopeType: "SECTION",
      scopeId: "class",
      status: "ELIGIBLE",
      reason: null,
      note: null,
    };
    const denied = resolvePlacementParticipationFromDecisions(
      chain,
      [direct, inherited],
    );
    expect(denied.status).toBe("INELIGIBLE");
    expect(denied.level).toBe("MEMBERSHIP");
    expect(canUseLearnerPlacements({
      moduleEnabled: true,
      participation: denied.status,
    })).toBe(false);
    const restored = resolvePlacementParticipationFromDecisions(
      chain,
      [inherited],
    );
    expect(restored.status).toBe("ELIGIBLE");
    expect(restored.level).toBe("SECTION");
  });
});
