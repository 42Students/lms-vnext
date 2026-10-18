import {beforeEach,describe,expect,it,vi} from "vitest";
const mocks=vi.hoisted(()=>({
 threads:vi.fn(),jobs:vi.fn(),getDb:vi.fn(),
}));
vi.mock("server-only",()=>({}));
vi.mock("@/db/client",()=>({getDb:mocks.getDb}));
vi.mock("@/modules/placements/tpo-messaging-service",()=>({
 listMessageThreads:mocks.threads,
}));
vi.mock("@/modules/placements/recruiter-service",()=>({
 listOwnRecruiterPlacementJobs:mocks.jobs,
}));
import {listHrConversations} from "@/modules/placements/hr-conversation-inbox-service";
import {hrConversationQuerySchema,filterRecruiterConversations,
 orderRecruiterConversations,scopeRecruiterConversations,onlyUnreadRecruiterThreads}
 from "@/modules/placements/hr-conversation-inbox-model";

const userId="123e4567-e89b-42d3-a456-426614174001";
const collegeId="123e4567-e89b-42d3-a456-426614174002";
const otherCollege="123e4567-e89b-42d3-a456-426614174003";
const jobId="123e4567-e89b-42d3-a456-426614174004";
const context={user:{id:userId,platformStatus:"ACTIVE"},
 recruiter:{userId,companyId:"employer-a",status:"ACTIVE",
  grants:[{id:"grant-a",collegeId,companyRelationshipId:"relationship-a"}]}};
const row=(id:string,job:string|null,actor=userId,college=collegeId)=>({
 id,collegeId:college,recruiterUserId:actor,jobId:job,
 lastMessageAt:null,createdAt:new Date("2099-01-01T00:00:00.000Z"),
});
describe("HR-CONVERSATIONS-SCOPE-10 account, grant and private thread protections",()=>{
 beforeEach(()=>{
  vi.clearAllMocks();
  mocks.threads.mockResolvedValue([]);
  mocks.jobs.mockResolvedValue([]);
 });
 it("inactive, wrong-role or disconnected recruiter cannot read inbox threads",async()=>{
  for(const who of [
   {...context,recruiter:null},
   {...context,recruiter:{...context.recruiter,userId:"another-recruiter"}},
   {...context,user:{...context.user,platformStatus:"SUSPENDED"}},
  ])await expect(listHrConversations(who as never,{})).rejects.toThrow();
  expect(mocks.threads).not.toHaveBeenCalled();
  expect(mocks.jobs).not.toHaveBeenCalled();
  expect(mocks.getDb).not.toHaveBeenCalled();
 });
 it("wrong tenant and forged scope fields fail before message service access",async()=>{
  for(const filter of [
   {collegeId:otherCollege},{collegeId:"not-uuid"},{q:"x".repeat(121)},
   {page:0},{sort:"UNBOUNDED"},{organizationId:otherCollege},
  ])await expect(listHrConversations(context as never,filter)).rejects.toThrow();
  expect(mocks.threads).not.toHaveBeenCalled();
  expect(mocks.jobs).not.toHaveBeenCalled();
 });
 it("requires explicit college when multiple authorized relationships span colleges",async()=>{
  const grants=[...context.recruiter.grants,{
   ...context.recruiter.grants[0]!,id:"grant-b",collegeId:otherCollege,
  }];
  const choice=await listHrConversations({...context,recruiter:{...context.recruiter,grants}} as never,{});
  expect(choice.status).toBe("CHOOSE_COLLEGE");
  expect(choice.items).toEqual([]);
  expect(mocks.threads).not.toHaveBeenCalled();
  const noGrants=await listHrConversations({...context,recruiter:{...context.recruiter,grants:[]}} as never,{});
  expect(noGrants.status).toBe("NO_ACCESS");
  expect(mocks.threads).not.toHaveBeenCalled();
 });
 it("another recruiter, other college and unowned drive threads cannot enter returned inbox",async()=>{
  const wrongRecruiter=row("wrong-actor",jobId,"other-recruiter");
  const wrongCollege=row("wrong-college",jobId,userId,otherCollege);
  const wrongJob=row("wrong-job",jobId);
  mocks.threads.mockResolvedValue([wrongRecruiter,wrongCollege,wrongJob]);
  const response=await listHrConversations(context as never,{collegeId});
  expect(response.status).toBe("READY");
  if(response.status!=="READY")return;
  expect(response.items).toEqual([]);
  expect(mocks.threads).toHaveBeenCalledWith(context,collegeId);
  expect(mocks.jobs).toHaveBeenCalledWith(context,collegeId,{jobIds:[jobId]});
  expect(mocks.getDb).not.toHaveBeenCalled();
 });
 it("read-only query models keep general chats, search and sort within the authorized set",()=>{
  const authorized=[row("general",null),row("mine",jobId)];
  const chosen=filterRecruiterConversations(authorized,new Set([jobId]),"tech",
   new Map([[jobId,"Technical engineer"]]));
  expect(chosen.map(x=>x.id)).toEqual(["mine"]);
  expect(scopeRecruiterConversations(authorized,"GENERAL").map(x=>x.id)).toEqual(["general"]);
  expect(scopeRecruiterConversations(authorized,"DRIVE").map(x=>x.id)).toEqual(["mine"]);
  expect(onlyUnreadRecruiterThreads(authorized,new Set(["mine"]),true).map(x=>x.id))
   .toEqual(["mine"]);
  expect(orderRecruiterConversations([...authorized].reverse(),"LATEST").map(x=>x.id))
   .toEqual(["general","mine"]);
  expect(hrConversationQuerySchema.safeParse({collegeId,page:"2",unreadOnly:"true"}).success).toBe(true);
 });
});
