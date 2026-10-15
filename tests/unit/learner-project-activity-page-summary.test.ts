import {describe,it,expect} from "vitest";
import {learnerProjectActivityPageSummary} from "@/modules/projects/learner-project-activity-page-summary-model";
describe("learner Project activity page-local counts",()=>{
 it("never implies text search covers all historical pages",()=>{
  expect(learnerProjectActivityPageSummary(3,47,true)).toBe("3 of 47 events match on this loaded page");
 });
 it("counts the currently loaded page, including empty state",()=>{
  expect(learnerProjectActivityPageSummary(0,0,false)).toBe("0 events on this loaded page");
  expect(learnerProjectActivityPageSummary(20,5,true)).toBe("5 of 5 events match on this loaded page");
 });
});
