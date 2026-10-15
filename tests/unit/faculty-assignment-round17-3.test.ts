import {expect,it} from "vitest";
import {facultyAssignmentConfirmationOnEdit} from "@/modules/courses/faculty-assignment-editor-ui-model";
it("does not reuse confirmation for changed draft values",()=>{
 expect(facultyAssignmentConfirmationOnEdit(true,"A","B")).toBe(false);
 expect(facultyAssignmentConfirmationOnEdit(true,10,11)).toBe(false);
 expect(facultyAssignmentConfirmationOnEdit(true,"A","A")).toBe(true);
 expect(facultyAssignmentConfirmationOnEdit(false,"A","A")).toBe(false);
});
