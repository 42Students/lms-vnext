import {describe,expect,it} from "vitest";
import {facultyQuizSwitchNeedsConfirmation} from "@/modules/courses/faculty-quiz-builder-model";
describe("Faculty Quiz draft switching",()=>{
 it("requires confirmation for a different selection only when unsaved",()=>{
  expect(facultyQuizSwitchNeedsConfirmation(true,"a","b")).toBe(true);
  expect(facultyQuizSwitchNeedsConfirmation(true,"a","")).toBe(true);
  expect(facultyQuizSwitchNeedsConfirmation(false,"a","b")).toBe(false);
  expect(facultyQuizSwitchNeedsConfirmation(true,"a","a")).toBe(false);
 });
});