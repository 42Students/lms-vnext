import {describe,expect,it} from "vitest";
import {facultyQuizQuestionMatches} from "@/modules/courses/faculty-quiz-builder-model";
const q={prompt:"What is a mutex?",options:[{text:"Synchronization"},{text:"Network"}]};
describe("Faculty quiz question search",()=>{
 it("finds prompt, options and numbered question safely",()=>{
  expect(facultyQuizQuestionMatches(q,2,"mutex")).toBe(true);
  expect(facultyQuizQuestionMatches(q,2,"network")).toBe(true);
  expect(facultyQuizQuestionMatches(q,2,"3")).toBe(true);
  expect(facultyQuizQuestionMatches(q,2,"1")).toBe(false);
  expect(facultyQuizQuestionMatches(q,2,"")).toBe(true);
 });
});