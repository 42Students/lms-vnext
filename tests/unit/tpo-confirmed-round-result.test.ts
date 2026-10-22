import { describe, expect, it } from "vitest";
import {
  canApplyTpoRoundResult,
  canEditTpoRoundResult,
  confirmedTpoRoundResultSchema,
  TPO_RESULT_LABELS,
} from "@/modules/placements/tpo-confirmed-round-result-model";

const id = "10000000-0000-4000-8000-000000000005";
const body = {
  confirmed: true as const,
  expectedCurrentResultId: null,
  result: { applicationId: id, outcome: "PASS" as const },
};

describe("confirmed TPO round results", () => {
  it("requires confirmation, a strictly scoped payload, and explicit snapshot", () => {
    expect(confirmedTpoRoundResultSchema.safeParse(body).success).toBe(true);
    expect(confirmedTpoRoundResultSchema.safeParse({ ...body, confirmed: false }).success).toBe(false);
    expect(confirmedTpoRoundResultSchema.safeParse({
      confirmed: true, result: body.result,
    }).success).toBe(false);
    expect(confirmedTpoRoundResultSchema.safeParse({
      ...body, collegeId: id,
    }).success).toBe(false);
    expect(confirmedTpoRoundResultSchema.safeParse({
      ...body, result: { ...body.result, internalCollegeId: id },
    }).success).toBe(false);
  });

  it("preserves required messaging and ranked hold constraints", () => {
    expect(confirmedTpoRoundResultSchema.safeParse({
      ...body, result: { applicationId: id, outcome: "FAIL" },
    }).success).toBe(false);
    expect(confirmedTpoRoundResultSchema.safeParse({
      ...body, result: { applicationId: id, outcome: "HOLD",
        candidateMessage: "Waitlisted", waitlistRank: 3 },
    }).success).toBe(true);
    expect(confirmedTpoRoundResultSchema.safeParse({
      ...body, result: { applicationId: id, outcome: "HOLD",
        candidateMessage: "Waitlisted" },
    }).success).toBe(false);
  });

  it("never equates a staged result to an applied result", () => {
    expect(canEditTpoRoundResult(
      { kind: "INTERVIEW", status: "SCHEDULED" }, { resultStatus: "STAGED" },
    )).toBe(true);
    expect(canApplyTpoRoundResult(
      { kind: "INTERVIEW", status: "SCHEDULED" }, { resultStatus: "STAGED" },
    )).toBe(false);
    expect(canApplyTpoRoundResult(
      { kind: "INTERVIEW", status: "COMPLETED" }, { resultStatus: "STAGED" },
    )).toBe(true);
    expect(canEditTpoRoundResult(
      { kind: "INTERVIEW", status: "COMPLETED" }, { resultStatus: "APPLIED" },
    )).toBe(false);
    expect(canEditTpoRoundResult(
      { kind: "TALK", status: "SCHEDULED" }, { resultStatus: null },
    )).toBe(false);
    expect(TPO_RESULT_LABELS.PASS).toBe("Pass");
    expect(Object.keys(TPO_RESULT_LABELS)).not.toContain("SELECTED");
  });
});
