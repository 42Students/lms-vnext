import {it,expect} from "vitest";
import {facultyResultsQuerySchema,facultyResultsHref,paginateFacultyResults} from "@/modules/courses/faculty-results-model";
it("preserves bounded page size across next/previous pages",()=>{
 const q=facultyResultsQuerySchema.parse({pageSize:"10",page:2});
 expect(facultyResultsHref(q)).toContain("pageSize=10");
 expect(paginateFacultyResults(Array.from({length:19},(_,i)=>i),2,q.pageSize).items).toHaveLength(9);
 expect(facultyResultsQuerySchema.safeParse({pageSize:"100"}).success).toBe(false);
});
