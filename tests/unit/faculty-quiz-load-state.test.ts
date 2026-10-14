import {describe,expect,it} from "vitest";
import {facultyQuizDraftLoadAllowsAction} from "@/modules/courses/faculty-quiz-builder-model";
describe("Faculty Quiz failed question fetch",()=>{
 it("blocks modifying or publishing a draft with an unavailable question bank",()=>{
  expect(facultyQuizDraftLoadAllowsAction(true,"DRAFT","EDIT")).toBe(false);
  expect(facultyQuizDraftLoadAllowsAction(true,"DRAFT","PUBLISH")).toBe(false);
 });
 it("permits recovered draft and read-only published metadata pathways",()=>{
  expect(facultyQuizDraftLoadAllowsAction(false,"DRAFT","PUBLISH")).toBe(true);
  expect(facultyQuizDraftLoadAllowsAction(true,"PUBLISHED","EDIT")).toBe(true);
  expect(facultyQuizDraftLoadAllowsAction(true,undefined,"CREATE")).toBe(true);
 });
});
