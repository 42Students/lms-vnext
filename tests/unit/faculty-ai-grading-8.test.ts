import {it,expect} from "vitest";
import {readFileSync} from "node:fs";
it("keeps the AI grading workbench separate from grade mutation endpoints",()=>{
 const source=readFileSync("src/components/courses/faculty-ai-grading-workbench.tsx","utf8");
 expect(source).toContain("Human draft only");
 expect(source).not.toContain("/grade\"");
 expect(source).not.toContain("/publish\"");
});
