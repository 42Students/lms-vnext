import {readFileSync} from "node:fs";
import {it,expect} from "vitest";
it("TPO-students-07 refreshes current roster debarment flags only after an actually saved bulk decision",()=>{
 const s=readFileSync(new URL("../../src/components/tpo/tpo-students-bulk-debar.tsx",import.meta.url),"utf8");
 expect(s).toContain('if(next.some(row=>row.status==="saved"))router.refresh()');
 expect(s).toContain("setResults(next)");
 expect(s).toContain('if(active.length>1)');
});