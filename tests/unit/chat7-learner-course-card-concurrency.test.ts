import {describe,expect,it} from "vitest";
import {mapLearnerCourseCardsLimited} from "@/modules/courses/learner-course-list-concurrency-model";
describe("LEARNER-CARDS-CONCURRENCY-01 course-card IO must never drop a learner's course",()=>{
 it("preserves source order despite interleaving worker completions",async()=>{
  const input=[5,4,3,2,1];
  let active=0,peak=0;
  const output=await mapLearnerCourseCardsLimited(input,async value=>{
   active++;peak=Math.max(peak,active);
   await Promise.resolve();
   await Promise.resolve();
   active--;
   return value*2;
  },2);
  expect(output).toEqual([10,8,6,4,2]);
  expect(peak).toBeLessThanOrEqual(2);
  expect(peak).toBeGreaterThan(0);
 });
 it("handles NaN, infinite, zero and negative worker limits without losing cards",async()=>{
  const input=[1,2,3,4,5];
  for(const concurrency of [Number.NaN,Number.POSITIVE_INFINITY,0,-3,0.25]){
   const result=await mapLearnerCourseCardsLimited(input,async x=>x+1,concurrency);
   expect(result).toEqual([2,3,4,5,6]);
  }
 });
 it("limits even extreme finite caller concurrency to eight live workers",async()=>{
  let active=0,peak=0;
  const release: Array<()=>void>=[];
  const input=Array.from({length:30},(_,i)=>i);
  const task=mapLearnerCourseCardsLimited(input,async n=>{
   active++;peak=Math.max(peak,active);
   await new Promise<void>(resolve=>{release.push(resolve);});
   active--;
   return n;
  },Number.MAX_SAFE_INTEGER);
  // Allow the first worker promises to enqueue, then advance them until done.
  await Promise.resolve();
  for(let completed=0;completed<input.length;){
   const waiting=release.splice(0);
   expect(waiting.length).toBeLessThanOrEqual(8);
   completed+=waiting.length;
   for(const resolve of waiting)resolve();
   await Promise.resolve();
   await Promise.resolve();
   if(waiting.length===0)throw new Error("Course pool unexpectedly stalled");
  }
  expect(await task).toEqual(input);
  expect(peak).toBeLessThanOrEqual(8);
 });
 it("gracefully yields zero results for a learner with no course deliveries",async()=>{
  const worker=async(x:number)=>x;
  expect(await mapLearnerCourseCardsLimited([],worker,4)).toEqual([]);
 });
});
