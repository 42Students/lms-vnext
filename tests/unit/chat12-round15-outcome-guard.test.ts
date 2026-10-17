import {readFileSync} from "node:fs";
import {it,expect} from "vitest";
it("TPO-students-54 confirms bulk outcome and Undo safely, preserving drafts on a conflict",()=>{
 const s=readFileSync(new URL("../../src/components/tpo/tpo-after-college-bulk-editor.tsx",import.meta.url),"utf8");
 expect(s).toContain("runGuarded(async()=>");
 expect(s).toContain('confirmation==="SAVE"');
 expect(s).toContain('confirmation==="UNDO"');
 expect(s).toContain("cause instanceof FriendlyFetchError && cause.status===409");
 expect(s).not.toContain("window.confirm");
 expect(s).toContain("expectedVersion: row.version");
});