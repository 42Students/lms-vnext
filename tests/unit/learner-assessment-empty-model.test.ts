import {describe,it,expect} from "vitest";
import {learnerAssessmentEmptyMessage} from "@/modules/courses/learner-assessment-empty-model";
describe("learner aggregate assessment empty states",()=>{
 const base={kind:"QUIZ" as const,courseSelected:false,search:"",stateFilter:"ALL"};
 it("distinguishes empty search without claiming no published quizzes",()=>{
  expect(learnerAssessmentEmptyMessage({...base,search:"chapter 7"}).title).toContain("chapter 7");
 });
 it("distinguishes own Course and quiz state filters",()=>{
  expect(learnerAssessmentEmptyMessage({...base,courseSelected:true}).title).toContain("this course");
  expect(learnerAssessmentEmptyMessage({...base,stateFilter:"OVERDUE"}).description).toContain("state filter");
 });
});
