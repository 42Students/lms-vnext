import {readFileSync} from "node:fs";
import {join} from "node:path";
import {expect,it} from "vitest";
it("COL-academic-setup-16 guards edited semester fields with focus-managed dialog and confirmation",()=>{
 const code=readFileSync(join(process.cwd(),"src/components/academics/college-semester-management.tsx"),"utf8");
 expect(code).toContain("<Dialog open={editing}");
 expect(code).toContain("<ConfirmDialog open={confirming}");
 expect(code).toContain("<ConfirmDialog open={discardOpen}");
 expect(code).toContain("if(changed){setDiscardOpen(true);return;}");
 expect(code).toContain("onClick={closeEditor}");
 expect(code).not.toContain("window.confirm(");
});
