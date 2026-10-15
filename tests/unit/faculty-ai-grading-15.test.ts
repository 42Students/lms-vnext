import {it,expect} from "vitest";import {readFileSync} from "node:fs";
it("contains non-leaking loading and error states for the standalone route",()=>{
 const root="src/app/(authenticated)/ai-grading/";
 const error=readFileSync(root+"error.tsx","utf8");
 const loading=readFileSync(root+"loading.tsx","utf8");
 expect(error).not.toContain("{error.message}");
 expect(error).toContain("No grade was saved or published");
 expect(loading).toContain("No grading operation is being performed");
});
