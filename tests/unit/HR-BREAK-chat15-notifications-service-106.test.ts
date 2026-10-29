import {beforeEach,describe,expect,it,vi} from "vitest";
const m=vi.hoisted(()=>({jobs:vi.fn(),getDb:vi.fn()}));
vi.mock("server-only",()=>({}));
vi.mock("@/modules/placements/recruiter-service",()=>({listOwnRecruiterPlacementJobs:m.jobs}));
vi.mock("@/db/client",()=>({getDb:m.getDb}));
vi.mock("@/modules/placements/hr-recruiter-read-watermark-service",()=>({
 getRecruiterNotificationReadThreshold:vi.fn(async()=>({
  firstVisit:true,readThrough:null,unreadSince:new Date("2020-01-01T00:00:00Z"),
 })),
}));
import {listHrNotifications} from "@/modules/placements/hr-notifications-service";
const own="123e4567-e89b-42d3-a456-426614174001";
const other="123e4567-e89b-42d3-a456-426614174002";
const actor={user:{id:"recruiter",platformStatus:"ACTIVE",systemRoles:[]},
 recruiter:{userId:"recruiter",status:"ACTIVE",companyId:"company",grants:[
  {collegeId:own,companyRelationshipId:"relationship"},
 ]}};
describe("HR-NOTIFICATIONS-SERVICE-106 prevent employer notification IDOR",()=>{
 beforeEach(()=>{vi.clearAllMocks();m.jobs.mockResolvedValue([]);});
 it("cannot read another college with an injected collegeId query",async()=>{
  await expect(listHrNotifications(actor as never,{collegeId:other})).rejects.toThrow();
  expect(m.jobs).not.toHaveBeenCalled();expect(m.getDb).not.toHaveBeenCalled();
 });
 it("inactive and swapped employer principals cannot read a cached notification page",async()=>{
  const cases=[
   {...actor,user:{...actor.user,platformStatus:"DISABLED"}},
   {...actor,recruiter:{...actor.recruiter,userId:"someone-else"}},
  ];
  for(const c of cases)await expect(listHrNotifications(c as never,{collegeId:own}))
   .rejects.toThrow();
  expect(m.jobs).not.toHaveBeenCalled();expect(m.getDb).not.toHaveBeenCalled();
 });
 it("returns a no-access response with no notification query for zero college grants",async()=>{
  const ctx={...actor,recruiter:{...actor.recruiter,grants:[]}};
  const result=await listHrNotifications(ctx as never);
  expect(result).toMatchObject({status:"NO_ACCESS",rows:[],unread:0,total:0});
  expect(m.jobs).not.toHaveBeenCalled();expect(m.getDb).not.toHaveBeenCalled();
 });
 it("forces multi-college employer to choose tenant before querying private messages",async()=>{
  const ctx={...actor,recruiter:{...actor.recruiter,grants:[
   ...actor.recruiter.grants,{collegeId:other,companyRelationshipId:"second"},
  ]}};
  const result=await listHrNotifications(ctx as never);
  expect(result).toMatchObject({status:"CHOOSE_COLLEGE",rows:[],unread:0});
  expect(m.jobs).not.toHaveBeenCalled();
 });
 it("a valid employer with no authorized job IDs must not touch notification tables",async()=>{
  const result=await listHrNotifications(actor as never,{collegeId:own,unreadOnly:"true"});
  expect(result).toMatchObject({status:"READY",rows:[],total:0,unread:0});
  expect(m.jobs).toHaveBeenCalledTimes(1);
  expect(m.getDb).toHaveBeenCalledTimes(1);
 });

 it("TPO-only and acting-college Super Admin principals cannot borrow recruiter inbox access",async()=>{
  const tpo={user:{id:"tpo",platformStatus:"ACTIVE",systemRoles:[]},
   membership:{id:"member",status:"ACTIVE",collegeId:own,organizationId:"org",roles:["TPO"]}};
  const admin={user:{id:"admin",platformStatus:"ACTIVE",systemRoles:["SUPER_ADMIN"]},
   adminScope:{collegeId:own,organizationId:"org"}};
  for(const context of [tpo,admin]){
   await expect(listHrNotifications(context as never,{collegeId:own})).rejects.toThrow();
  }
  expect(m.jobs).not.toHaveBeenCalled();
  expect(m.getDb).not.toHaveBeenCalled();
 });
 it("strict query parsing rejects unexpected private flags before reading actor's grants",async()=>{
  await expect(listHrNotifications(actor as never,{readAll:true})).rejects.toThrow();
  expect(m.jobs).not.toHaveBeenCalled();
 });
});