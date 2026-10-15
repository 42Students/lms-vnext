import {describe,expect,it} from "vitest";
import {facultyQuizOptionRemovalNeedsConfirmation} from "@/modules/courses/faculty-quiz-builder-model";
describe("Faculty correct-answer removal",()=>{
 const answers=[{correct:true},{correct:false},{correct:false}];
 it("prompts before deleting a marked answer",()=>{
  expect(facultyQuizOptionRemovalNeedsConfirmation(answers,0)).toBe(true);
  expect(facultyQuizOptionRemovalNeedsConfirmation(answers,1)).toBe(false);
  expect(facultyQuizOptionRemovalNeedsConfirmation(answers,-1)).toBe(false);
 });
});