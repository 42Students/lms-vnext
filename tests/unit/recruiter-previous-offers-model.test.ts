import {describe,expect,it} from "vitest";
import {recruiterPreviousComparableJob,recruiterHistoricalOfferRows}
 from "@/modules/placements/recruiter-previous-offers-model";
const now={collegeId:"college1",relationshipId:"company1",
 job:{id:"current",title:"Systems Engineer",status:"PUBLISHED",
  createdAt:new Date("2026-10-01T00:00:00Z"),archivedAt:null}};
const row=(id:string,date:string,overrides:Record<string,unknown>={})=>({
 ...now,job:{...now.job,id,status:"CLOSED",createdAt:new Date(date)},...overrides,
});
describe("Recruiter historical offers comparison",()=>{
 it("finds the newest previously closed same-company same-college exact-role drive",()=>{
  const good=row("good","2025-05-04T00:00:00Z");
  const stale=row("stale","2024-05-04T00:00:00Z");
  expect(recruiterPreviousComparableJob([
   stale,row("othercollege","2025-10-03T00:00:00Z",{collegeId:"college2"}),
   row("othercompany","2025-10-03T00:00:00Z",{relationshipId:"company2"}),
   row("otherrole","2025-10-03T00:00:00Z",{job:{...now.job,id:"otherrole",title:"Analyst",
    createdAt:new Date("2025-10-03T00:00:00Z"),status:"CLOSED"}}),
   good,
  ],now)?.job.id).toBe("good");
 });
 it("rejects unpublished, future and archived jobs; no fabricated history",()=>{
  expect(recruiterPreviousComparableJob([
   row("draft","2025-10-03T00:00:00Z",{job:{...now.job,id:"draft",
    createdAt:new Date("2025-10-03T00:00:00Z"),status:"DRAFT"}}),
  ],now)).toBeNull();
  expect(recruiterPreviousComparableJob([],now)).toBeNull();
 });
 it("does not mislabel planned offer joining dates as actual joining",()=>{
  expect(recruiterHistoricalOfferRows([
   {id:"a",name:"Ada",status:"ACCEPTED",joiningStatus:null},
   {id:"b",name:"Bea",status:"ACCEPTED",joiningStatus:"JOINED"},
   {id:"c",name:"Cal",status:"DECLINED",joiningStatus:null},
  ]).map(row=>row.joiningLabel)).toEqual(["Not recorded","Joined","—"]);
 });
});
