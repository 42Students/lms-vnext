import {describe,expect,it} from "vitest";
import {learnerQuizResultsReleased} from "@/modules/courses/learner-quiz-result-release-policy";
import {learnerAssessmentMatchesState} from "@/modules/courses/learner-assessment-state-filter-model";

const now=Date.parse("2026-10-18T05:00:00.000Z");
const prior=new Date(now-1),exact=new Date(now),future=new Date(now+1);
describe("COURSES-BREAK-LEARNER-RESULT-11 publish vs deadline vs session snapshot",()=>{
 it.each([
  ["PUBLISHED",true,prior,false],
  ["PUBLISHED",false,prior,false],
  ["CLOSED",false,prior,false],
  ["ARCHIVED",true,prior,false],
  ["CLOSED",true,null,false],
  ["CLOSED",true,future,false],
  ["CLOSED",true,exact,true],
  ["CLOSED",true,prior,true],
 ] as const)("%s/published=%s/due=%s yields visibility=%s",(status,published,due,visible)=>{
  expect(learnerQuizResultsReleased({status,resultsPublished:published,dueAt:due},now)).toBe(visible);
 });
 it("invalid dates and invalid clocks fail closed instead of releasing correct answers",()=>{
  expect(learnerQuizResultsReleased({status:"CLOSED",resultsPublished:true,dueAt:new Date(NaN)},now)).toBe(false);
  expect(learnerQuizResultsReleased({status:"CLOSED",resultsPublished:true,dueAt:prior},NaN)).toBe(false);
  expect(learnerQuizResultsReleased({status:"CLOSED",resultsPublished:true,dueAt:prior},Infinity)).toBe(false);
 });
 it("overview results never bypass server-time embargo even if stale published flag is true",()=>{
  const item=(dueAt:string|null,status:"PUBLISHED"|"CLOSED"="CLOSED")=>({
   kind:"QUIZ" as const,attemptsUsed:1,attemptsRemaining:0,status,dueAt,resultsPublished:true,
  });
  expect(learnerAssessmentMatchesState(item(prior.toISOString()),"RESULTS",now)).toBe(true);
  expect(learnerAssessmentMatchesState(item(exact.toISOString()),"RESULTS",now)).toBe(true);
  expect(learnerAssessmentMatchesState(item(future.toISOString()),"RESULTS",now)).toBe(false);
  expect(learnerAssessmentMatchesState(item(null),"RESULTS",now)).toBe(false);
  expect(learnerAssessmentMatchesState(item(prior.toISOString(),"PUBLISHED"),"RESULTS",now)).toBe(false);
 });
});
