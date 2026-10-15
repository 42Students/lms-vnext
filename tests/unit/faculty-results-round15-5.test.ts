import {it,expect} from "vitest";
import {filterFacultyResultCandidates,facultyResultsQuerySchema} from "@/modules/courses/faculty-results-model";
const id="317458a6-9f8b-4f48-862b-91a270e12bb1";
it("finds course or Section codes without leaking unmatched assessment rows",()=>{
 const r=[{id,kind:"QUIZ" as const,status:"PUBLISHED",title:"Exam",courseName:"Mathematics",sectionName:"First",courseCode:"CS401",sectionCode:"B2",deliveryId:id,dueAt:null}];
 const base=facultyResultsQuerySchema.parse({});
 expect(filterFacultyResultCandidates(r,{...base,search:"cs401"})).toHaveLength(1);
 expect(filterFacultyResultCandidates(r,{...base,search:"B2"})).toHaveLength(1);
 expect(filterFacultyResultCandidates(r,{...base,search:"CS402"})).toHaveLength(0);
});
