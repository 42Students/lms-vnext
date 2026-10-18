import {describe,expect,it} from "vitest";
import {
 mapAcademicWorkspaceInBatches,
} from "@/modules/academics/workspace";

describe("SA-ACADEMICS-SPACE-01 bounded academic workspace fanout",()=>{
 it("preserves program and Section order despite out-of-order async completion",async()=>{
  const work=[1,2,3,4,5,6,7];
  const callbacks=new Map<number,()=>void>();
  const pending:Promise<number>[]=[];
  const running=mapAcademicWorkspaceInBatches(work,async value=>
   new Promise<number>(resolve=>{callbacks.set(value,()=>resolve(value*10));}),3);
  expect([...callbacks.keys()]).toEqual([1,2,3]);
  callbacks.get(3)?.();
  callbacks.get(1)?.();
  callbacks.get(2)?.();
  // Resolve the remaining bounded chunks as each preceding Promise.all settles.
  await Promise.resolve();
  await Promise.resolve();
  expect([...callbacks.keys()]).toEqual([1,2,3,4,5,6]);
  callbacks.get(6)?.();
  callbacks.get(4)?.();
  callbacks.get(5)?.();
  await Promise.resolve();
  await Promise.resolve();
  expect(callbacks.has(7)).toBe(true);
  callbacks.get(7)?.();
  pending.push(running.then(rows=>{expect(rows).toEqual([10,20,30,40,50,60,70]);return 0;}));
  await Promise.all(pending);
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
