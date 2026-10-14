import {describe,expect,it} from "vitest";
import {facultyGradeHasChanges} from "@/modules/courses/faculty-grade-noop-model";
describe("Faculty grade write idempotence",()=>{
 const graded={gradingStatus:"GRADED",pointsAwarded:5,feedback:"Rubric"};
 it("prevents no-op revisions from hiding a published grade",()=>{
  expect(facultyGradeHasChanges(graded,{pointsAwarded:5,feedback:"Rubric"})).toBe(false);
  expect(facultyGradeHasChanges(graded,{pointsAwarded:5,feedback:"Changed"})).toBe(true);
  expect(facultyGradeHasChanges(graded,{pointsAwarded:6,feedback:"Rubric"})).toBe(true);
  expect(facultyGradeHasChanges({...graded,gradingStatus:"NOT_GRADED"},
   {pointsAwarded:5,feedback:"Rubric"})).toBe(true);
 });
});
