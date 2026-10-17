import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";
describe("batch overview undo discovery",()=>{
 it("TPO-batches-61 shows a discoverable header undo with current decision tooltip",()=>{
  const s=readFileSync("src/app/(authenticated)/tpo/batches/[batchId]/page.tsx","utf8");
  const header=s.indexOf("← Placement eligibility");
  const undo=s.indexOf("Undo last decision",header);
  const sections=s.indexOf('<section aria-label="Batch eligibility snapshot"');
  expect(header).toBeGreaterThan(0);
  expect(undo).toBeGreaterThan(header);
  expect(undo).toBeLessThan(sections);
  expect(s).toContain('String(undoable.after??"eligibility")');
  expect(s).toContain('<TpoBatchUndoControl batchId={batchId} actionId={undoable.actionId}/>');
  expect(s).toContain("actionableBatchHistory(history.events)");
 });
});
