import {describe,expect,it} from "vitest";
import {buildRecruiterCalendarEvents,buildRecruiterResultsDueItems}
 from "@/modules/placements/recruiter-calendar-model";
import type {RecruiterCalendarJob,RecruiterCalendarRound,RecruiterCalendarSlot}
 from "@/modules/placements/recruiter-calendar-model";
import {hrNextCalendarEvent}
 from "@/modules/placements/hr-calendar-next-event-model";
const startsAt=new Date("2099-05-01T18:30:00.000Z"); // May 2 at midnight IST
const endsBefore=new Date("2099-05-02T18:30:00.000Z");
const job=(id:string,status="PUBLISHED"):RecruiterCalendarJob=>({
 id,title:id,status,archivedAt:null,companyId:"employer",companyName:"Employer",
 collegeName:"Authorized college",applicationDeadline:new Date(endsBefore.getTime()-1),
});
const round=(id:string,jobId="own"):RecruiterCalendarRound=>({
 id,jobId,name:"Round "+id,kind:"INTERVIEW",status:"SCHEDULED",
 scheduledAt:startsAt,timezone:"Asia/Kolkata",venue:"Room A",resultsDueAt:endsBefore,
 durationMinutes:60,
});
const slot=(id:string,jobId="own",status="OFFERED"):RecruiterCalendarSlot=>({
 id,jobId,roundId:"own-round",startAt:startsAt,status,timezone:"Asia/Kolkata",
 meetingLocation:"Video call",
});
describe("HR-CALENDAR-DEPTH-65: scoped events at exact IST boundaries",()=>{
 it("includes midnight IST and 23:59:59.999 but excludes next midnight",()=>{
  const jobs=[job("own"),{...job("next"),applicationDeadline:endsBefore}];
  const events=buildRecruiterCalendarEvents({jobs,rounds:[
   round("at-midnight"),{...round("at-next-midnight"),scheduledAt:endsBefore},
  ],slots:[],startsAt,endsBefore});
  expect(events.map(e=>e.id)).toContain("round:at-midnight");
  expect(events.map(e=>e.id)).toContain("deadline:own");
  expect(events.map(e=>e.id)).not.toContain("round:at-next-midnight");
  expect(events.map(e=>e.id)).not.toContain("deadline:next");
 });
 it("rejects foreign, draft, archived and canceled job or round data",()=>{
  const jobs=[job("own"),job("draft","DRAFT"),
   {...job("archived"),archivedAt:startsAt}];
  const events=buildRecruiterCalendarEvents({jobs,rounds:[
   round("foreign","unknown"),round("draft-round","draft"),
   round("archived-round","archived"),{...round("cancelled"),status:"CANCELLED"},
  ],slots:[slot("foreign-slot","unknown"),slot("cancelled-slot","own","CANCELLED")],
   startsAt,endsBefore});
  expect(events.map(e=>e.id)).toEqual(["deadline:own"]);
 });
 it("shows only authorized aggregate interview slots without projecting candidate contacts",()=>{
  const events=buildRecruiterCalendarEvents({
   jobs:[job("own")],rounds:[],slots:[slot("visible")],startsAt,endsBefore,
  });
  const rendered=events.find(e=>e.id==="slot:visible");
  expect(rendered).toMatchObject({kind:"INTERVIEW_SLOT",jobId:"own",status:"OFFERED"});
  expect(JSON.stringify(rendered)).not.toMatch(/email|phone|candidateId|learnerId/);
 });
 it("results due dates never treat canceled or unreleased rounds as completed deadlines",()=>{
  const due=buildRecruiterResultsDueItems({jobs:[job("own")],rounds:[
   {...round("visible"),resultsDueAt:new Date(endsBefore.getTime()-1)},
   {...round("cancelled"),status:"CANCELLED",resultsDueAt:startsAt},
   {...round("pending"),status:"PENDING",resultsDueAt:startsAt},
   {...round("foreign","other"),resultsDueAt:startsAt},
   {...round("late"),resultsDueAt:endsBefore},
  ],startsAt,endsBefore});
  expect(due.map(r=>r.id)).toEqual(["visible"]);
 });
 it("next event excludes invalid and already elapsed dates and respects filter choice",()=>{
  const now=new Date(startsAt.getTime()+1);
  const events=[{kind:"ROUND",title:"Already started",startsAt},
   {kind:"APPLICATION_DEADLINE",title:"Deadline",startsAt:new Date(now.getTime()+1000)},
   {kind:"ROUND",title:"Upcoming interview",startsAt:new Date(now.getTime()+2000)},
   {kind:"ROUND",title:"Corrupt",startsAt:new Date(Number.NaN)}];
  expect(hrNextCalendarEvent(events,[],"ROUNDS",now)?.title).toBe("Upcoming interview");
  expect(hrNextCalendarEvent(events,[],"DEADLINES",now)?.title).toBe("Deadline");
  expect(hrNextCalendarEvent([],[],"ALL",now)).toBeNull();
 });
});
