import {describe,expect,it} from "vitest";
import {facultyQuizCanPublishSavedDraft} from "@/modules/courses/faculty-quiz-builder-model";
describe("Faculty Quiz publish current draft preflight",()=>{
 it("blocks unsaved edits and failed bank loads",()=>{
  expect(facultyQuizCanPublishSavedDraft("DRAFT",true,false)).toBe(false);
  expect(facultyQuizCanPublishSavedDraft("DRAFT",false,true)).toBe(false);
 });
 it("permits only clean successfully loaded persisted drafts",()=>{
  expect(facultyQuizCanPublishSavedDraft("DRAFT",false,false)).toBe(true);
  expect(facultyQuizCanPublishSavedDraft("PUBLISHED",false,false)).toBe(false);
  expect(facultyQuizCanPublishSavedDraft(undefined,false,false)).toBe(false);
 });
});
