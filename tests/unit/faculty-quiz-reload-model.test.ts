import {describe,expect,it} from "vitest";
import {facultyQuizCanRetryDetails} from "@/modules/courses/faculty-quiz-builder-model";
describe("Faculty Quiz failed load recovery",()=>{
 it("offers an explicit retry only for a selected failed fetch",()=>{
  expect(facultyQuizCanRetryDetails(true,"quiz-id",false)).toBe(true);
  expect(facultyQuizCanRetryDetails(false,"quiz-id",false)).toBe(false);
  expect(facultyQuizCanRetryDetails(true,undefined,false)).toBe(false);
  expect(facultyQuizCanRetryDetails(true,"quiz-id",true)).toBe(false);
 });
});
