import {describe,it,expect} from "vitest";
import {learnerCourseMatchesProgress} from "@/modules/courses/learner-course-progress-filter-model";
const row=(done:number,total:number)=>({summary:{itemsCompleted:done,itemsTotal:total}});
describe("learner Course measured progress filters",()=>{
 it("distinguishes untracked work from actual not-started courses",()=>{
  expect(learnerCourseMatchesProgress(row(0,0),"UNMEASURED")).toBe(true);
  expect(learnerCourseMatchesProgress(row(0,0),"NOT_STARTED")).toBe(false);
  expect(learnerCourseMatchesProgress(row(0,5),"NOT_STARTED")).toBe(true);
 });
 it("classifies genuinely partial and completed items",()=>{
  expect(learnerCourseMatchesProgress(row(2,5),"IN_PROGRESS")).toBe(true);
  expect(learnerCourseMatchesProgress(row(5,5),"COMPLETED")).toBe(true);
  expect(learnerCourseMatchesProgress(row(2,5),"COMPLETED")).toBe(false);
 });
});
