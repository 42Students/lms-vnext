import {describe,expect,it} from "vitest";
import {learnerQuizResultsReleased} from "@/modules/courses/learner-quiz-result-release-policy";

const now=Date.parse("2099-01-01T12:00:00.000Z");
const ready={status:"CLOSED",resultsPublished:true,dueAt:new Date(now)};

describe("COURSES7-07 private answer-key release boundary",()=>{
 it("COURSES7-07 closed published quiz reveals only at or after its persisted due instant",()=>{
  expect(learnerQuizResultsReleased(ready,now-1)).toBe(false);
  expect(learnerQuizResultsReleased(ready,now)).toBe(true);
  expect(learnerQuizResultsReleased(ready,now+1)).toBe(true);
  expect(learnerQuizResultsReleased({...ready,dueAt:new Date(now+1)},now)).toBe(false);
 });
 it("COURSES7-07 stale published flag cannot release results before closing quiz",()=>{
  for(const status of ["DRAFT","PUBLISHED","ARCHIVED","REOPENED"]){
   expect(learnerQuizResultsReleased({...ready,status},now+1000)).toBe(false);
  }
  expect(learnerQuizResultsReleased({...ready,resultsPublished:false},now+1000)).toBe(false);
 });
 it("COURSES7-07 invalid or missing due date and nonfinite clocks must fail closed",()=>{
  expect(learnerQuizResultsReleased({...ready,dueAt:null},now)).toBe(false);
  expect(learnerQuizResultsReleased({...ready,dueAt:new Date(Number.NaN)},now)).toBe(false);
  expect(learnerQuizResultsReleased(ready,Number.NaN)).toBe(false);
  expect(learnerQuizResultsReleased(ready,Infinity)).toBe(false);
 });
});
