import {beforeEach,describe,expect,it,vi} from "vitest";
const mock=vi.hoisted(()=>({
 getDb:vi.fn(),select:vi.fn(),jobs:vi.fn(),rows:[] as unknown[][],
}));
vi.mock("server-only",()=>({}));
vi.mock("@/db/client",()=>({getDb:mock.getDb}));
vi.mock("@/modules/placements/recruiter-service",()=>({
 listOwnRecruiterPlacementJobs:mock.jobs,
}));
import {recruiterCalendarQuerySchema,listRecruiterCalendarEvents}
 from "@/modules/placements/recruiter-calendar-service";
import type {RequestContext} from "@/modules/identity/context";
const user={} as RequestContext;
const jobId="123e4567-e89b-42d3-a456-426614174001";
const foreign="123e4567-e89b-42d3-a456-426614174002";
const own={
 job:{id:jobId,title:"Graduate engineer",status:"PUBLISHED",archivedAt:null,
  applicationDeadline:new Date("2099-01-02T18:29:59.999Z")},
 companyId:"firm-a",companyName:"Firm A",collegeName:"College A",
};
const round={
 id:"round-one",jobId,name:"Technical interview",kind:"INTERVIEW",status:"SCHEDULED",
 scheduledAt:new Date("2099-01-01T18:30:00.000Z"),durationMinutes:60,
 timezone:"Asia/Kolkata",venue:"Room 102",
 resultsDueAt:new Date("2099-01-02T06:00:00.000Z"),
};
const slot={id:"slot-one",jobId,roundId:"round-one",
 startAt:new Date("2099-01-02T07:00:00.000Z"),status:"OFFERED",
 timezone:"Asia/Kolkata",meetingLocation:"Room 102"};
const builder=(rows:unknown[])=>({
 from(){return this;},where(){return this;},
 orderBy(){return Promise.resolve(rows);},
});
describe("HR-CALENDAR-SCOPE-08 authorized recruiter calendar and IST bounds",()=>{
 beforeEach(()=>{
  vi.clearAllMocks();
  mock.jobs.mockResolvedValue([]);
  mock.rows=[[],[]];
  mock.select.mockImplementation(()=>builder(mock.rows.shift()??[]));
  mock.getDb.mockReturnValue({select:mock.select});
 });
 it("rejects inverted, unrealistic, fabricated and >366-day date requests before tenant query",async()=>{
  for(const filters of [
   {from:"2099-01-04",to:"2099-01-01"},
   {from:"2099-02-30",to:"2099-03-01"},
   {from:"2099-01-01",to:"2101-01-01"},
   {from:"2099-01-01",to:"2099-01-01",collegeId:foreign},
  ]){
   expect(recruiterCalendarQuerySchema.safeParse(filters).success).toBe(false);
   await expect(listRecruiterCalendarEvents(user,filters as never)).rejects.toThrow();
  }
  expect(mock.jobs).not.toHaveBeenCalled();
  expect(mock.getDb).not.toHaveBeenCalled();
 });
 it("no authorized jobs means no rounds or slots can ever be queried",async()=>{
  const data=await listRecruiterCalendarEvents(user,{from:"2099-01-02",to:"2099-01-02"});
  expect(data.authorizedJobCount).toBe(0);
  expect(data.events).toEqual([]);
  expect(data.resultsDue).toEqual([]);
  expect(mock.getDb).not.toHaveBeenCalled();
 });
 it("includes only authorized job events inside the exact Jan 2 IST calendar day",async()=>{
  mock.jobs.mockResolvedValue([own]);
  mock.rows=[[round,{...round,id:"foreign-round",jobId:foreign}],[
   slot,{...slot,id:"foreign-slot",jobId:foreign},
  ]];
  const data=await listRecruiterCalendarEvents(user,{from:"2099-01-02",to:"2099-01-02"});
  expect(data.authorizedJobCount).toBe(1);
  expect(data.events.map(e=>e.id)).toEqual([
   "round:round-one","slot:slot-one","deadline:"+jobId,
  ]);
  expect(data.resultsDue.map(item=>item.id)).toEqual(["round-one"]);
  expect(mock.select).toHaveBeenCalledTimes(2);
  expect(data.events.every(e=>e.jobId===jobId)).toBe(true);
 });
 it("drops archived, draft and canceled entries instead of leaking outside the portfolio",async()=>{
  mock.jobs.mockResolvedValue([
   {...own,job:{...own.job,status:"DRAFT"}},
   {...own,job:{...own.job,id:foreign,status:"PUBLISHED",archivedAt:new Date("2099-01-01T00:00:00.000Z")}},
  ]);
  const result=await listRecruiterCalendarEvents(user,{from:"2099-01-02",to:"2099-01-02"});
  expect(result.authorizedJobCount).toBe(0);
  expect(result.events).toEqual([]);
  expect(mock.getDb).not.toHaveBeenCalled();
 });
});
