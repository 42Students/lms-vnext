import {beforeEach,describe,expect,it,vi} from "vitest";
import type {RequestContext} from "@/modules/identity/context";
import {listMessageThreads} from "@/modules/placements/tpo-messaging-service";
import {listOwnRecruiterPlacementJobs} from "@/modules/placements/recruiter-service";
import {getDb} from "@/db/client";
import {listHrConversations} from "@/modules/placements/hr-conversation-inbox-service";

vi.mock("@/db/client",()=>({getDb:vi.fn()}));
vi.mock("@/modules/placements/tpo-messaging-service",()=>({listMessageThreads:vi.fn()}));
vi.mock("@/modules/placements/recruiter-service",()=>({listOwnRecruiterPlacementJobs:vi.fn()}));

const collegeA="11111111-1111-4111-8111-111111111111";
const collegeB="22222222-2222-4222-8222-222222222222";
const grant=(collegeId:string)=>({
 id:"grant-"+collegeId,organizationId:"org-a",collegeId,
 collegeName:"College",companyRelationshipId:"relationship-a",
});
const ctx:RequestContext={
 user:{id:"recruiter-a",identityUid:"identity-a",platformStatus:"ACTIVE",systemRoles:[]},
 membership:null,
 recruiter:{userId:"recruiter-a",companyId:"company-a",companyName:"Company A",
  title:null,status:"ACTIVE",grants:[grant(collegeA)]},
};
beforeEach(()=>{
 vi.clearAllMocks();
 vi.mocked(listMessageThreads).mockResolvedValue([]);
 vi.mocked(listOwnRecruiterPlacementJobs).mockResolvedValue([]);
});

describe("chat-16 HR/Recruiter inbox account break-it journeys",()=>{
 it("HR-BREAK-SESSION-01 rejects expired user sessions before touching messages or DB",async()=>{
  await expect(listHrConversations({...ctx,user:{...ctx.user,platformStatus:"DISABLED"}},{}))
   .rejects.toThrow();
  expect(listMessageThreads).not.toHaveBeenCalled();
  expect(listOwnRecruiterPlacementJobs).not.toHaveBeenCalled();
  expect(getDb).not.toHaveBeenCalled();
 });
 it("HR-BREAK-ROLE-02 rejects a removed recruiter profile",async()=>{
  await expect(listHrConversations({...ctx,recruiter:null},{})).rejects.toThrow();
  expect(listMessageThreads).not.toHaveBeenCalled();
  expect(getDb).not.toHaveBeenCalled();
 });
 it("HR-BREAK-TENANCY-03 rejects forged college selection before reading any thread",async()=>{
  await expect(listHrConversations(ctx,{collegeId:collegeB})).rejects.toThrow();
  expect(listMessageThreads).not.toHaveBeenCalled();
  expect(listOwnRecruiterPlacementJobs).not.toHaveBeenCalled();
  expect(getDb).not.toHaveBeenCalled();
 });
 it("HR-BREAK-STALE-04 requires explicit selection for multi-college grants",async()=>{
  const result=await listHrConversations({...ctx,recruiter:{...ctx.recruiter!,grants:[
   grant(collegeA),grant(collegeB),
  ]}},{});
  expect(result).toMatchObject({status:"CHOOSE_COLLEGE",items:[],collegeId:null});
  expect(listMessageThreads).not.toHaveBeenCalled();
  expect(getDb).not.toHaveBeenCalled();
 });
 it("HR-BREAK-INPUT-05 rejects oversized search and rogue scope before reading messages",async()=>{
  for(const raw of [{page:10001},{q:"x".repeat(121)},{scope:"PRIVATE"},{collegeId:"bad"}]){
   await expect(listHrConversations(ctx,raw)).rejects.toThrow();
  }
  expect(listMessageThreads).not.toHaveBeenCalled();
  expect(getDb).not.toHaveBeenCalled();
 });
 it("HR-BREAK-EMPTY-06 scopes an empty inbox to the only live grant",async()=>{
  const result=await listHrConversations(ctx,{});
  expect(result).toMatchObject({status:"READY",collegeId:collegeA,items:[],total:0});
  expect(listMessageThreads).toHaveBeenCalledWith(ctx,collegeA);
  expect(listOwnRecruiterPlacementJobs).toHaveBeenCalledTimes(1);
  expect(getDb).not.toHaveBeenCalled();
 });
 it("HR-BREAK-TENANCY-08 drops another college's general thread even if an upstream result is contaminated",async()=>{
  const leaked=[
   {id:"forged-other-college",collegeId:collegeB,recruiterUserId:ctx.user.id,jobId:null},
   {id:"forged-other-recruiter",collegeId:collegeA,recruiterUserId:"user-b",jobId:null},
  ] as unknown as Awaited<ReturnType<typeof listMessageThreads>>;
  vi.mocked(listMessageThreads).mockResolvedValue(leaked);
  const result=await listHrConversations(ctx,{});
  expect(result).toMatchObject({status:"READY",items:[],total:0});
  expect(listOwnRecruiterPlacementJobs).toHaveBeenCalledWith(ctx,collegeA,{jobIds:[]});
  expect(getDb).not.toHaveBeenCalled();
 });
 it("HR-BREAK-ACCESS-07 denies a removed last grant rather than returning a global inbox",async()=>{
  const result=await listHrConversations({...ctx,recruiter:{...ctx.recruiter!,grants:[]}},{});
  expect(result).toMatchObject({status:"NO_ACCESS",collegeId:null,items:[]});
  expect(listMessageThreads).not.toHaveBeenCalled();
  expect(getDb).not.toHaveBeenCalled();
 });
});
