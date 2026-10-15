import { describe, expect, it } from "vitest";
import { actionableBatchHistory } from "@/modules/placements/tpo-batch-history-undo-model";
describe("cohort undo candidates",()=>{
 const a={actionId:"a",kind:"DECIDE",reversesActionId:null,scopeType:"COHORT"};
 it("only offers newest unreversed cohort action",()=>{
  const data=actionableBatchHistory([{...a,actionId:"b"},a]);
  expect(data.map(x=>x.canRequestUndo)).toEqual([true,false]);
 });
 it("cannot undo again after inverse event",()=>{
  const data=actionableBatchHistory([{...a,actionId:"inverse",kind:"UNDO",reversesActionId:"a"},a]);
  expect(data.every(x=>!x.canRequestUndo)).toBe(true);
 });
});
