import {describe,it,expect} from "vitest";
import {learnerCourseFilteredEmptyTitle} from "@/modules/courses/learner-course-filtered-empty-model";
const base={query:"",continueOnly:false,typeFilter:"all",termState:"ALL",progressFilter:"ALL",periodCount:3} as const;
describe("learner Course empty-result explanations",()=>{
 it("does not claim no regular courses for all-course and progress searches",()=>{
  expect(learnerCourseFilteredEmptyTitle(base)).toContain("current filters");
  expect(learnerCourseFilteredEmptyTitle({...base,progressFilter:"COMPLETED"})).toContain("progress filter");
  expect(learnerCourseFilteredEmptyTitle({...base,termState:"HISTORY"})).toContain("past courses");
 });
 it("separates truly empty authorized semester and text search",()=>{
  expect(learnerCourseFilteredEmptyTitle({...base,periodCount:0})).toContain("semester");
  expect(learnerCourseFilteredEmptyTitle({...base,query:" biology "})).toContain("biology");
 });
});
