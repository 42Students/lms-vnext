import {it,expect} from "vitest";import {readFileSync} from "node:fs";
it("exports a redacted local packet after human acceptance, without a grading mutation",()=>{
 const src=readFileSync("src/components/courses/faculty-ai-grading-workbench.tsx","utf8");
 expect(src).toContain("facultyAiGradingReviewReceipt");
 expect(src).toContain('a.download="faculty-grading-review.json"');
 expect(src).toContain("if(!reviewed||!suggestion||!submission.eligible)return;");
 expect(src).not.toContain("/grade\"");
});
