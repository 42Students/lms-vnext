import {readFileSync} from "node:fs";
import {describe,it,expect} from "vitest";
describe("TPO batch eligibility import presentation",()=>{
 it("TPO-batches-40 uses an accessible modal and exact import copy without raw identifiers",()=>{
  const ui=readFileSync("src/components/tpo/tpo-batch-eligibility-import.tsx","utf8");
  expect(ui).toContain('ref={dialog} aria-label="Import eligibility decisions"');
  expect(ui).toContain("dialog.current?.showModal()");
  expect(ui).toContain("dialog.current?.close()");
  for(const label of ["Import eligibility decisions","Preview import","Confirm matched decisions","Import saved"])
   expect(ui).toContain(label);
  expect(ui).not.toContain('Action ID: ');
  expect(ui).toContain("disabled={busy||preview.ready===0||unresolved>0||!acknowledged}");
  expect(ui).toContain("<TpoBatchUndoControl");
  expect(ui).toContain("Choose another file");
 });
});
