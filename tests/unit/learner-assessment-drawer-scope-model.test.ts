import {describe,it,expect} from "vitest";
import {learnerAssessmentDrawerSelectionAllowed} from "@/modules/courses/learner-assessment-drawer-scope-model";
const rows=[{kind:"ASSIGNMENT" as const,id:"a",deliveryId:"own"}];
describe("learner Assignment drawer visibility",()=>{
 it("shows only a selected assignment present in current filtered results",()=>{
  expect(learnerAssessmentDrawerSelectionAllowed("own:a",rows)).toBe(true);
  expect(learnerAssessmentDrawerSelectionAllowed("other:a",rows)).toBe(false);
  expect(learnerAssessmentDrawerSelectionAllowed("own:a",[])).toBe(false);
 });
 it("does not select an assessment on a missing or forged key",()=>{
  expect(learnerAssessmentDrawerSelectionAllowed(null,rows)).toBe(false);
  expect(learnerAssessmentDrawerSelectionAllowed("own:b",[{kind:"QUIZ",id:"b",deliveryId:"own"}])).toBe(false);
 });
});
