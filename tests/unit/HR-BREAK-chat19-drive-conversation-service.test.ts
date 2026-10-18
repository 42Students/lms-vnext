import {beforeEach,describe,expect,it,vi} from "vitest";
import type {RequestContext} from "@/modules/identity/context";

const deps=vi.hoisted(()=>({workspace:vi.fn(),threads:vi.fn()}));
vi.mock("server-only",()=>({}));
vi.mock("@/modules/placements/recruiter-workspace-service",()=>({
 getRecruiterPlacementWorkspace:deps.workspace,
}));
vi.mock("@/modules/placements/tpo-messaging-service",()=>({
 listMessageThreads:deps.threads,
}));
import {getRecruiterDriveConversations} from "@/modules/placements/hr-drive-conversation-service";

const job="11111111-1111-4111-8111-111111111111";
const college="22222222-2222-4222-8222-222222222222";
const anotherCollege="33333333-3333-4333-8333-333333333333";
const actor:RequestContext={
 user:{id:"recruiter-a",identityUid:"identity",platformStatus:"ACTIVE",systemRoles:[]},
 membership:null,recruiter:{userId:"recruiter-a",companyId:"company",companyName:"Employer",
  title:null,status:"ACTIVE",grants:[{
   id:"grant",collegeId:college,organizationId:"org",
   collegeName:"College",companyRelationshipId:"relationship",
  }]},
};

describe("HR-BREAK-DRIVE-THREAD-09: independently scope recruiter drive conversations",()=>{
 beforeEach(()=>{
  vi.clearAllMocks();
  deps.workspace.mockResolvedValue({job:{id:job},college:{id:college}});
  deps.threads.mockResolvedValue([]);
 });
 it.each(["not-a-uuid","../other-college",null,""])(
  "never queries a tenant for malformed job identifier %j",async bad=>{
   await expect(getRecruiterDriveConversations(actor,bad)).rejects.toThrow();
   expect(deps.workspace).not.toHaveBeenCalled();
   expect(deps.threads).not.toHaveBeenCalled();
  },
 );
 it("authorized drive lookup precedes every thread read, and a denial is terminal",async()=>{
  deps.workspace.mockRejectedValue(new Error("PROJECT_ACCESS_DENIED"));
  await expect(getRecruiterDriveConversations(actor,job)).rejects.toThrow("PROJECT_ACCESS_DENIED");
  expect(deps.workspace).toHaveBeenCalledWith(actor,job);
  expect(deps.threads).not.toHaveBeenCalled();
 });
 it("rejects forged other-college, other-recruiter and other-job rows from nested service response",async()=>{
  deps.threads.mockResolvedValue([
   {id:"own",jobId:job,collegeId:college,recruiterUserId:"recruiter-a"},
   {id:"other-college",jobId:job,collegeId:anotherCollege,recruiterUserId:"recruiter-a"},
   {id:"other-recruiter",jobId:job,collegeId:college,recruiterUserId:"recruiter-b"},
   {id:"other-drive",jobId:"44444444-4444-4444-8444-444444444444",
    collegeId:college,recruiterUserId:"recruiter-a"},
  ]);
  const result=await getRecruiterDriveConversations(actor,job);
  expect(deps.workspace).toHaveBeenCalledWith(actor,job);
  expect(deps.threads).toHaveBeenCalledWith(actor,college);
  expect(result.threads.map(thread=>thread.id)).toEqual(["own"]);
 });
 it("propagates primary authorized thread query errors instead of inventing a false empty inbox",async()=>{
  deps.threads.mockRejectedValue(new Error("thread datastore unavailable"));
  await expect(getRecruiterDriveConversations(actor,job))
   .rejects.toThrow("thread datastore unavailable");
 });
});
