import {readFileSync} from "node:fs";
import {join} from "node:path";
import {it,expect} from "vitest";
const read=(path:string)=>readFileSync(join(process.cwd(),path),"utf8");
it("COL-academic-setup-16 uses focus-managed editing dialogs and discard confirmation for batches and classes",()=>{
 for(const path of ["src/components/academics/college-cohort-management.tsx",
   "src/components/academics/college-section-management.tsx"]){
  const src=read(path);
  expect(src).toContain("<Dialog open={editing}");
  expect(src).toContain("<ConfirmDialog open={discardConfirm}");
  expect(src).not.toContain('role="dialog" aria-modal="true"');
  expect(src).not.toContain("window.confirm(");
 }
 expect(read("src/components/academics/college-cohort-management.tsx"))
  .toContain("<ConfirmDialog open={Boolean(pendingLifecycleAction)}");
});
