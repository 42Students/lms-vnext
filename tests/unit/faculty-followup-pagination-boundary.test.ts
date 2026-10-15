import {expect,it} from "vitest";
import {facultyResponseFollowUpPage} from "@/modules/courses/faculty-response-followup-model";
it("prevents invalid direct follow-up pagination and clamps stale valid pages",()=>{
 const rows=Array.from({length:11},(_,i)=>i);
 expect(facultyResponseFollowUpPage(rows,99,5)).toMatchObject({page:3,totalPages:3,items:[10]});
 for(const page of [0,-1,Number.NaN,Infinity,1.5]){
  expect(()=>facultyResponseFollowUpPage(rows,page)).toThrow("INVALID_FOLLOWUP_PAGE");
 }
 expect(()=>facultyResponseFollowUpPage(rows,1,50)).toThrow("INVALID_FOLLOWUP_PAGE_SIZE");
});
