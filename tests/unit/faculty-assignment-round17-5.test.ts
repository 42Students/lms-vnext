import {expect,it} from "vitest";
import {facultyAssignmentArchiveWarning} from "@/modules/courses/faculty-assignment-editor-ui-model";
it("makes the exact affected assignment and history retention explicit",()=>{
 expect(facultyAssignmentArchiveWarning(" Midterm ")).toContain("Midterm");
 expect(facultyAssignmentArchiveWarning(" Midterm ")).toMatch(/historical submission/);
 expect(facultyAssignmentArchiveWarning("x".repeat(300)).length).toBeLessThan(280);
});
