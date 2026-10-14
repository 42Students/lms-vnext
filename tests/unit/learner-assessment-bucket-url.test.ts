import {describe,expect,it} from "vitest";
import {learnerAssessmentDueHref,readLearnerAssessmentDueFromUrl} from "@/modules/placements/learner-assessment-bucket-url-model";
describe("assessment bucket URLs",()=>{
 it("round trips later/past/unscheduled and strips forged identity scope",()=>{
  const source="https://fake.test/learn/my-placements/assessments?q=aptitude&collegeId=other";
  const path=learnerAssessmentDueHref(source,"later");
  expect(path).toBe("/learn/my-placements/assessments?q=aptitude&due=later");
  expect(readLearnerAssessmentDueFromUrl(path.slice(path.indexOf("?")))).toBe("later");
  expect(learnerAssessmentDueHref(source,"past")).toContain("due=past");
  expect(learnerAssessmentDueHref(source,"unscheduled")).toContain("due=unscheduled");
 });
 it("denies duplicate and unsupported bucket selectors",()=>{
  expect(readLearnerAssessmentDueFromUrl("?due=later&due=later")).toBe("all");
  expect(readLearnerAssessmentDueFromUrl("?due=foreign")).toBe("all");
  expect(learnerAssessmentDueHref("/learn/my-placements/assessments?due=later","all"))
    .toBe("/learn/my-placements/assessments");
 });
});
