import {it,expect} from "vitest";
import {facultyManualGradeUncertainMessage} from "@/modules/courses/faculty-manual-grade-receipt";
it("describes uncertain publish as possibly learner visible",()=>{
 const message=facultyManualGradeUncertainMessage("PUBLISH");
 expect(message).toMatch(/learner may already see/);
 expect(message).not.toMatch(/never published/i);
});