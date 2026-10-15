import {describe,expect,it} from "vitest";
import {facultyMoveQuizQuestionToEdge} from "@/modules/courses/faculty-quiz-builder-model";
describe("Faculty question edge movement",()=>{
 it("moves without losing answer identity",()=>{
  const rows=["a","b","c","d"];
  expect(facultyMoveQuizQuestionToEdge(rows,2,"FIRST")).toEqual(["c","a","b","d"]);
  expect(facultyMoveQuizQuestionToEdge(rows,0,"LAST")).toEqual(["b","c","d","a"]);
  expect(rows).toEqual(["a","b","c","d"]);
 });
 it("keeps out-of-range actions inert",()=>expect(facultyMoveQuizQuestionToEdge(["a"],9,"FIRST")).toEqual(["a"]));
});