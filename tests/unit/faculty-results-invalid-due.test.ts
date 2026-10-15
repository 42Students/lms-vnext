import {expect,it} from "vitest";
import {filterFacultyResultCandidates,safeFacultyDueTime,type FacultyResultCandidate} from "@/modules/courses/faculty-results-model";
it("treats invalid due dates as unknown and sorts valid deadlines first",()=>{
 const baseline={id:"a",kind:"QUIZ" as const,title:"A",courseName:"Math",sectionName:"A",deliveryId:"d",status:"PUBLISHED"};
 const bad:FacultyResultCandidate={...baseline,dueAt:new Date(Number.NaN)};
 const valid:FacultyResultCandidate={...baseline,id:"b",dueAt:new Date("2026-10-01T00:00:00Z")};
 expect(safeFacultyDueTime(bad.dueAt)).toBeNull();
 expect(filterFacultyResultCandidates([bad,valid],{kind:"ALL",status:"ALL",search:"",due:"UNDATED"})).toEqual([bad]);
 expect(filterFacultyResultCandidates([bad,valid],{kind:"ALL",status:"ALL",search:"",sort:"DUE_DESC"}).map(row=>row.id)).toEqual(["b","a"]);
 expect(filterFacultyResultCandidates([bad,valid],{kind:"ALL",status:"ALL",search:"",due:"OVERDUE"},new Date("2026-10-02T00:00:00Z"))).toEqual([valid]);
});
