import {describe,expect,it} from "vitest";
import {learnerCourseHomeCompletion} from "@/modules/courses/learner-course-home-completion-model";
describe("learner Course Home completion",()=>{
 it("does not claim complete when a persisted quiz was missed",()=>{
  expect(learnerCourseHomeCompletion({itemsTotal:4,itemsMissed:1,readOnly:false}).title)
   .toBe("No remaining actionable items");
 });
 it("shows a non-actionable historical title",()=>{
  expect(learnerCourseHomeCompletion({itemsTotal:4,itemsMissed:0,readOnly:true}).title).toBe("Review the Learning Path");
 });
 it("distinguishes no published items from completed work",()=>{
  expect(learnerCourseHomeCompletion({itemsTotal:0,itemsMissed:0,readOnly:false}).title).toBe("Open the learning path");
  expect(learnerCourseHomeCompletion({itemsTotal:4,itemsMissed:0,readOnly:false}).title).toBe("Course work complete");
 });
});
