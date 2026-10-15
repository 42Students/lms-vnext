import {it,expect} from "vitest";
import {facultyResultsQuerySchema,filterFacultyResultCandidates} from "@/modules/courses/faculty-results-model";
const id="317458a6-9f8b-4f48-862b-91a270e12bb1";
it("sorts by title or due date without changing source order",()=>{
 const rows=[{id:"b",kind:"QUIZ" as const,status:"PUBLISHED",title:"Zeta",courseName:"A",sectionName:"B",deliveryId:id,dueAt:new Date("2026-10-20")},{id:"a",kind:"ASSIGNMENT" as const,status:"PUBLISHED",title:"Alpha",courseName:"A",sectionName:"B",deliveryId:id,dueAt:new Date("2026-10-10")}];
 const query=facultyResultsQuerySchema.parse({sort:"TITLE"});
 expect(filterFacultyResultCandidates(rows,query).map(x=>x.title)).toEqual(["Alpha","Zeta"]);
 expect(filterFacultyResultCandidates(rows,{...query,sort:"DUE_DESC"}).map(x=>x.title)).toEqual(["Zeta","Alpha"]);
 expect(rows[0]?.title).toBe("Zeta");
});
