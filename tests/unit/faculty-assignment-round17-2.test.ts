import {expect,it} from "vitest";
import {facultyAssignmentMaySubmit} from "@/modules/courses/faculty-assignment-editor-ui-model";
it("blocks duplicate authoring requests during a pending or locked write",()=>{
 expect(facultyAssignmentMaySubmit(false,false)).toBe(true);
 expect(facultyAssignmentMaySubmit(true,false)).toBe(false);
 expect(facultyAssignmentMaySubmit(false,true)).toBe(false);
 expect(facultyAssignmentMaySubmit(true,true)).toBe(false);
});
