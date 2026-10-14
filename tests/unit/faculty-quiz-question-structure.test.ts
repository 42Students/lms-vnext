import {describe,expect,it} from "vitest";
import {facultyAppendQuizQuestion,facultyRemoveQuizQuestion} from "@/modules/courses/faculty-quiz-builder-model";
describe("Faculty Quiz question list edits",()=>{
 it("keeps one question",()=>{
  expect(facultyRemoveQuizQuestion(["one"],0)).toEqual(["one"]);
  expect(facultyRemoveQuizQuestion(["one","two"],0)).toEqual(["two"]);
 });
 it("enforces a 100-question limit without mutation",()=>{
  const old=Array.from({length:100},(_,i)=>i);
  expect(facultyAppendQuizQuestion(old,100)).toHaveLength(100);
  expect(facultyAppendQuizQuestion(old.slice(0,99),99)).toHaveLength(100);
  expect(old).toHaveLength(100);
 });
});
