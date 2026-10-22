import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";
import {facultyAssignmentEditLockedBySubmissions} from "@/modules/courses/faculty-assignment-authoring-model";

const code=readFileSync("src/modules/courses/assignment-service.ts","utf8");
describe("G2-2-006-039 submitted assignment legacy parity",()=>{
 it("allows only the title after a learner submission",()=>{
  expect(code).toContain('const editableFields=submissionCount>0?["title"] as const:');
  expect(code).toContain("input.sequence!==undefined");
  expect(code).toContain("Only the assignment title can be changed.");
  expect(facultyAssignmentEditLockedBySubmissions(["title"],true)).toBe(false);
  expect(facultyAssignmentEditLockedBySubmissions(["sequence"],true)).toBe(true);
 });
 it("locks the parent row and rejects archive with submitted work",()=>{
  const section=code.slice(code.indexOf("export async function transitionCourseAssignment("));
  expect(section).toContain('.for("update").limit(1)');
  expect(section).toContain('if (input.action === "ARCHIVE")');
  expect(section).toContain('if (submission) throw new CoursesServiceError("ASSIGNMENT_HAS_SUBMISSIONS")');
  expect(section).toContain('input.expectedUpdatedAt !== undefined');
 });
});
