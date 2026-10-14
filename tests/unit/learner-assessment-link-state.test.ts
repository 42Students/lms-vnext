import {describe,expect,it} from "vitest";
import {learnerAssessmentLinkState,filterLearnerAssessmentsMissingLink} from "@/modules/placements/learner-assessment-link-state-model";
describe("assessment employer-link readiness",()=>{
 it("keeps scheduled rounds with absent link separate from unscheduled rounds with a link",()=>{
  const rows=[{roundId:"a",scheduledAt:"2026-10-18T03:00:00Z",testUrl:null},
   {roundId:"b",scheduledAt:null,testUrl:"https://assessment.example.test"},
   {roundId:"c",scheduledAt:"2026-10-18T03:00:00Z",testUrl:"javascript:alert(1)"}];
  expect(filterLearnerAssessmentsMissingLink(rows).map(x=>x.roundId)).toEqual(["a","c"]);
  expect(learnerAssessmentLinkState(rows[1])).toBe("READY");
 });
 it("rejects malformed and non-web URLs",()=>{
  expect(learnerAssessmentLinkState({testUrl:"relative/link"})).toBe("MISSING");
  expect(learnerAssessmentLinkState({testUrl:"file:///tmp/private"})).toBe("MISSING");
 });
});
