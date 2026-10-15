import {describe,expect,it} from "vitest";
import {learnerCourseHomeCompletion} from "@/modules/courses/learner-course-home-completion-model";
describe("learner Course Home completion",()=>{
 it("does not claim complete when a persisted quiz was missed",()=>{
  expect(learnerCourseHomeCompletion({itemsTotal:4,itemsCompleted:2,itemsMissed:1,readOnly:false}).title)
   .toBe("No remaining actionable items");
 });
 it("shows a non-actionable historical title",()=>{
  expect(learnerCourseHomeCompletion({itemsTotal:4,itemsCompleted:4,itemsMissed:0,readOnly:true}).title).toBe("Review the Learning Path");
 });
 it("never calls incomplete published work finished without a next due date",()=>{
  expect(learnerCourseHomeCompletion({itemsTotal:4,itemsCompleted:2,itemsMissed:0,readOnly:false}).title).toBe("Learning in progress");
 });
 it("distinguishes no published items from completed work",()=>{
  expect(learnerCourseHomeCompletion({itemsTotal:0,itemsCompleted:0,itemsMissed:0,readOnly:false}).title).toBe("Open the learning path");
  expect(learnerCourseHomeCompletion({itemsTotal:4,itemsCompleted:4,itemsMissed:0,readOnly:false}).title).toBe("Course work complete");
 });
});

describe("Course Home mixed missed and actionable work",()=>{
 it("does not falsely say no actionable work while another item is available",()=>{
  const outcome=learnerCourseHomeCompletion({
   itemsTotal:4,itemsCompleted:1,itemsMissed:1,hasNextAction:true,readOnly:false,
  });
  expect(outcome.title).toBe("Continue learning");
 });
});
