import {readFileSync} from "node:fs";
import {describe,it,expect} from "vitest";
describe("TPO batch eligibility import presentation",()=>{
 it("TPO-batches-40 uses an accessible modal and exact import copy without raw identifiers",()=>{
  const ui=readFileSync("src/components/tpo/tpo-batch-eligibility-import.tsx","utf8");
  expect(ui).toContain('<Drawer open={importOpen} onOpenChange={setImportOpen} title="Import eligibility decisions"');
  expect(ui).toContain("dismissible={!busy}");
  expect(ui).toContain("if(busy||actionInFlight.current)return");
  expect(ui).toContain("finally{actionInFlight.current=false;setBusy(false);");
  expect(ui).toContain("<ConfirmDialog open={discardPending}");
  for(const label of ["Import eligibility decisions","Preview import","Confirm matched decisions","Import saved"])
   expect(ui).toContain(label);
  expect(ui).not.toContain('Action ID: ');
  expect(ui).toContain("disabled={busy||(preview?preview.ready===0||unresolved>0||!acknowledged:false)}");
  expect(ui).toContain("<TpoBatchUndoControl");
  expect(ui).toContain("Choose another file");
 });
});
