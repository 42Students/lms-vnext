import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";

describe("learner placement preview override batching",()=>{
 it("preloads per-job overrides instead of querying once per published row",()=>{
  const source=readFileSync("src/modules/placements/eligibility-service.ts","utf8");
  const learner=readFileSync("src/modules/placements/learner-job-service.ts","utf8");
  const batch=source.slice(source.indexOf("export async function evaluatePlacementEligibilityForLearnerJobs"),
    source.indexOf("/** Preload all active overrides"));
  expect(batch).toContain("inArray(placementEligibilityOverrides.jobId");
  expect(batch).toContain("eq(placementEligibilityOverrides.membershipId,membership.id)");
  expect(batch).toContain("isNull(placementEligibilityOverrides.revokedAt)");
  expect(batch).toContain("evaluatePlacementEligibilityInternal(context,id");
  expect(learner).toContain("evaluatePlacementEligibilityForLearnerJobs(");
  expect(learner).not.toContain("evaluatePlacementEligibility(\n              context,");
 });
});
