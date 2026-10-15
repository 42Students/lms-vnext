import {it,expect} from "vitest";
import {paginateFacultyResults,filterFacultyResultCandidates} from "@/modules/courses/faculty-results-model";
it("applies the requested page size without requiring legacy callers to supply sort",()=>{
 expect(paginateFacultyResults(Array.from({length:16},(_,i)=>i),1,10).items).toHaveLength(10);
 expect(paginateFacultyResults(Array.from({length:16},(_,i)=>i),2,10).items).toHaveLength(6);
 expect(filterFacultyResultCandidates([], {kind:"ALL",status:"ALL",search:"",deliveryId:undefined})).toEqual([]);
});
