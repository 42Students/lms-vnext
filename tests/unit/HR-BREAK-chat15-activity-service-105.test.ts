import {beforeEach,describe,expect,it,vi} from "vitest";
const m=vi.hoisted(()=>({jobs:vi.fn(),getDb:vi.fn()}));
vi.mock("server-only",()=>({}));
vi.mock("@/modules/placements/recruiter-service",()=>({listOwnRecruiterPlacementJobs:m.jobs}));
vi.mock("@/db/client",()=>({getDb:m.getDb}));
import {listRecruiterJobActivity} from "@/modules/placements/hr-job-activity-service";
const own="123e4567-e89b-42d3-a456-426614174001";
const other="123e4567-e89b-42d3-a456-426614174002";
const actor={user:{id:"recruiter",platformStatus:"ACTIVE",systemRoles:[]},
 recruiter:{userId:"recruiter",status:"ACTIVE",companyId:"company",grants:[
  {collegeId:own,companyRelationshipId:"relationship"},
 ]}};
describe("HR-ACTIVITY-SERVICE-105 recruiter job history authorization",()=>{
 beforeEach(()=>{vi.clearAllMocks();m.jobs.mockResolvedValue([]);});
 it("rejects a wrong-college direct filter before loading any shared jobs",async()=>{
  await expect(listRecruiterJobActivity(actor as never,{collegeId:other})).rejects.toThrow();
  expect(m.jobs).not.toHaveBeenCalled();
  expect(m.getDb).not.toHaveBeenCalled();
 });
 it("denies a deactivated or identity-swapped recruiter before persistence",async()=>{
  for(const ctx of [
   {...actor,user:{...actor.user,platformStatus:"DISABLED"}},
   {...actor,recruiter:{...actor.recruiter,userId:"other"}},
  ])await expect(listRecruiterJobActivity(ctx as never,{collegeId:own})).rejects.toThrow();
  expect(m.jobs).not.toHaveBeenCalled();expect(m.getDb).not.toHaveBeenCalled();
 });
 it("no grants returns an explicit no-access state without probing any activity",async()=>{
  const ctx={...actor,recruiter:{...actor.recruiter,grants:[]}};
  const result=await listRecruiterJobActivity(ctx as never);
  expect(result).toMatchObject({status:"NO_ACCESS",events:[]});
  expect(m.jobs).not.toHaveBeenCalled();expect(m.getDb).not.toHaveBeenCalled();
 });
 it("multi-college recruiters must pick a college without silently combining activity streams",async()=>{
  const ctx={...actor,recruiter:{...actor.recruiter,grants:[
   ...actor.recruiter.grants,{collegeId:other,companyRelationshipId:"other-relationship"},
  ]}};
  const result=await listRecruiterJobActivity(ctx as never);
  expect(result).toMatchObject({status:"CHOOSE_COLLEGE",events:[]});
  expect(m.jobs).not.toHaveBeenCalled();
 });
 it("authorized employer with no matching jobs never scans global activity events",async()=>{
  const result=await listRecruiterJobActivity(actor as never,{collegeId:own,kind:"CLOSED"});
  expect(result).toMatchObject({status:"READY",collegeId:own,events:[],hasNext:false});
  expect(m.jobs).toHaveBeenCalledTimes(1);
  expect(m.getDb).not.toHaveBeenCalled();
 });

 it("TPO-only and acting-college Super Admin principals cannot borrow recruiter inbox access",async()=>{
  const tpo={user:{id:"tpo",platformStatus:"ACTIVE",systemRoles:[]},
   membership:{id:"member",status:"ACTIVE",collegeId:own,organizationId:"org",roles:["TPO"]}};
  const admin={user:{id:"admin",platformStatus:"ACTIVE",systemRoles:["SUPER_ADMIN"]},
   adminScope:{collegeId:own,organizationId:"org"}};
  for(const context of [tpo,admin]){
   await expect(listRecruiterJobActivity(context as never,{collegeId:own})).rejects.toThrow();
  }
  expect(m.jobs).not.toHaveBeenCalled();
  expect(m.getDb).not.toHaveBeenCalled();
 });
 it("invalid filters fail before even checking job grants",async()=>{
  await expect(listRecruiterJobActivity(actor as never,{page:"0"})).rejects.toThrow();
  expect(m.jobs).not.toHaveBeenCalled();
 });
});