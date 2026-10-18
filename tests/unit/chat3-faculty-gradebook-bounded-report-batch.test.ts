import {describe,expect,it} from "vitest";
import {
 mapFacultyGradebookReportBatch,
} from "@/modules/courses/faculty-gradebook-report-batch";

describe("FAC-GRADEBOOK-SCALE-02 bounded published grade read throughput",()=>{
 it("preserves assessment ordering while up to six report reads finish out of order",async()=>{
  const ids=Array.from({length:35},(_,index)=>index);
  let active=0,peak=0;
  const results=await mapFacultyGradebookReportBatch(ids,async index=>{
   active++;
   peak=Math.max(peak,active);
   for(let step=0;step<(index%5);step++)await Promise.resolve();
   active--;
   return {assessmentId:index,score:index*2};
  });
  expect(results.map(row=>row.assessmentId)).toEqual(ids);
  expect(peak).toBe(6);
  expect(active).toBe(0);
 });
 it("rejects unsafe limits instead of starting an unbounded set of queries",async()=>{
  for(const bad of [0,-1,7,1.5,Number.NaN,Number.POSITIVE_INFINITY]){
   await expect(mapFacultyGradebookReportBatch([1],async x=>x,bad))
    .rejects.toThrow("INVALID_FACULTY_GRADEBOOK_CONCURRENCY");
  }
 });
 it("does not hide a revoked teaching Section behind zero scores or fetch later batches",async()=>{
  const started:number[]=[];
  await expect(mapFacultyGradebookReportBatch([1,2,3,4,5],async n=>{
   started.push(n);
   if(n===2)throw new Error("Current teaching assignment removed");
   return n;
  },2)).rejects.toThrow("Current teaching assignment removed");
  expect(started).toEqual([1,2]);
 });
 it("handles a Section with no published assessment rows without fetching or inferring points",async()=>{
  let called=false;
  await expect(mapFacultyGradebookReportBatch([],async()=>{called=true;return {score:0};}))
   .resolves.toEqual([]);
  expect(called).toBe(false);
 });
});