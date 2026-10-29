import {beforeEach,describe,expect,it,vi} from "vitest";
import type {RequestContext} from "@/modules/identity/context";
import {getDb} from "@/db/client";
import {listOwnRecruiterPlacementJobs} from "@/modules/placements/recruiter-service";
import {listHrNotifications} from "@/modules/placements/hr-notifications-service";

vi.mock("@/db/client",()=>({getDb:vi.fn()}));
vi.mock("@/modules/placements/recruiter-service",()=>({
 listOwnRecruiterPlacementJobs:vi.fn(),
}));
vi.mock("@/modules/placements/hr-recruiter-read-watermark-service",()=>({
 getRecruiterNotificationReadThreshold:vi.fn(async()=>({
  firstVisit:true,readThrough:null,unreadSince:new Date("2020-01-01T00:00:00Z"),
 })),
}));
const college="11111111-1111-4111-8111-111111111111";
const other="22222222-2222-4222-8222-222222222222";
const company="33333333-3333-4333-8333-333333333333";
const job="44444444-4444-4444-8444-444444444444";
const grant=(collegeId:string)=>({
 id:"grant-"+collegeId,organizationId:"org",collegeId,
 collegeName:"Campus",companyRelationshipId:"relationship",
});
const recruiter:RequestContext={
 user:{id:"hr",identityUid:"identity-hr",platformStatus:"ACTIVE",systemRoles:[]},
 membership:null,recruiter:{
  userId:"hr",companyId:company,companyName:"Company",title:null,
  status:"ACTIVE",grants:[grant(college)],
 },
};
beforeEach(()=>{
 vi.clearAllMocks();
 vi.mocked(listOwnRecruiterPlacementJobs).mockResolvedValue([]);
});

describe("chat-16 recruiter notification inbox tenant and ownership",()=>{
 it("HR-notifications-16 denies unauthorized, suspended and user-mismatched recruiter contexts",async()=>{
  for(const context of [
   {...recruiter,recruiter:null},
   {...recruiter,recruiter:{...recruiter.recruiter!,status:"SUSPENDED"}} as unknown as RequestContext,
   {...recruiter,recruiter:{...recruiter.recruiter!,userId:"another-user"}},
   {...recruiter,user:{...recruiter.user,platformStatus:"DISABLED" as const}},
  ]){
   await expect(listHrNotifications(context,{})).rejects.toThrow();
  }
  expect(getDb).not.toHaveBeenCalled();
 });
 it("HR-notifications-17 refuses filters for a college without an active grant",async()=>{
  await expect(listHrNotifications(recruiter,{collegeId:other})).rejects.toThrow();
  expect(listOwnRecruiterPlacementJobs).not.toHaveBeenCalled();
  expect(getDb).not.toHaveBeenCalled();
 });
 it("HR-notifications-18 requires college selection for multi-campus recruiter without leaking cross-campus events",async()=>{
  const context:RequestContext={...recruiter,recruiter:{
   ...recruiter.recruiter!,grants:[grant(college),grant(other)],
  }};
  const result=await listHrNotifications(context,{});
  expect(result).toMatchObject({status:"CHOOSE_COLLEGE",rows:[],unread:0,total:0});
  expect(getDb).not.toHaveBeenCalled();
  expect(listOwnRecruiterPlacementJobs).not.toHaveBeenCalled();
 });
 it("HR-notifications-19 with no granted employer jobs returns an empty page, never all-college events",async()=>{
  const result=await listHrNotifications(recruiter,{collegeId:college});
  expect(result).toMatchObject({status:"READY",rows:[],total:0,unread:0});
  expect(getDb).toHaveBeenCalledTimes(1);
 });
 it("HR-notifications-20 filters notification projections to owned placement-job events",async()=>{
  const now=new Date("2099-01-01T00:00:00Z");
  vi.mocked(listOwnRecruiterPlacementJobs).mockResolvedValue([
   {companyId:company,collegeId:college,job:{id:job,title:"Graduate Engineer"}},
  ] as unknown as Awaited<ReturnType<typeof listOwnRecruiterPlacementJobs>>);
  const countWhere=vi.fn(async()=>[{total:1,unread:1}]);
  const rowsOffset=vi.fn(async()=>[{id:"notification",createdAt:now,readAt:null,
   subjectId:job,eventType:"placements.job.published"}]);
  const db={select:vi.fn()
   .mockImplementationOnce(()=>({from:()=>({innerJoin:()=>({where:countWhere})})}))
   .mockImplementationOnce(()=>({from:()=>({innerJoin:()=>({
    where:()=>({orderBy:()=>({limit:()=>({offset:rowsOffset})})}),
   })})}))};
  vi.mocked(getDb).mockReturnValue(db as unknown as ReturnType<typeof getDb>);
  const result=await listHrNotifications(recruiter,{collegeId:college});
  expect(result).toMatchObject({status:"READY",total:1,unread:1,rows:[{
   id:"notification",jobId:job,title:"Graduate Engineer",label:"Drive published",unread:true,
  }]});
  expect(rowsOffset).toHaveBeenCalledWith(0);
  expect(countWhere).toHaveBeenCalledOnce();
 });
});