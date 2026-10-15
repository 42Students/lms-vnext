import {describe,expect,it} from "vitest";
import {facultyMoveQuizQuestion} from "@/modules/courses/faculty-quiz-builder-model";
describe("Faculty quiz question reorder",()=>{
 it("moves the selected item without altering draft questions",()=>{
  const draft=[{prompt:"one"},{prompt:"two"},{prompt:"three"}];
  expect(facultyMoveQuizQuestion(draft,0,2).map(x=>x.prompt)).toEqual(["two","three","one"]);
  expect(draft[0]?.prompt).toBe("one");
 });
 it("ignores out-of-bounds moves",()=>expect(facultyMoveQuizQuestion(["a"],0,5)).toEqual(["a"]));
});
