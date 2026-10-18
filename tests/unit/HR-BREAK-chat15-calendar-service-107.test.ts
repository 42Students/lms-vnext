import {beforeEach,describe,expect,it,vi} from "vitest";
const m=vi.hoisted(()=>({jobs:vi.fn(),db:vi.fn()}));
vi.mock("server-only",()=>({}));
vi.mock("@/modules/placements/recruiter-service",()=>({
 listOwnRecruiterPlacementJobs:m.jobs,
}));
vi.mock("@/db/client",()=>({getDb:m.db}));
import {listRecruiterCalendarEvents} from "@/modules/placements/recruiter-calendar-service";
const actor={user:{id:"recruiter",platformStatus:"ACTIVE"},
 recruiter:{userId:"recruiter",status:"ACTIVE",companyId:"firm",grants:[]}};
const window={from:"2099-04-01",to:"2099-04-07"};
const row=(status:string,archivedAt:Date|null=null)=>({
 collegeId:"college",companyId:"firm",companyName:"Employer",collegeName:"College",
 job:{id:"job",title:"Engineer",status,archivedAt,applicationDeadline:null},
});
describe("HR-CALENDAR-SERVICE-107 authorized event database preflight",()=>{
 beforeEach(()=>{vi.clearAllMocks();m.jobs.mockResolvedValue([]);});
 it("rejects malformed and inverted calendar windows before any company-grant service",async()=>{
  for(const bad of [
   {from:"2099-99-99",to:"2099-04-07"},
   {from:"2099-04-08",to:"2099-04-07"},
   {from:"2099-01-01",to:"2100-12-31"},
  ]){
   await expect(listRecruiterCalendarEvents(actor as never,bad)).rejects.toThrow();
  }
  expect(m.jobs).not.toHaveBeenCalled();expect(m.db).not.toHaveBeenCalled();
 });
 it("an employer with zero authorized jobs gets zero events and no global round query",async()=>{
  const result=await listRecruiterCalendarEvents(actor as never,window);
  expect(result).toMatchObject({events:[],resultsDue:[],authorizedJobCount:0});
  expect(m.jobs).toHaveBeenCalledWith(actor);
  expect(m.db).not.toHaveBeenCalled();
 });
 it("draft and archived jobs never authorize a round or slot lookup",async()=>{
  m.jobs.mockResolvedValue([row("DRAFT"),row("PUBLISHED",new Date())]);
  const result=await listRecruiterCalendarEvents(actor as never,window);
  expect(result).toMatchObject({events:[],resultsDue:[],authorizedJobCount:0});
  expect(m.db).not.toHaveBeenCalled();
 });
 it("a revoked employer grant denial propagates without querying standalone round tables",async()=>{
  m.jobs.mockRejectedValue(new Error("PLACEMENT_RECRUITER_ACCESS_DENIED"));
  await expect(listRecruiterCalendarEvents(actor as never,window))
   .rejects.toThrow("PLACEMENT_RECRUITER_ACCESS_DENIED");
  expect(m.db).not.toHaveBeenCalled();
 });
});