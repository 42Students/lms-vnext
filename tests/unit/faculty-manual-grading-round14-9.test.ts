import {it,expect} from "vitest";
import {facultyManualGradePublishPrompt} from "@/modules/courses/faculty-manual-grade-receipt";
it("requires explicit confirmation of stored score and learner-visible feedback",()=>{
 const text=facultyManualGradePublishPrompt(7,10,"Teacher review");
 expect(text).toContain("7 / 10");
 expect(text).toContain("Teacher review");
 expect(text).toMatch(/learner-visible/);
 expect(facultyManualGradePublishPrompt(null,10,null)).toContain("No score");
});