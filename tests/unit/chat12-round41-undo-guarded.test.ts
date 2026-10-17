import {it,expect} from "vitest";import {readFileSync} from "node:fs";it("TPO-students-16 Undo action is not rejected by its own guarded-action lock",()=>{
 const s=readFileSync(new URL("../../src/components/tpo/tpo-bulk-action-panel.tsx",import.meta.url),"utf8");
 expect(s).toContain("if(!runAuditId||busy)return;");
 expect(s).toContain("onClick={()=>void runGuarded(undoLastRun)}");
});