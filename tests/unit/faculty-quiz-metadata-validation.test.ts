import {describe,expect,it} from "vitest";
import {facultyQuizMetadataIssue} from "@/modules/courses/faculty-quiz-builder-model";
describe("Faculty Quiz metadata preflight",()=>{
 it("accepts an optional deadline and valid IST wall time",()=>{
  expect(facultyQuizMetadataIssue("Quiz title","Instructions","",1)).toBeNull();
  expect(facultyQuizMetadataIssue("Quiz title","","2026-10-18T09:30",20)).toBeNull();
 });
 it("rejects invalid attempt count before a confirmed API request",()=>{
  for(const count of [0,21,1.5,Number.NaN]){
   expect(facultyQuizMetadataIssue("Quiz","","",count)).toMatch(/Maximum attempts/);
  }
 });
 it("validates title, instructions and impossible IST calendar days",()=>{
  expect(facultyQuizMetadataIssue(" ","","",1)).toMatch(/title/);
  expect(facultyQuizMetadataIssue("Quiz","x".repeat(10001),"",1)).toMatch(/Instructions/);
  expect(facultyQuizMetadataIssue("Quiz","","2026-02-31T10:00",1)).toMatch(/IST/);
 });
});
