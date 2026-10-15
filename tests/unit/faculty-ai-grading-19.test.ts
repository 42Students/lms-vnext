import {it,expect} from "vitest";import {readFileSync} from "node:fs";
it("keeps the actionable suggestion button disabled until provider approval",()=>{
 const page=readFileSync("src/app/(authenticated)/ai-grading/page.tsx","utf8");
 const workbench=readFileSync("src/components/courses/faculty-ai-grading-workbench.tsx","utf8");
 expect(page).toContain("providerEnabled={disabledAiGradingProvider.enabled}");
 expect(workbench).toContain("!providerEnabled");
 expect(workbench).toContain("AI suggestions unavailable — provider disabled");
});
