import {beforeEach,describe,expect,it,vi} from "vitest";
const mock=vi.hoisted(()=>({
 getDb:vi.fn(),select:vi.fn(),jobs:vi.fn(),rows:[] as unknown[][],
}));
vi.mock("server-only",()=>({}));
vi.mock("@/db/client",()=>({getDb:mock.getDb}));
vi.mock("@/modules/placements/recruiter-service",()=>({
 listOwnRecruiterPlacementJobs:mock.jobs,
}));
vi.mock("@/modules/placements/hr-recruiter-read-watermark-service",()=>({
 getRecruiterNotificationReadThreshold:vi.fn(async()=>({
  firstVisit:true,readThrough:null,unreadSince:new Date("2020-01-01T00:00:00Z"),
 })),
}));
import {listHrNotifications} from "@/modules/placements/hr-notifications-service";
const collegeId="123e4567-e89b-42d3-a456-426614174001";
const foreignCollege="123e4567-e89b-42d3-a456-426614174002";
const actor="123e4567-e89b-42d3-a456-426614174003";
const jobId="123e4567-e89b-42d3-a456-426614174004";
const foreignJob="123e4567-e89b-42d3-a456-426614174005";
const recruiter={user:{id:actor,platformStatus:"ACTIVE",systemRoles:[]},
 membership:null,recruiter:{userId:actor,status:"ACTIVE",companyId:"company-a",
  grants:[{id:"grant-a",collegeId,collegeName:"College A",organizationId:"org-a",
   companyRelationshipId:"relation-a"}]}};
const job=(id:string,college:string,company:string)=>({
 collegeId:college,companyId:company,job:{id,title:"Engineer "+id},
});
const event=(id:string,subjectId:string,eventType:string,readAt:Date|null)=>({
 id,subjectId,eventType,readAt,createdAt:new Date("2099-01-02T10:00:00.000Z"),
});
function chain(items:unknown[]){
 return Object.assign(Promise.resolve(items),{
  from(){return this;},innerJoin(){return this;},where(){return this;},
  orderBy(){return this;},limit(){return this;},offset(){return this;},
 });
}
describe("HR-NOTIFY-SCOPE-09 recruiter inbox privacy, expired roles and tenant boundaries",()=>{
 beforeEach(()=>{
  vi.clearAllMocks();
  mock.rows=[];
  mock.select.mockImplementation(()=>chain(mock.rows.shift()??[]));
  mock.getDb.mockReturnValue({select:mock.select});
  mock.jobs.mockResolvedValue([]);
 });
 it("denies missing or deactivated recruiter before listing private notifications",async()=>{
  for(const ctx of [
   {...recruiter,recruiter:null},
   {...recruiter,recruiter:{...recruiter.recruiter,userId:"another-recruiter"}},
   {...recruiter,user:{...recruiter.user,platformStatus:"SUSPENDED"}},
  ]){
   await expect(listHrNotifications(ctx as never,{})).rejects.toThrow();
  }
  expect(mock.jobs).not.toHaveBeenCalled();
  expect(mock.getDb).not.toHaveBeenCalled();
 });
 it("an ungranted college selection is rejected without querying activity",async()=>{
  await expect(listHrNotifications(recruiter as never,{collegeId:foreignCollege}))
   .rejects.toThrow();
  expect(mock.getDb).not.toHaveBeenCalled();
 });
 it("zero grants require a college choice or return NO_ACCESS without querying messages",async()=>{
  const ctx={...recruiter,recruiter:{...recruiter.recruiter,grants:[]}};
  const response=await listHrNotifications(ctx as never,{});
  expect(response).toMatchObject({status:"NO_ACCESS",rows:[],total:0,unread:0});
  expect(mock.jobs).not.toHaveBeenCalled();
  expect(mock.getDb).not.toHaveBeenCalled();
 });
 it("a multi-college recruiter must choose scope, never silently combine inboxes",async()=>{
  const ctx={...recruiter,recruiter:{...recruiter.recruiter,grants:[
   ...recruiter.recruiter.grants,
   {...recruiter.recruiter.grants[0]!,collegeId:foreignCollege,id:"other-grant"},
  ]}};
  const response=await listHrNotifications(ctx as never,{});
  expect(response).toMatchObject({status:"CHOOSE_COLLEGE",rows:[],total:0});
  expect(mock.jobs).not.toHaveBeenCalled();
  expect(mock.getDb).not.toHaveBeenCalled();
 });
 it("only own employer job publication and closure events can reach the recruiter inbox",async()=>{
  mock.jobs.mockResolvedValue([
   job(jobId,collegeId,"company-a"),
   job(foreignJob,foreignCollege,"company-a"),
   job("different-employer",collegeId,"company-b"),
  ]);
  mock.rows=[[{total:1,unread:1}],[
   event("own",jobId,"placements.job.published",null),
   event("foreign",foreignJob,"placements.job.published",null),
   event("private",jobId,"placements.application.submitted",null),
  ]];
  const result=await listHrNotifications(recruiter as never,{collegeId});
  expect(result.status).toBe("READY");
  if(result.status!=="READY")return;
  expect(result.rows.map(row=>row.id)).toEqual(["own"]);
  expect(result.rows[0]).toMatchObject({jobId,title:"Engineer "+jobId,
   label:"Drive published",unread:true});
  expect(mock.select).toHaveBeenCalledTimes(2);
 });
 it("invalid client filters are denied before service work",async()=>{
  for(const input of [
   {companyId:"not-allowed"},{collegeId:"foreign"},{unreadOnly:"maybe"},
   {page:0},{q:"x".repeat(121)},
  ])await expect(listHrNotifications(recruiter as never,input)).rejects.toThrow();
  expect(mock.jobs).not.toHaveBeenCalled();
 });
});
