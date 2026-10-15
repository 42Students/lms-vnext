import {describe,expect,it} from "vitest";
import {facultyQuizMatchesSearch} from "@/modules/courses/faculty-quiz-builder-model";
describe("Faculty quiz selector",()=>{
 it("finds titles or status without case sensitivity",()=>{
  const quiz={title:"OS Fundamentals",status:"PUBLISHED"};
  expect(facultyQuizMatchesSearch(quiz," fundamentals ")).toBe(true);
  expect(facultyQuizMatchesSearch(quiz,"published")).toBe(true);
  expect(facultyQuizMatchesSearch(quiz,"draft")).toBe(false);
  expect(facultyQuizMatchesSearch(quiz,"  ")).toBe(true);
 });
});