import { describe, expect, it } from "vitest";
import { groupRuleCriteriaSchema, matchesGroupRuleCandidate } from "@/modules/groups/rule-evaluator";

const allowedProgram="a0000000-0000-4000-8000-000000000001";
const allowedCohort="b0000000-0000-4000-8000-000000000001";
const candidate={programId:allowedProgram,cohortId:allowedCohort,
  cgpaHundredths:800,activeBacklogs:0,passingYear:2026};
describe("DB03 rule criteria evaluator: fail closed on unknown/missing evidence", () => {
  it("matches all bounded supported criteria", () => {
    const criteria=groupRuleCriteriaSchema.parse({
      allowedProgramIds:[allowedProgram],allowedCohortIds:[allowedCohort],
      minCgpa:7.5,maxActiveBacklogs:0,allowedPassingYears:[2026],
    });
    expect(matchesGroupRuleCandidate(criteria,candidate)).toBe(true);
    expect(matchesGroupRuleCandidate(criteria,{...candidate,cgpaHundredths:749})).toBe(false);
    expect(matchesGroupRuleCandidate(criteria,{...candidate,cgpaHundredths:null})).toBe(false);
    expect(matchesGroupRuleCandidate(criteria,{...candidate,programId:"c0000000-0000-4000-8000-000000000001"})).toBe(false);
    expect(matchesGroupRuleCandidate(criteria,{...candidate,activeBacklogs:null})).toBe(false);
    expect(matchesGroupRuleCandidate(criteria,{...candidate,passingYear:2027})).toBe(false);
  });
  it("rejects empty and unsupported policy shapes rather than over-enrolling", () => {
    expect(() => groupRuleCriteriaSchema.parse({})).toThrow();
    expect(() => groupRuleCriteriaSchema.parse({ minCgpa:5, branches:["CSE"] })).toThrow();
  });
});
