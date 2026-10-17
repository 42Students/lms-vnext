import {readFileSync} from "node:fs";
import {describe,it,expect} from "vitest";
const read=(p:string)=>readFileSync(p,"utf8");
describe("TPO learner override parity",()=>{
 it("TPO-batches-43 shows the exact six private ineligibility reasons and guarded Undo",()=>{
  const source=read("src/components/tpo/tpo-batch-inline-decision.tsx");
  for(const text of ["Higher studies","Not interested in placements","Detained / year back","Discontinued","Disciplinary","Already has a job"])
   expect(source).toContain(text);
  expect(source).toContain("Pick the reason. Students never see this. You can undo it straight after.");
  expect(source).toContain('aria-label="Mark learner ineligible"');
  expect(source).toContain("reasonDialog.current?.showModal()");
  expect(source).toContain('>Other</button>');
  expect(source).toContain("reason.trim().length>=3");
  expect(source).toContain("!reviewed");
  expect(source).toContain("TpoBatchUndoControl");
  expect(source).not.toContain("window.confirm");
 });
});
