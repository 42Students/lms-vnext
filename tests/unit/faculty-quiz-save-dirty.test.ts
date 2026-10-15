import {describe,expect,it} from "vitest";
import {facultyQuizCanSaveChanges} from "@/modules/courses/faculty-quiz-builder-model";
describe("Faculty Quiz metadata no-op save",()=>{
 it("requires a dirty, loaded, editable quiz",()=>{
  expect(facultyQuizCanSaveChanges("DRAFT",true,false,false)).toBe(true);
  expect(facultyQuizCanSaveChanges("PUBLISHED",true,false,false)).toBe(true);
  expect(facultyQuizCanSaveChanges("PUBLISHED",true,true,false)).toBe(true);
  expect(facultyQuizCanSaveChanges("CLOSED",true,true,false)).toBe(true);
  for(const args of [["DRAFT",false,false,false],["DRAFT",true,true,false],["ARCHIVED",true,false,false],["CLOSED",true,false,true]] as const)
   expect(facultyQuizCanSaveChanges(...args)).toBe(false);
 });
});