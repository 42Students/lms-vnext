import {describe,expect,it} from "vitest";
import {learnerUpcomingQuizEligible} from "@/modules/courses/learner-course-upcoming-quiz-model";
describe("Course Home actionable quiz feed",()=>{
 const now=Date.parse("2026-10-15T12:00:00Z");
 it("rejects already completed and missed quizzes even with future due date",()=>{
  for(const status of ["MISSED","COMPLETED"]){
   expect(learnerUpcomingQuizEligible({status,dueAt:new Date(now+60000)},now,now+86400000)).toBe(false);
  }
 });
 it("keeps only finite future deadlines in the selected window",()=>{
  expect(learnerUpcomingQuizEligible({status:"NOT_STARTED",dueAt:new Date(now+60000)},now,now+86400000)).toBe(true);
  expect(learnerUpcomingQuizEligible({status:"NOT_STARTED",dueAt:new Date(NaN)},now,now+86400000)).toBe(false);
 });
});
