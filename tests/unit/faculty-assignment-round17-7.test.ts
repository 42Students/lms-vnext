import {expect,it} from "vitest";
import {facultyAssignmentCommandError} from "@/modules/courses/faculty-assignment-editor-ui-model";
it("distinguishes stale, access, conflict and unknown error responses",()=>{
 expect(facultyAssignmentCommandError(409,{})).toContain("changed");
 expect(facultyAssignmentCommandError(403,{error:"FACULTY_TEACHING_SCOPE_REQUIRED"})).toContain("access");
 expect(facultyAssignmentCommandError(400,{error:"ASSIGNMENT_HAS_SUBMISSIONS"})).toContain("submissions");
 expect(facultyAssignmentCommandError(400,{error:"ASSIGNMENT_NAME_CONFLICT"})).toContain("already");
 expect(facultyAssignmentCommandError(500,{error:"secrets: internal DB"})).not.toContain("secrets");
});
