import {describe,it,expect} from "vitest";
import {collegeStudentVisibilityAction} from "@/modules/courses/college-student-visibility-control-model";
describe("college content visibility controls",()=>{
  it("describes explicit confirmation for either persisted direction",()=>{
    expect(collegeStudentVisibilityAction(true).next).toBe(false);
    expect(collegeStudentVisibilityAction(false).next).toBe(true);
    expect(collegeStudentVisibilityAction(true).confirmation).toContain("Hide");
    expect(collegeStudentVisibilityAction(false).confirmation).toContain("Show");
  });
});
