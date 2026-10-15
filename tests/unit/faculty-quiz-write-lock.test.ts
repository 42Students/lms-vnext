import {describe,expect,it} from "vitest";
import {facultyBeginQuizWrite} from "@/modules/courses/faculty-quiz-builder-model";
describe("Faculty Quiz duplicate submit",()=>{
 it("permits only one in-flight write for a version token",()=>{
  const lock={current:false};
  expect(facultyBeginQuizWrite(lock)).toBe(true);
  expect(facultyBeginQuizWrite(lock)).toBe(false);
  lock.current=false;
  expect(facultyBeginQuizWrite(lock)).toBe(true);
 });
});