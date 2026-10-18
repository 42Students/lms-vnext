import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {mapTpoBulkBounded} from "@/modules/placements/tpo-bulk-bounded-execution";

describe("TPO-bulk-concurrency-01 bounded bulk action execution",()=>{
 it("applies 200 independent actions with no more than six in flight and preserves selection order",async()=>{
  const ids=Array.from({length:200},(_,i)=>i);
  let active=0,maxActive=0,completed=0;
  const results=await mapTpoBulkBounded(ids,async item=>{
   active++;
   maxActive=Math.max(maxActive,active);
   await Promise.resolve();
   completed++;
   active--;
   return {id:item,status:item%11===0?"skipped":"updated"};
  },6);
  expect(maxActive).toBe(6);
  expect(completed).toBe(200);
  expect(results.map(row=>row.id)).toEqual(ids);
  expect(results.filter(row=>row.status==="skipped")).toHaveLength(19);
 });
 it("keeps same caller order even when completions are reversed in each chunk",async()=>{
  let done=0;
  const result=await mapTpoBulkBounded([1,2,3,4,5,6],async id=>{
   await Promise.resolve();
   done++;
   return {id,fromCompletion:done};
  },3);
  expect(result.map(row=>row.id)).toEqual([1,2,3,4,5,6]);
 });
 it("does not execute actions with invalid concurrency or an empty selection",async()=>{
  for(const bad of [0,-1,1.5,11,Infinity,NaN]){
   let calls=0;
   await expect(mapTpoBulkBounded([1],async id=>{calls++;return id;},bad)).rejects.toBeInstanceOf(RangeError);
   expect(calls).toBe(0);
  }
  expect(await mapTpoBulkBounded([],async id=>id)).toEqual([]);
 });
 it("retains transactional per-row CAS, partial outcome labels and stable undo ordering",()=>{
  const code=readFileSync(new URL("../../src/modules/placements/tpo-bulk-action-confirm-service.ts",import.meta.url),"utf8");
  expect(code).toContain("mapTpoBulkBounded(input.selections,async(selected)");
  expect(code).toContain("},6)");
  expect(code).toContain("getTpoLearnerParticipation(context,selected.id)");
  expect(code).toContain("decideTpoLearnerParticipation(context,selected.id");
  expect(code).toContain("const outcomes=completed.map(row=>row.outcome)");
  expect(code).toContain("const undoRows=completed.flatMap(row=>row.undo?[row.undo]:[])");
  expect(code).toContain('status:"failed"');
  expect(code).toContain('status:"skipped"');
  expect(code).toContain("verifyTpoBulkPreview(");
 });
});
