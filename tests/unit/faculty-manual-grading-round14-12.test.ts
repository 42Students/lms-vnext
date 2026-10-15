import {it,expect} from "vitest";import {facultyManualGradeSuccessMessage} from "@/modules/courses/faculty-manual-grade-receipt";
it("does not describe a private graded submission as published",()=>{
 expect(facultyManualGradeSuccessMessage("GRADE",3)).toMatch(/saved privately/);
 expect(facultyManualGradeSuccessMessage("GRADE",3)).not.toContain("published to the learner");
 expect(facultyManualGradeSuccessMessage("PUBLISH",4)).toContain("published to the learner");
});