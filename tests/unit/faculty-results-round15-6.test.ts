import {it,expect} from "vitest";
import {filterFacultyResultCandidates,facultyResultsQuerySchema} from "@/modules/courses/faculty-results-model";
const id="317458a6-9f8b-4f48-862b-91a270e12bb1";
it("overdue excludes unpublished drafts and undated records",()=>{
 const rows=["DRAFT","PUBLISHED"].map(status=>({id,status,kind:"QUIZ" as const,title:status,courseName:"C",sectionName:"S",deliveryId:id,dueAt:new Date("2026-10-01")}));
 const q=facultyResultsQuerySchema.parse({due:"OVERDUE"});
 expect(filterFacultyResultCandidates(rows,q,new Date("2026-10-15")).map(r=>r.status)).toEqual(["PUBLISHED"]);
 expect(filterFacultyResultCandidates(rows,{...q,due:"UNDATED"},new Date("2026-10-15"))).toHaveLength(0);
});
