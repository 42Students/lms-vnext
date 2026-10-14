import {describe,expect,it} from "vitest";
import {facultyAssignmentGradingAllowed,facultyAssignmentGradePublicationAllowed}
 from "@/modules/courses/faculty-assignment-grading-policy";
describe("Faculty assignment grading publication policy",()=>{
 it("prevents draft/archived edits and scores beyond the locked maximum",()=>{
  expect(facultyAssignmentGradingAllowed("PUBLISHED",8,10)).toBe(true);
  expect(facultyAssignmentGradingAllowed("ARCHIVED",8,10)).toBe(false);
  expect(facultyAssignmentGradingAllowed("DRAFT",8,10)).toBe(false);
  expect(facultyAssignmentGradingAllowed("PUBLISHED",11,10)).toBe(false);
 });
 it("publishes only graded submissions attached to a published assignment",()=>{
  expect(facultyAssignmentGradePublicationAllowed("PUBLISHED","GRADED")).toBe(true);
  expect(facultyAssignmentGradePublicationAllowed("PUBLISHED","NOT_GRADED")).toBe(false);
  expect(facultyAssignmentGradePublicationAllowed("ARCHIVED","GRADED")).toBe(false);
 });
});
