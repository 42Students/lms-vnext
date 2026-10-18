import {it,expect} from "vitest";
import {readFileSync} from "node:fs";

it("TPO-students-16 Undo action is not rejected by its own guarded-action lock",()=>{
 const source=readFileSync(new URL("../../src/components/tpo/tpo-bulk-action-panel.tsx",import.meta.url),"utf8");
 const start=source.indexOf("async function undoLastRun(){");
 const end=source.indexOf("if(rows.length===0)return null;",start);
 expect(start).toBeGreaterThanOrEqual(0);
 expect(end).toBeGreaterThan(start);
 const undo=source.slice(start,end);
 // The hook and the request's synchronous ref are independent locks. The
 // guarded click must not set the component ref before entering undoLastRun.
 expect(undo).toContain("if(!runAuditId||busy||actionInFlightRef.current)return;");
 expect(undo).toContain("actionInFlightRef.current=true;setBusy(true);");
 expect(undo).toContain("finally{actionInFlightRef.current=false;setBusy(false);}");
 expect(undo.indexOf("if(!runAuditId||busy||actionInFlightRef.current)return;"))
  .toBeLessThan(undo.indexOf("actionInFlightRef.current=true;setBusy(true);"));
 expect(source).toContain("onClick={()=>void runGuarded(undoLastRun)}");
 expect(source).toContain("disabled={busy||guardedPending}");
 // The undo request must not reuse the confirmation action's pending lock.
 expect(undo).toContain('"/api/placements/tpo/bulk-actions/undo"');
 expect(undo).toContain("setRunAuditId(null)");
 expect(undo).toContain("This batch cannot be undone.");
});
