import {describe,it,expect} from "vitest";
import {learnerCourseImageResetKey} from "@/modules/courses/learner-course-image-reset-key-model";
describe("Course thumbnail source state",()=>{
 it("keeps the same image state for an unchanged URL",()=>{
  expect(learnerCourseImageResetKey("course",null)).toBe(learnerCourseImageResetKey("course",null));
 });
 it("remounts the image state when a failed authored thumbnail is replaced",()=>{
  const old=learnerCourseImageResetKey("course","https://cdn.example.edu/old.png");
  const next=learnerCourseImageResetKey("course","https://cdn.example.edu/new.png");
  expect(next).not.toBe(old);
  expect(learnerCourseImageResetKey("course",null)).not.toBe(old);
 });
});
