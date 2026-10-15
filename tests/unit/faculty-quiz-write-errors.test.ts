import {describe,expect,it} from "vitest";
import {facultyQuizWriteMessage} from "@/modules/courses/faculty-quiz-builder-model";
describe("Faculty Quiz safe write errors",()=>{
 it("distinguishes actionable denial reasons",()=>{
  expect(facultyQuizWriteMessage({error:"FACULTY_QUIZ_STALE_VERSION"})).toContain("Reload");
  expect(facultyQuizWriteMessage({error:"QUIZ_HAS_ATTEMPTS"})).toContain("attempts");
  expect(facultyQuizWriteMessage({error:"FACULTY_QUIZ_NO_CHANGE"})).toContain("No Quiz");
 });
 it("does not disclose missing and foreign records differently",()=>{
  expect(facultyQuizWriteMessage({error:"QUIZ_NOT_FOUND"})).toBe(
   facultyQuizWriteMessage({error:"FACULTY_TEACHING_SCOPE_REQUIRED"}));
  expect(facultyQuizWriteMessage(null)).toContain("rejected");
 });
});
