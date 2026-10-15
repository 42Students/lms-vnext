import {describe,expect,it} from "vitest";
import {facultyQuizCanCopyToDraft,facultyQuizCopyTitle} from "@/modules/courses/faculty-quiz-builder-model";
describe("Faculty Quiz reuse as new draft",()=>{
 it("allows copying a fully loaded assigned Quiz without editing its persisted version",()=>{
  expect(facultyQuizCanCopyToDraft("PUBLISHED",true,false,false)).toBe(true);
  expect(facultyQuizCanCopyToDraft("CLOSED",true,false,false)).toBe(true);
  expect(facultyQuizCanCopyToDraft("ARCHIVED",true,false,false)).toBe(false);
  expect(facultyQuizCanCopyToDraft("DRAFT",true,false,true)).toBe(false);
 });
 it("keeps generated copy titles inside the schema 255-character limit",()=>{
  expect(facultyQuizCopyTitle("Midterm")).toBe("Copy of Midterm");
  expect(facultyQuizCopyTitle("A".repeat(300)).length).toBe(255);
 });
});