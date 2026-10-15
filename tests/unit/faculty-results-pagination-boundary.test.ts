import {expect,it} from "vitest";
import {paginateFacultyResults} from "@/modules/courses/faculty-results-model";
it("never performs unbounded or invalid results pagination",()=>{
 const rows=Array.from({length:30},(_,i)=>i);
 expect(paginateFacultyResults(rows,1,10).items).toHaveLength(10);
 expect(paginateFacultyResults(rows,999,10).page).toBe(3);
 for(const [page,size] of [[0,5],[-1,5],[Number.NaN,5],[1,0],[1,100],[1,1.5],[1,Infinity]]){
  expect(()=>paginateFacultyResults(rows,page,size)).toThrow("INVALID_FACULTY_RESULTS_PAGE");
 }
});
