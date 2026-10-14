import { describe, expect, it } from "vitest";
import {
  collegeRulePreviewInputSchema,
  projectCollegeGroupRulePreview,
} from "@/modules/groups/college-rule-preview-model";
import { groupRuleCriteriaSchema } from "@/modules/groups/rule-evaluator";

const criteria = groupRuleCriteriaSchema.parse({
  allowedProgramIds: ["10000000-0000-4000-8000-000000000001"],
});
const candidate = {
  membershipId: "20000000-0000-4000-8000-000000000001",
  programId: "10000000-0000-4000-8000-000000000001",
  cohortId: "30000000-0000-4000-8000-000000000001",
  cgpaHundredths: null,
  activeBacklogs: null,
  passingYear: null,
};

describe("College group rule preview projection", () => {
  it("accepts only a validated group identifier", () => {
    expect(collegeRulePreviewInputSchema.safeParse({ groupId: candidate.cohortId }).success).toBe(true);
    expect(collegeRulePreviewInputSchema.safeParse({
      groupId: candidate.cohortId,
      collegeId: "20000000-0000-4000-8000-000000000002",
    }).success).toBe(false);
  });

  it("counts matching and active-existing memberships without writing", () => {
    const preview = projectCollegeGroupRulePreview(criteria, [candidate], new Set(), false);
    expect(preview).toEqual({
      examined: 1, matched: 1, alreadyActive: 0, potentiallyNew: 1, incomplete: false,
    });
    expect(projectCollegeGroupRulePreview(criteria, [candidate],
      new Set([candidate.membershipId]), false)).toMatchObject({
      matched: 1, alreadyActive: 1, potentiallyNew: 0,
    });
  });

  it("labels truncated or mismatched subsets without inventing final counts", () => {
    const other = { ...candidate, programId: "10000000-0000-4000-8000-000000000002" };
    expect(projectCollegeGroupRulePreview(criteria, [other], new Set(), true)).toEqual({
      examined: 1, matched: 0, alreadyActive: 0, potentiallyNew: 0, incomplete: true,
    });
  });
});
