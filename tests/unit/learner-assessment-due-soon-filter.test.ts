import {describe,expect,it} from "vitest";
import {learnerAssessmentMatchesState} from "@/modules/courses/learner-assessment-state-filter-model";
const now=Date.parse("2026-10-15T09:00:00Z");
const due=new Date(now+60*60*1000).toISOString();
const assignment={kind:"ASSIGNMENT" as const,submittedAt:null,gradePublished:false,dueAt:due};
const quiz={kind:"QUIZ" as const,attemptsUsed:0,attemptsRemaining:1,status:"PUBLISHED" as const,dueAt:due,resultsPublished:false};
describe("learner assessment Due Soon",()=>{
 it("shows actionable pending items due in the next 72 hours",()=>{
  expect(learnerAssessmentMatchesState(assignment,"DUE_SOON",now)).toBe(true);
  expect(learnerAssessmentMatchesState(quiz,"DUE_SOON",now)).toBe(true);
  expect(learnerAssessmentMatchesState({...assignment,dueAt:null},"DUE_SOON",now)).toBe(false);
  expect(learnerAssessmentMatchesState({...assignment,dueAt:new Date(now+73*60*60*1000).toISOString()},"DUE_SOON",now)).toBe(false);
 });
 it("does not invent urgency for expired, submitted, closed or exhausted items",()=>{
  expect(learnerAssessmentMatchesState({...assignment,submittedAt:due},"DUE_SOON",now)).toBe(false);
  expect(learnerAssessmentMatchesState({...quiz,status:"CLOSED"},"DUE_SOON",now)).toBe(false);
  expect(learnerAssessmentMatchesState({...quiz,attemptsRemaining:0},"DUE_SOON",now)).toBe(false);
  expect(learnerAssessmentMatchesState({...quiz,dueAt:new Date(now-1000).toISOString()},"DUE_SOON",now)).toBe(false);
 });
});
