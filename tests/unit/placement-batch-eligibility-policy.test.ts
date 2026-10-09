import { describe, expect, it } from "vitest";
import {
  canUseCoordinatorDriveDay,
  getLearnerPlacementAccess,
  resolvePlacementParticipation,
  type PlacementScopeDecision,
} from "@/modules/placements/batch-eligibility-policy";

const eligible: PlacementScopeDecision = {
  status: "ELIGIBLE",
  reason: null,
  note: null,
  decidedAt: new Date("2026-10-10T00:00:00.000Z"),
};
const ineligible: PlacementScopeDecision = {
  status: "INELIGIBLE",
  reason: "Higher studies",
  note: null,
  decidedAt: new Date("2026-10-10T01:00:00.000Z"),
};

describe("DB08 placement participation scope inheritance", () => {
  it("uses NOT_DECIDED when no scope has a decision", () => {
    expect(resolvePlacementParticipation({
      learner: null,
      section: null,
      cohort: null,
    })).toEqual({
      status: "NOT_DECIDED",
      level: null,
      reason: null,
      note: null,
      decidedAt: null,
    });
  });

  it("inherits cohort eligibility and a class override", () => {
    const inherited = resolvePlacementParticipation({
      learner: null, section: null, cohort: eligible,
    });
    expect(inherited.status).toBe("ELIGIBLE");
    expect(inherited.level).toBe("BATCH");

    const overridden = resolvePlacementParticipation({
      learner: null, section: ineligible, cohort: eligible,
    });
    expect(overridden).toEqual({
      status: "INELIGIBLE",
      level: "CLASS",
      reason: "Higher studies",
      note: null,
      decidedAt: ineligible.decidedAt,
    });
  });

  it("learner-level decision wins even when class and cohort differ", () => {
    const result = resolvePlacementParticipation({
      learner: eligible, section: ineligible, cohort: ineligible,
    });
    expect(result.status).toBe("ELIGIBLE");
    expect(result.level).toBe("LEARNER");
  });

  it("clearing own decision falls back to inherited class", () => {
    const original = resolvePlacementParticipation({
      learner: eligible, section: ineligible, cohort: eligible,
    });
    const cleared = resolvePlacementParticipation({
      learner: null, section: ineligible, cohort: eligible,
    });
    expect(original.status).toBe("ELIGIBLE");
    expect(cleared.status).toBe("INELIGIBLE");
    expect(cleared.level).toBe("CLASS");
  });

  it("transfers between classes without retaining the old class decision", () => {
    const before = resolvePlacementParticipation({
      learner: null, section: ineligible, cohort: eligible,
    });
    const after = resolvePlacementParticipation({
      learner: null, section: null, cohort: eligible,
    });
    expect(before.status).toBe("INELIGIBLE");
    expect(after.status).toBe("ELIGIBLE");
  });
});

describe("DB08 student placement visibility and Drive Day exception", () => {
  it("does not expose placement when the college module is off", () => {
    const decision = resolvePlacementParticipation({
      learner: eligible, section: null, cohort: null,
    });
    expect(getLearnerPlacementAccess({
      collegeModuleEnabled: false, decision, batchFinished: false,
    })).toEqual({ showPlacements: false, canSelfApply: false });
  });

  it("hides unapproved or ineligible students without leaking reasons", () => {
    for (const hierarchy of [
      { learner: null, section: null, cohort: null },
      { learner: ineligible, section: eligible, cohort: eligible },
    ]) {
      const access = getLearnerPlacementAccess({
        collegeModuleEnabled: true,
        decision: resolvePlacementParticipation(hierarchy),
        batchFinished: false,
      });
      expect(access).toEqual({ showPlacements: false, canSelfApply: false });
      expect(JSON.stringify(access)).not.toContain("Higher studies");
    }
  });

  it("finished batch remains visible only where eligible but cannot self-apply", () => {
    const decision = resolvePlacementParticipation({
      learner: null, section: null, cohort: eligible,
    });
    expect(getLearnerPlacementAccess({
      collegeModuleEnabled: true, decision, batchFinished: true,
    })).toEqual({ showPlacements: true, canSelfApply: false });
  });

  it("drive-day assignment authorization is independent of eligibility", () => {
    expect(canUseCoordinatorDriveDay({
      collegeModuleEnabled: true,
      hasActiveCoordinatorAssignment: true,
    })).toBe(true);
    expect(canUseCoordinatorDriveDay({
      collegeModuleEnabled: true,
      hasActiveCoordinatorAssignment: false,
    })).toBe(false);
    expect(canUseCoordinatorDriveDay({
      collegeModuleEnabled: false,
      hasActiveCoordinatorAssignment: true,
    })).toBe(false);
  });
});
