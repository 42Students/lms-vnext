import {it,expect} from "vitest";
import {readFileSync} from "node:fs";
it("requires same-origin request and exposes no grade or publish API from suggestion route",()=>{
 const s=readFileSync("src/app/api/ai-grading/suggest/route.ts","utf8");
 expect(s).toContain("isSameOriginRequest(request)");
 expect(s).toContain('error:"AI_PROVIDER_DISABLED"');
 expect(s).not.toContain("gradeAssignmentSubmission(");
 expect(s).not.toContain("publishAssignmentGrade(");
});
