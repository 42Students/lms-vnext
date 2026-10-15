import {describe,it,expect} from "vitest";
import {learnerAssessmentMatchesState} from "@/modules/courses/learner-assessment-state-filter-model";
const now=Date.parse("2026-10-15T09:00:00Z");
const due=new Date(now-1000).toISOString();
const assignment={kind:"ASSIGNMENT" as const,submittedAt:null,gradePublished:false,dueAt:due};
const quiz={kind:"QUIZ" as const,attemptsUsed:0,attemptsRemaining:1,status:"PUBLISHED" as const,dueAt:due,resultsPublished:false};
describe("learner overdue and missed assessments",()=>{
 it("classifies only authentic expired, uncompleted assessments",()=>{
  expect(learnerAssessmentMatchesState(assignment,"OVERDUE",now)).toBe(true);
  expect(learnerAssessmentMatchesState(quiz,"OVERDUE",now)).toBe(true);
  expect(learnerAssessmentMatchesState({...assignment,submittedAt:due},"OVERDUE",now)).toBe(false);
  expect(learnerAssessmentMatchesState({...quiz,attemptsUsed:1},"OVERDUE",now)).toBe(false);
 });
 it("does not treat undated assignments as overdue, but recognizes closed, unattempted quizzes",()=>{
  expect(learnerAssessmentMatchesState({...assignment,dueAt:null},"OVERDUE",now)).toBe(false);
  expect(learnerAssessmentMatchesState({...quiz,status:"CLOSED",dueAt:null},"OVERDUE",now)).toBe(true);
  expect(learnerAssessmentMatchesState({...quiz,dueAt:new Date(now+1000).toISOString()},"OVERDUE",now)).toBe(false);
 });
});
