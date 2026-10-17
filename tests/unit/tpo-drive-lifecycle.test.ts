import { describe, expect, it } from "vitest";
import { evaluateTpoDriveLifecycle, tpoDriveLifecycleSchema } from "@/modules/placements/tpo-drive-lifecycle-model";

const base = {
  jobStatus: "DRAFT",
  seasonActive: true,
  companyActive: true,
  roleCount: 1,
  evaluativeRoundCount: 1,
  policyPersisted: true,
  deadlineValid: true,
  deadlinePresent: true,
  payPresent: true,
  externalUrlPresent: true,
  appliedResultCount: 0,
  acceptedOfferCount: 0,
};

describe("TPO drive publish / close / reopen transitions", () => {
  it("requires explicit confirmation and rejects unexpected scope keys", () => {
    expect(tpoDriveLifecycleSchema.safeParse({
      action: "PUBLISH", expectedStatus: "DRAFT", confirmed: true,
      reason: "Job and college preflight approved",
    }).success).toBe(true);
    expect(tpoDriveLifecycleSchema.safeParse({
      action: "PUBLISH", expectedStatus: "DRAFT", confirmed: false,
      reason: "Job and college preflight approved",
    }).success).toBe(false);
    expect(tpoDriveLifecycleSchema.safeParse({
      action: "PUBLISH", expectedStatus: "DRAFT", confirmed: true,
      reason: "Job and college preflight approved", collegeId: "forged",
    }).success).toBe(false);
  });
  it("blocks publish without real round, role, policy or company readiness", () => {
    expect(evaluateTpoDriveLifecycle("PUBLISH", base).allowed).toBe(true);
    expect(evaluateTpoDriveLifecycle("PUBLISH", {
      ...base, roleCount: 0, policyPersisted: false, evaluativeRoundCount: 0,
      companyActive: false, seasonActive: false, deadlineValid: false,
    }).blockers).toEqual(expect.arrayContaining([
      "NO_ACTIVE_ROLE", "ELIGIBILITY_POLICY_NOT_PERSISTED",
      "NO_EVALUATIVE_ROUND", "COMPANY_NOT_ACTIVE", "SEASON_NOT_ACTIVE",
      "APPLICATION_DEADLINE_PASSED",
    ]));
  });
  it("closes a published drive; forbids reopening after applied results or offers", () => {
    expect(evaluateTpoDriveLifecycle("CLOSE", {
      ...base, jobStatus: "PUBLISHED",
    }).allowed).toBe(true);
    expect(evaluateTpoDriveLifecycle("REOPEN", {
      ...base, jobStatus: "CLOSED",
    }).allowed).toBe(true);
    expect(evaluateTpoDriveLifecycle("REOPEN", {
      ...base, jobStatus: "CLOSED",
      appliedResultCount: 1, acceptedOfferCount: 2,
    }).blockers).toEqual(["APPLIED_RESULTS_EXIST", "ACCEPTED_OFFERS_EXIST"]);
    expect(evaluateTpoDriveLifecycle("REOPEN", base).allowed).toBe(false);
  });
});
