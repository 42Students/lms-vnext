import {readFileSync} from "node:fs";
import {expect,it} from "vitest";
it("derives round state from authorized database reads rather than URL success claims",()=>{
 const page=readFileSync("src/app/(authenticated)/hr/drives/[jobId]/rounds/editor/page.tsx","utf8");
 expect(page).toContain("listHrRoundEditorRows(context,jobId)");
 expect(page).not.toContain("Round change saved:");
 expect(page).not.toContain("searchParams");
});
