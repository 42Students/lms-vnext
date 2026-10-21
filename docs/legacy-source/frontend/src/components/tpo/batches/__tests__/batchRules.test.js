import { BATCH_STAGE, DECISION, STATE, batchYears, decisionCounts, learnerChanges, nextStep, visibleBatches, wouldChange } from "../batchRules";

const b = (over) => ({ batchId: 1, students: 120, eligible: 0, ineligible: 0, notDecided: 120, invited: 0, registered: 0, verified: 0, placed: 0, state: "NOT_STARTED", ...over });

test("the one next step walks the journey: decide, invite, register, verify, drives", () => {
  expect(nextStep(b()).label).toBe("Decide who is in placements");
  expect(nextStep(b({ notDecided: 20, ineligible: 100 })).label).toBe("Review decisions");
  expect(nextStep(b({ eligible: 100, notDecided: 20, state: "IN_PLACEMENTS" }))).toMatchObject({ key: "invite", label: "Invite 100 to register", tab: "students" });
  expect(nextStep(b({ eligible: 100, invitedAt: "2026-10-01", registered: 60 }))).toMatchObject({ key: "remind", label: "40 still to register" });
  expect(nextStep(b({ eligible: 100, invitedAt: "x", registered: 100, verified: 70 }))).toMatchObject({ key: "verify", href: "/tpo/verification" });
  expect(nextStep(b({ eligible: 100, invitedAt: "x", registered: 100, verified: 100 }))).toMatchObject({ key: "drives", href: "/tpo/drives" });
  expect(nextStep(b({ students: 0, notDecided: 0 }))).toMatchObject({ key: "empty", disabled: true });
  expect(nextStep(b({ state: "FINISHED", eligible: 100 })).key).toBe("view");
});

test("batch lifecycle, decision and stage labels carry semantic presentation metadata", () => {
  expect(STATE.IN_PLACEMENTS).toMatchObject({ label: "In placements", status: "active", tone: "success" });
  expect(STATE.FINISHED).toMatchObject({ label: "Finished", status: "closed", tone: "neutral" });

  expect(DECISION.ELIGIBLE).toMatchObject({ label: "Eligible", status: "active", tone: "success" });
  expect(DECISION.INELIGIBLE).toMatchObject({ label: "Ineligible", status: "failed", tone: "error" });
  expect(DECISION.NOT_DECIDED).toMatchObject({ label: "Not decided", status: "pending", tone: "warning" });

  expect(BATCH_STAGE.INVITED).toMatchObject({ label: "Invited", status: "scheduled", tone: "info" });
  expect(BATCH_STAGE.PLACED).toMatchObject({ label: "Placed", status: "evaluated", tone: "success" });
});

test("finished batches are hidden unless the State filter asks for them", () => {
  const list = [b({ batchId: 1 }), b({ batchId: 2, state: "FINISHED" })];
  expect(visibleBatches(list, {}).map((x) => x.batchId)).toEqual([1]);
  expect(visibleBatches(list, { state: ["FINISHED"] }).map((x) => x.batchId)).toEqual([1, 2]);
});

test("counts, years and the change list for a selection", () => {
  expect(decisionCounts([{ eligibility: "ELIGIBLE" }, { eligibility: "INELIGIBLE" }, {}, { eligibility: "ELIGIBLE" }]))
    .toEqual({ total: 4, ELIGIBLE: 2, INELIGIBLE: 1, NOT_DECIDED: 1 });
  expect(batchYears({ startDate: "2023-08-01", endDate: "2027-06-30" })).toBe("2023–27");
  expect(learnerChanges([{ learnerId: 5 }], "INELIGIBLE", "Discontinued")).toEqual([{ scopeType: "LEARNER", scopeId: 5, status: "INELIGIBLE", reason: "Discontinued" }]);
  expect(learnerChanges([{ learnerId: 5 }], null)).toEqual([{ scopeType: "LEARNER", scopeId: 5, status: null, reason: undefined }]);
  expect(wouldChange([{ ownDecision: "ELIGIBLE" }, { ownDecision: null }], "ELIGIBLE")).toBe(1);
  expect(wouldChange([{ ownDecision: "INELIGIBLE", ownReason: "A" }], "INELIGIBLE", "B")).toBe(1);
});
