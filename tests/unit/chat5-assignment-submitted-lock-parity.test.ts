import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";
import {facultyAssignmentEditLockedBySubmissions} from "@/modules/courses/faculty-assignment-authoring-model";
const code=readFileSync("src/modules/courses/assignment-service.ts","utf8");
describe("G2-2-006-039 legacy submitted assignment parity",()=>{
 it("keeps only title editable after a learner submission",()=>{
  expect(code).toContain('const editableFields=submissionCount>0?["title"] as const:');
  expect(code).toContain('input.sequence!==undefined');
  expect(code).toContain("Only the assignment title can be changed.");
  expect(facultyAssignmentEditLockedBySubmissions(["title"],true)).toBe(false);
  expect(facultyAssignmentEditLockedBySubmissions(["sequence"],true)).toBe(true);
  expect(facultyAssignmentEditLockedBySubmissions(["maxPoints"],true)).toBe(true);
 });
 it("checks archive under the parent row lock before changing status",()=>{
  const section=code.slice(code.indexOf("export async function transitionCourseAssignment("));
  expect(section).toContain('.for("update").limit(1)');
  expect(section).toContain('if(input.action==="ARCHIVE")');
  expect(section).toContain("if(submission)throw new CoursesServiceError");
  expect(section).toContain('if(input.expectedUpdatedAt!==undefined');
 });
});
