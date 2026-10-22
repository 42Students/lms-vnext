import {readFileSync} from "node:fs";
import {expect,it} from "vitest";
it("shows an accessible empty state before mapping rounds",()=>{
 const page=readFileSync("src/app/(authenticated)/hr/drives/[jobId]/rounds/editor/page.tsx","utf8");
 expect(page).toMatch(/rounds\.length===0\s*\?/);
 expect(page).toContain("This drive has no hiring rounds.");
 expect(page).toContain('<EmptyState title="No hiring rounds"');
 const empty=readFileSync("src/components/ui/empty-state.tsx","utf8");
 expect(empty).toContain('role="status"');
});
