import {describe,it,expect} from "vitest";
import {learnerAssessmentActionCounts} from "@/modules/courses/learner-assessment-action-counts-model";
const now=Date.parse("2026-10-15T12:00:00Z");
describe("learner aggregate assessment action counts",()=>{
 it("counts only pending, actually actionable items; missed quizzes are not actionable",()=>{
  const rows=[
   {kind:"ASSIGNMENT" as const,submittedAt:null,gradePublished:false,dueAt:"2026-10-14T12:00:00Z"},
   {kind:"QUIZ" as const,attemptsUsed:0,attemptsRemaining:1,status:"PUBLISHED" as const,dueAt:"2026-10-14T12:00:00Z",resultsPublished:false},
   {kind:"QUIZ" as const,attemptsUsed:1,attemptsRemaining:0,status:"CLOSED" as const,dueAt:null,resultsPublished:true},
  ];
  expect(learnerAssessmentActionCounts(rows,now)).toEqual({pending:1,overdue:2});
 });
 it("does not invent requirements for empty published data",()=>{
  expect(learnerAssessmentActionCounts([],now)).toEqual({pending:0,overdue:0});
 });
});
