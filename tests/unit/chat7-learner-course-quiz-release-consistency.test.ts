import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {learnerQuizResultsReleased} from "@/modules/courses/learner-quiz-result-release-policy";
const now=Date.parse("2099-01-01T12:00:00.000Z");
describe("LEARNER-QUIZ-WORKSPACE-EMBARGO-01 consistent quiz result release across learner views",()=>{
 it("never announces quiz correctness before deadline, closure and explicit results publication",()=>{
  const dueAt=new Date(now);
  for(const status of ["DRAFT","PUBLISHED","ARCHIVED","CLOSED"]){
   for(const resultsPublished of [true,false]){
    for(const seenAt of [now-1,now,now+1]){
     const expected=status==="CLOSED"&&resultsPublished&&seenAt>=now;
     expect(learnerQuizResultsReleased({status,resultsPublished,dueAt},seenAt)).toBe(expected);
    }
   }
  }
 });
 it("rejects null, nonfinite deadline and invalid clock",()=>{
  expect(learnerQuizResultsReleased({status:"CLOSED",resultsPublished:true,dueAt:null},now)).toBe(false);
  expect(learnerQuizResultsReleased({status:"CLOSED",resultsPublished:true,dueAt:new Date("bad")},now)).toBe(false);
  expect(learnerQuizResultsReleased({status:"CLOSED",resultsPublished:true,dueAt:new Date(now)},Number.NaN)).toBe(false);
 });
 it("enforces this exact server-clock policy in both the course workspace and assessment feed",()=>{
  const workspace=readFileSync("src/modules/courses/learner-course-service.ts","utf8");
  const feed=readFileSync("src/modules/courses/learner-assessment-flat-query.ts","utf8");
  const attempts=readFileSync("src/modules/courses/quiz-attempt-service.ts","utf8");
  expect(workspace).toContain("learnerQuizResultsReleased(row,snapshotNowMs)");
  expect(feed).toContain("learnerQuizResultsReleased(row,nowMs)");
  expect(attempts).toContain("learnerQuizResultsReleased");
  expect(workspace).not.toContain("resultsPublished:\n          row.resultsPublished,");
  expect(workspace).toContain("const snapshotNowMs = Date.now()");
 });
});
