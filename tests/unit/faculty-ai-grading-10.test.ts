import {it,expect} from "vitest";
import {readFileSync} from "node:fs";
it("POSTs only bounded rubric and scoped revision; never grade writes",()=>{
 const s=readFileSync("src/components/courses/faculty-ai-grading-workbench.tsx","utf8");
 expect(s).toContain('fetch("/api/ai-grading/suggest"');
 expect(s).toContain("consentToApprovedProcessing:true");
 expect(s).toContain("verifyFacultyAiGradingResult");
 expect(s).not.toContain("/api/courses/assignment-submissions/");
});
