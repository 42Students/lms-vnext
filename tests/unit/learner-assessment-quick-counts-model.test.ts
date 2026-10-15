import {describe,expect,it} from "vitest";
import {learnerAssessmentQuickCounts} from "@/modules/courses/learner-assessment-quick-counts-model";
describe("learner aggregate assessment quick states",()=>{
 const now=Date.parse("2026-10-15T12:00:00Z");
 it("never calls a submitted or graded item pending",()=>{
  const rows=[
   {kind:"ASSIGNMENT" as const,submittedAt:null,gradePublished:false,dueAt:"2026-10-16T12:00:00Z"},
   {kind:"ASSIGNMENT" as const,submittedAt:"2026-10-14T12:00:00Z",gradePublished:true,dueAt:"2026-10-13T12:00:00Z"},
  ];
  expect(Object.fromEntries(learnerAssessmentQuickCounts(rows,now).map(row=>[row.value,row.count])))
   .toMatchObject({PENDING:1,DUE_SOON:1,OVERDUE:0,RESULTS:1});
 });
 it("counts expired unattempted quizzes only as missed, not pending",()=>{
  const rows=[{kind:"QUIZ" as const,attemptsUsed:0,attemptsRemaining:1,
    status:"CLOSED" as const,resultsPublished:false,dueAt:null}];
  expect(Object.fromEntries(learnerAssessmentQuickCounts(rows,now).map(row=>[row.value,row.count])))
   .toMatchObject({PENDING:0,DUE_SOON:0,OVERDUE:1,RESULTS:0});
 });
});
