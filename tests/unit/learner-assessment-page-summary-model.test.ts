import {describe,it,expect} from "vitest";
import {learnerAssessmentPageSummary} from "@/modules/courses/learner-assessment-page-summary-model";
describe("aggregate learner assessment paginated summary",()=>{
 it("announces only the actual visible 20-item window",()=>{
  expect(learnerAssessmentPageSummary({
   filteredCount:53,totalCount:90,currentPage:2,pageSize:20,label:"quizzes",
  })).toContain("Showing 21–40 of 53");
 });
 it("has a truthful empty and last page",()=>{
  expect(learnerAssessmentPageSummary({
   filteredCount:0,totalCount:12,currentPage:1,pageSize:20,label:"assignments",
  })).toContain("Showing 0–0 of 0");
  expect(learnerAssessmentPageSummary({
   filteredCount:42,totalCount:42,currentPage:3,pageSize:20,label:"assignments",
  })).toContain("Showing 41–42 of 42");
 });
});
