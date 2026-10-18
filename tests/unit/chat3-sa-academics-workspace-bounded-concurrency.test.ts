import {describe,expect,it} from "vitest";
import {
 mapAcademicWorkspaceInBatches,
} from "@/modules/academics/workspace";

describe("SA-ACADEMICS-SPACE-01 bounded academic workspace fanout",()=>{
 it("preserves program order while limiting concurrent academic read workers",async()=>{
  const work=[1,2,3,4,5,6,7];
  let active=0,maxActive=0;
  const rows=await mapAcademicWorkspaceInBatches(work,async value=>{
   active++;
   maxActive=Math.max(maxActive,active);
   // Different microtask depths simulate nonidentical academic query latency.
   for(let i=0;i<(8-value)%3;i++)await Promise.resolve();
   active--;
   return value*10;
  },3);
  expect(rows).toEqual([10,20,30,40,50,60,70]);
  expect(maxActive).toBe(3);
  expect(active).toBe(0);
 });
 it("never launches the next batch after an earlier cohort read fails",async()=>{
  const started:number[]=[];
  await expect(mapAcademicWorkspaceInBatches([1,2,3,4,5],async value=>{
   started.push(value);
   if(value===2)throw new Error("the cohort read failed");
   return value;
  },2)).rejects.toThrow("the cohort read failed");
  expect(started).toEqual([1,2]);
 });
 it("allows 1 to 32 bounded workers but refuses unsafe pool fanout and fractional limits",async()=>{
  for(const concurrency of [0,-1,33,1.5,Number.NaN,Number.POSITIVE_INFINITY]){
   await expect(mapAcademicWorkspaceInBatches([1],async x=>x,concurrency))
    .rejects.toThrow("INVALID_ACADEMIC_WORKSPACE_CONCURRENCY");
  }
  expect(await mapAcademicWorkspaceInBatches([1,2],async x=>x,1)).toEqual([1,2]);
  expect(await mapAcademicWorkspaceInBatches([1,2],async x=>x,32)).toEqual([1,2]);
 });
 it("returns a truthful empty response without invoking the college course mapper",async()=>{
  let called=false;
  await expect(mapAcademicWorkspaceInBatches([],async()=>{called=true;return "not used";}))
   .resolves.toEqual([]);
  expect(called).toBe(false);
 });
});
