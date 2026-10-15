import {it,expect} from "vitest";
import {facultyManualGradeUncertainMessage} from "@/modules/courses/faculty-manual-grade-receipt";
it("does not assert a timed-out grade was not saved",()=>{
 const message=facultyManualGradeUncertainMessage("GRADE");
 expect(message).toMatch(/may have succeeded/);
 expect(message).toMatch(/before retrying/);
});