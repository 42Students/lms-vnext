import {describe,it,expect} from "vitest";
import {buildRecruiterCalendarEvents} from "@/modules/placements/recruiter-calendar-model";
describe("REC-calendar-messages-profile-02/04 pending round inclusion and labels",()=>{
 const time=new Date("2026-10-17T07:00:00Z");
 const job={id:"job",title:"Engineer",status:"PUBLISHED",archivedAt:null,companyId:"c",companyName:"Acme",
  applicationDeadline:time};
 it("shows scheduled and pending dated rounds but no cancelled rounds",()=>{
  const rounds=["PENDING","SCHEDULED","CANCELLED"].map(status=>({id:status,jobId:"job",name:status,
   kind:"INTERVIEW",status,scheduledAt:time,timezone:"Asia/Kolkata",venue:null}));
  const rows=buildRecruiterCalendarEvents({jobs:[job],rounds,
   startsAt:new Date("2026-10-17T00:00:00Z"),endsBefore:new Date("2026-10-18T00:00:00Z")});
  expect(rows.map(r=>r.title)).toContain("PENDING");
  expect(rows.map(r=>r.title)).not.toContain("CANCELLED");
  expect(rows.map(r=>r.title)).toContain("Applications close");
 });
});
