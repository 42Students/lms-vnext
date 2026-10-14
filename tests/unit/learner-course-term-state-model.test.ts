import { describe,it,expect } from "vitest";
import {learnerCourseMatchesTermState} from "@/modules/courses/learner-course-term-state-model";
describe("learner Course current versus historical selection",()=>{
 it("uses server-sourced read-only status",()=>{
  expect(learnerCourseMatchesTermState({readOnly:false},"CURRENT")).toBe(true);
  expect(learnerCourseMatchesTermState({readOnly:true},"CURRENT")).toBe(false);
  expect(learnerCourseMatchesTermState({readOnly:true},"HISTORY")).toBe(true);
  expect(learnerCourseMatchesTermState({readOnly:false},"HISTORY")).toBe(false);
 });
 it("defaults to the authorized unfiltered courses for invalid choices",()=>{
  expect(learnerCourseMatchesTermState({readOnly:true},"UNLISTED")).toBe(true);
 });
});
