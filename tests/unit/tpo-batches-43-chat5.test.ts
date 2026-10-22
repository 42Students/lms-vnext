import {readFileSync} from "node:fs";
import {describe,it,expect} from "vitest";
const read=(p:string)=>readFileSync(p,"utf8");
describe("TPO learner override parity",()=>{
 it("TPO-batches-43 shows the exact six private ineligibility reasons and guarded Undo",()=>{
  const source=read("src/components/tpo/tpo-batch-inline-decision.tsx");
  for(const text of ["Higher studies","Not interested in placements","Detained / year back","Discontinued","Disciplinary","Already has a job"])
   expect(source).toContain(text);
  expect(source).toContain("Pick the reason. Students never see this. You can undo it straight after.");
  expect(source).toContain('<Dialog open={reasonOpen} onOpenChange={setReasonOpen} dismissible={!busy}');
  expect(source).toContain('title="Mark learner ineligible"');
  expect(source).toContain('role="group" aria-label="Common ineligibility reasons"');
  expect(source).toContain('autoFocus aria-label="Reason for ineligibility"');
  expect(source).toContain('>Other</FilterChip>');
  expect(source).toContain("reason.trim().length>=3");
  expect(source).toContain("!reviewed");
  expect(source).toContain("TpoBatchUndoControl");
  expect(source).not.toContain("window.confirm");
  expect(source).toContain("if(!valid||busy)return");
  expect(source).toContain("useGuardedAction");
  expect(source).toContain('role="alert"');
 });
});
