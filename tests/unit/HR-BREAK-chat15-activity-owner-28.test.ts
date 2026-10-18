import {beforeEach,describe,expect,it,vi} from "vitest";
const mocks=vi.hoisted(()=>({
 getDb:vi.fn(),jobs:vi.fn(),select:vi.fn(),rows:[] as unknown[][],
}));
vi.mock("server-only",()=>({}));
vi.mock("@/db/client",()=>({getDb:mocks.getDb}));
vi.mock("@/modules/placements/recruiter-service",()=>({
 listOwnRecruiterPlacementJobs:mocks.jobs,
}));
import {listRecruiterJobActivity} from "@/modules/placements/hr-job-activity-service";

const actor="123e4567-e89b-42d3-a456-426614174001";
const college="123e4567-e89b-42d3-a456-426614174002";
const otherCollege="123e4567-e89b-42d3-a456-426614174003";
const jobId="123e4567-e89b-42d3-a456-426614174004";
const otherJobId="123e4567-e89b-42d3-a456-426614174005";
const grant={id:"grant-a",collegeId:college,companyRelationshipId:"rel-a",
 collegeName:"College A",organizationId:"org-a"};
const owner={user:{id:actor,platformStatus:"ACTIVE"},recruiter:{
 userId:actor,status:"ACTIVE",companyId:"firm-a",grants:[grant],
}};
function builder(items:unknown[]){
 return {from(){return this;},where(){return this;},orderBy(){return this;},
  limit(){return this;},offset(){return Promise.resolve(items);}};
}
describe("HR-ACTIVITY-OWNER-28 scope checks before activity and college chooser",()=>{
 beforeEach(()=>{
  vi.clearAllMocks();
  mocks.rows=[];
  mocks.jobs.mockResolvedValue([]);
  mocks.select.mockImplementation(()=>builder(mocks.rows.shift()??[]));
  mocks.getDb.mockReturnValue({select:mocks.select});
 });
 it("rejects swapped session, absent recruiter and disabled account before returning grant choices",async()=>{
  for(const who of [
   {...owner,recruiter:{...owner.recruiter,userId:otherCollege}},
   {...owner,recruiter:null},
   {...owner,user:{...owner.user,platformStatus:"DISABLED"}},
  ]){
   await expect(listRecruiterJobActivity(who as never,{})).rejects.toThrow();
  }
  expect(mocks.jobs).not.toHaveBeenCalled();
  expect(mocks.getDb).not.toHaveBeenCalled();
 });
 it("multi-college grants require explicit selection before any job or activity query",async()=>{
  const multi={...owner,recruiter:{...owner.recruiter,grants:[
   grant,{...grant,id:"grant-b",collegeId:otherCollege},
  ]}};
  const response=await listRecruiterJobActivity(multi as never,{});
  expect(response).toMatchObject({status:"CHOOSE_COLLEGE",events:[]});
  expect(mocks.jobs).not.toHaveBeenCalled();
  expect(mocks.getDb).not.toHaveBeenCalled();
 });
 it("ungranted college is denied without querying recruiter jobs or events",async()=>{
  await expect(listRecruiterJobActivity(owner as never,{collegeId:otherCollege})).rejects.toThrow();
  expect(mocks.jobs).not.toHaveBeenCalled();
  expect(mocks.getDb).not.toHaveBeenCalled();
 });
 it("does not query activity if no authorized employer jobs match the filter",async()=>{
  mocks.jobs.mockResolvedValue([]);
  const result=await listRecruiterJobActivity(owner as never,{collegeId:college,kind:"CLOSED"});
  expect(result).toMatchObject({status:"READY",collegeId:college,events:[],hasNext:false});
  expect(mocks.getDb).not.toHaveBeenCalled();
 });
 it("projects only owned employer/college publication events, never private hiring activity",async()=>{
  mocks.jobs.mockResolvedValue([
   {job:{id:jobId,title:"Graduate engineer"},collegeId:college,companyId:"firm-a"},
   {job:{id:otherJobId,title:"Other college"},collegeId:otherCollege,companyId:"firm-a"},
  ]);
  mocks.rows=[[
   {id:"evt-one",subjectId:jobId,eventType:"placements.job.published",occurredAt:new Date("2099-01-01T09:00:00Z")},
   {id:"evt-foreign",subjectId:otherJobId,eventType:"placements.job.closed",occurredAt:new Date("2099-01-01T10:00:00Z")},
   {id:"evt-private",subjectId:jobId,eventType:"placements.application.submitted",occurredAt:new Date("2099-01-01T11:00:00Z")},
  ]];
  const result=await listRecruiterJobActivity(owner as never,{collegeId:college,kind:"ALL"});
  expect(result.status).toBe("READY");
  if(result.status!=="READY")return;
  expect(result.events.map(e=>e.id)).toEqual(["evt-one"]);
  expect(mocks.select).toHaveBeenCalledTimes(1);
  expect(result.events[0]).toMatchObject({jobId,title:"Graduate engineer",status:"Published"});
 });
});
