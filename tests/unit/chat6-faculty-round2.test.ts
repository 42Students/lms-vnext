import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
import {facultyAssignmentEditLockedBySubmissions} from "@/modules/courses/faculty-assignment-authoring-model";
const read=(name:string)=>readFileSync(name,"utf8");
describe("chat-6 faculty assessments round 2",()=>{
 it("FAC-assessments-24 submissions drawer shows quiz title count and legacy empty copy",()=>{
  const modal=read("src/components/courses/faculty-quiz-review.tsx");
  const overview=read("src/components/courses/faculty-assessment-overview.tsx");
  expect(modal).toContain('title={quizTitle??"Submissions"}');
  expect(modal).toContain("No submissions yet");
  expect(modal).toContain("submission(s)");
  expect(modal).toContain("learnerLabel(attempt)");
  expect(overview).toContain("quizTitle={item.title}");
 });
 it("FAC-assessments-15 allows title corrections but locks deadline points and methods after submission",()=>{
  expect(facultyAssignmentEditLockedBySubmissions(["title"],true)).toBe(false);
  for(const field of ["dueAt","maxPoints","description","allowedMethods"])
   expect(facultyAssignmentEditLockedBySubmissions([field],true)).toBe(true);
  expect(facultyAssignmentEditLockedBySubmissions(["dueAt"],false)).toBe(false);
  const service=read("src/modules/courses/faculty-assignment-authoring-service.ts");
  expect(service).toContain("facultyAssignmentEditLockedBySubmissions(changedFields,Boolean(submission))");
 });
});
