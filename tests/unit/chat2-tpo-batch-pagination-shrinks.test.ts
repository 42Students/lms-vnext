import {describe,it,expect} from "vitest";
import {paginateTpoBatches} from "../../src/modules/placements/tpo-batch-directory-pagination-model";
describe("TPO batch directory pagination",()=>{
 it("clamps stale page after filters remove a cohort",()=>{
  expect(paginateTpoBatches(["a","b"],40,12)).toMatchObject({page:1,totalPages:1,items:["a","b"],hasPrev:false,hasNext:false});
 });
 it("keeps actual second page and stable counters",()=>{
  const result=paginateTpoBatches(Array.from({length:13},(_,i)=>i),2,12);
  expect(result).toMatchObject({page:2,from:13,to:13,hasPrev:true,hasNext:false});
 });
 it("distinguishes first-run zero data from absent pages",()=>{
  expect(paginateTpoBatches([],9,12)).toMatchObject({page:1,totalPages:1,total:0,from:0,to:0});
 });
});
