import {describe,expect,it} from "vitest";
import {buildRecruiterResultsDueItems} from "@/modules/placements/recruiter-calendar-model";
const job=(id:string,status:string,archivedAt:Date|null)=>({id,title:"Engineer",status,archivedAt,
 companyId:"company",companyName:"Co",applicationDeadline:null});
const due=new Date("2026-10-22T10:00:00.000Z");
const round=(jobId:string,resultsDueAt:Date|null)=>({id:jobId,jobId,name:"Technical",kind:"INTERVIEW",
 status:"SCHEDULED",scheduledAt:null,timezone:null,venue:null,resultsDueAt});
describe("HR calendar results due evidence",()=>{
 it("only includes recorded dates for approved same-company jobs in window",()=>{
  const result=buildRecruiterResultsDueItems({jobs:[job("a","PUBLISHED",null),job("b","DRAFT",null),
   job("c","PUBLISHED",new Date())],rounds:[round("a",due),round("b",due),round("c",due),round("foreign",due)],
   startsAt:new Date("2026-10-21T00:00Z"),endsBefore:new Date("2026-10-23T00:00Z")});
  expect(result.map(row=>row.jobId)).toEqual(["a"]);
 });
 it("excludes unrecorded and outside range without inventing due dates",()=>{
  expect(buildRecruiterResultsDueItems({jobs:[job("a","CLOSED",null)],
   rounds:[round("a",null),round("a",new Date("2026-10-30T00:00Z"))],
   startsAt:new Date("2026-10-21T00:00Z"),endsBefore:new Date("2026-10-23T00:00Z")})).toEqual([]);
 });
});
