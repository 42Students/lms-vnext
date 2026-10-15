import {describe,it,expect} from "vitest";
import {learnerAssessmentFiltersActive} from "@/modules/courses/learner-assessment-filters-active-model";
const empty={courseId:"",search:"",stateFilter:"ALL",sort:"DUE"} as const;
describe("learner All Assignments and Quizzes filter recovery",()=>{
 it("offers a reset for every material filter",()=>{
  expect(learnerAssessmentFiltersActive(empty)).toBe(false);
  expect(learnerAssessmentFiltersActive({...empty,courseId:"own-course"})).toBe(true);
  expect(learnerAssessmentFiltersActive({...empty,search:" biology "})).toBe(true);
  expect(learnerAssessmentFiltersActive({...empty,stateFilter:"OVERDUE"})).toBe(true);
  expect(learnerAssessmentFiltersActive({...empty,sort:"TITLE"})).toBe(true);
 });
 it("does not treat whitespace-only search as a filter",()=>expect(learnerAssessmentFiltersActive({...empty,search:"  "})).toBe(false));
});
