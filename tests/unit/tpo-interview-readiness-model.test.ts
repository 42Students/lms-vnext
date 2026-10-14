import {describe,expect,it} from "vitest";
import {projectTpoInterviewReadiness,tpoInterviewWindowSchema} from "@/modules/placements/tpo-interview-readiness-model";
const base={jobId:"j",jobTitle:"Engineer",companyName:"Acme",kind:"INTERVIEW",mode:"ON_CAMPUS",venue:"Hall"};
describe("TPO interview readiness",()=>{
it("does not guess candidate interview slots or duration from a calendar date",()=>{
 const rows=[
  {...base,id:"a",name:"Technical",status:"PENDING",scheduledAt:null,durationMinutes:null},
  {...base,id:"b",name:"HR",status:"SCHEDULED",scheduledAt:"2026-10-14T13:00:00Z",durationMinutes:null},
  {...base,id:"c",name:"Panel",status:"SCHEDULED",scheduledAt:"2026-10-15T13:00:00Z",durationMinutes:60},
  {...base,id:"d",name:"Live",status:"SCHEDULED",scheduledAt:"2026-10-14T12:00:00Z",durationMinutes:120},
 ];
 const s=projectTpoInterviewReadiness(rows,"2026-10-14T12:30:00Z",7);
 expect(s.counts).toEqual({upcoming:1,happeningNow:1,pendingSchedule:1,durationUnknown:1,startedEarlier:0});
 expect(s.rows).toHaveLength(4);
});
it("clamps lookahead with a strict parsed interval",()=>{
 expect(tpoInterviewWindowSchema.safeParse({days:"91"}).success).toBe(false);
 expect(tpoInterviewWindowSchema.parse({days:"14"})).toEqual({days:14});
});
});
