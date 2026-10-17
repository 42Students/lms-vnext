import {expect,it} from "vitest";
import {facultyAssignmentPublishIssue} from "@/modules/courses/faculty-assignment-editor-ui-model";
it("distinguishes future, past, invalid and undated draft publication",()=>{
 const now=new Date("2026-10-15T10:00:00.000Z");
 expect(facultyAssignmentPublishIssue(null,now)).toBe("Select due date before publishing.");
 expect(facultyAssignmentPublishIssue("2026-10-15T10:00:01.000Z",now)).toBeNull();
 expect(facultyAssignmentPublishIssue("2026-10-15T10:00:00.000Z",now)).toContain("passed");
 expect(facultyAssignmentPublishIssue("invalid",now)).toContain("invalid");
});
