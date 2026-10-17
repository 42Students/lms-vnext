import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
import {batchHistoryDecisionTimeline} from "@/modules/placements/tpo-batch-history-undo-model";
const ev=(actionId:string,kind:string,reversesActionId:string|null=null)=>({
 actionId,kind,reversesActionId,scopeType:"MEMBERSHIP",scopeId:"person-1"
});
describe("Batch history parity",()=>{
 it("TPO-batches-60 folds undo history without duplicate rows and shows legacy labels",()=>{
  const events=[ev("new","UNDO","old"),ev("old","DECIDE"),ev("other","DECIDE")];
  const rows=batchHistoryDecisionTimeline(events);
  expect(rows).toHaveLength(2);
  expect(rows.find(x=>x.actionId==="old")?.undone).toBe(true);
  expect(rows.find(x=>x.actionId==="old")?.canRequestUndo).toBe(false);
  expect(batchHistoryDecisionTimeline(events,"UNDO").map(x=>x.actionId)).toEqual(["old"]);
  expect(batchHistoryDecisionTimeline(events,"DECIDE")).toHaveLength(2);
  const source=readFileSync("src/app/(authenticated)/tpo/batches/[batchId]/history/page.tsx","utf8");
  expect(source).toContain("No decisions yet");
  expect(source).toContain("batchHistoryDate(e.occurredAt)");
  expect(source).toContain("e.undone");
  expect(source).not.toContain('e.kind==="UNDO"?"Undo":"Decision"');
 });
});
