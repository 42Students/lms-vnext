import {it,expect} from "vitest";
import {facultyAiGradingDraftPoints} from "@/modules/courses/faculty-ai-grading-review";
it("does not treat blank, fractional or out-of-range audit points as a real decision",()=>{
 expect(facultyAiGradingDraftPoints("",10)).toBeNull();
 expect(facultyAiGradingDraftPoints("-1",10)).toBeNull();
 expect(facultyAiGradingDraftPoints("1.5",10)).toBeNull();
 expect(facultyAiGradingDraftPoints("11",10)).toBeNull();
 expect(facultyAiGradingDraftPoints("0",10)).toBe(0);
 expect(facultyAiGradingDraftPoints("7",10)).toBe(7);
});
