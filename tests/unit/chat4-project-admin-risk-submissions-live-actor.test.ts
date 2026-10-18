import {beforeEach,describe,expect,it,vi} from "vitest";
import type {RequestContext} from "@/modules/identity/context";

const mocks=vi.hoisted(()=>({
 scope:vi.fn(),persisted:vi.fn(),transaction:vi.fn(),select:vi.fn(),
}));
vi.mock("@/modules/projects/scope",()=>({
 loadProjectCollegeScope:mocks.scope,
}));
vi.mock("@/modules/permissions/persisted-actor",()=>({
 assertPersistedPlatformPermission:mocks.persisted,
}));
vi.mock("@/db/client",()=>({
 getDb:()=>({
  transaction:async(fn:(tx:unknown)=>Promise<unknown>)=>{
   mocks.transaction();
   const tx={
    select:()=>{
     mocks.select();
     return {from(){return this;},where:async()=>[{
      activeWorkspaces:3,pendingReview:1,needsStudentAction:1,reviewed:1,
     }]};
    },
   };
   return fn(tx);
  },
 }),
}));
import {
 listProjectAdminRiskQueue,
 listProjectAdminSubmissionQueue,
 getProjectAdminSubmissionSummary,
} from "@/modules/projects/admin-insights-service";

const collegeId="11111111-1111-4111-8111-111111111111";
const org="aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const actor:RequestContext={
 user:{id:"33333333-3333-4333-8333-333333333333",
  identityUid:"college-admin",platformStatus:"ACTIVE",systemRoles:[]},
 membership:{id:"44444444-4444-4444-8444-444444444444",
  collegeId,organizationId:org,status:"ACTIVE",roles:["COLLEGE_ADMIN"]},
};
beforeEach(()=>{
 for(const fn of Object.values(mocks))fn.mockReset();
 mocks.scope.mockResolvedValue({id:collegeId,organizationId:org});
 mocks.persisted.mockResolvedValue(undefined);
});
describe("PROJ-BREAK-COLLEGE-04-READ-02/03/04 role revocation while reading Project queues",()=>{
 it.each([
  ["at-risk",()=>listProjectAdminRiskQueue(actor,collegeId,{})],
  ["submissions",()=>listProjectAdminSubmissionQueue(actor,collegeId,{})],
  ["summary",()=>getProjectAdminSubmissionSummary(actor,collegeId)],
 ])("denies stale College Admin before any private %s SELECT",async(_name,call)=>{
  mocks.persisted.mockRejectedValueOnce(new Error("REVOKED"));
  await expect(call()).rejects.toThrow("REVOKED");
  expect(mocks.transaction).toHaveBeenCalledOnce();
  expect(mocks.persisted).toHaveBeenCalledWith(
   expect.anything(),actor,"projects.manage",{collegeId,organizationId:org},
  );
  expect(mocks.select).not.toHaveBeenCalled();
 });
 it("keeps the valid private summary under the same actor lock",async()=>{
  const value=await getProjectAdminSubmissionSummary(actor,collegeId);
  expect(value).toEqual({
   activeWorkspaces:3,pendingReview:1,needsStudentAction:1,reviewed:1,
  });
  expect(mocks.persisted).toHaveBeenCalledOnce();
  expect(mocks.select).toHaveBeenCalledOnce();
 });
 it("denies a learner, TPO or a suspended administrator without querying private rows",async()=>{
  const base=actor.membership!;
  for(const context of [
   {...actor,membership:{...base,roles:["LEARNER" as const]}},
   {...actor,membership:{...base,roles:["TPO" as const]}},
   {...actor,membership:{...base,status:"SUSPENDED" as const}},
  ]){
   await expect(getProjectAdminSubmissionSummary(context,collegeId)).rejects.toBeDefined();
   await expect(listProjectAdminRiskQueue(context,collegeId,{})).rejects.toBeDefined();
   await expect(listProjectAdminSubmissionQueue(context,collegeId,{})).rejects.toBeDefined();
  }
  expect(mocks.transaction).not.toHaveBeenCalled();
  expect(mocks.select).not.toHaveBeenCalled();
 });
 it("hides foreign College IDs from wrong-role users before even the college-existence lookup",async()=>{
  const other="55555555-5555-4555-8555-555555555555";
  for(const call of [
   ()=>listProjectAdminRiskQueue(actor,other,{}),
   ()=>listProjectAdminSubmissionQueue(actor,other,{}),
   ()=>getProjectAdminSubmissionSummary(actor,other),
  ]){
   await expect(call()).rejects.toMatchObject({code:"PROJECT_ACCESS_DENIED"});
  }
  expect(mocks.scope).not.toHaveBeenCalled();
  expect(mocks.transaction).not.toHaveBeenCalled();
 });

 it("rejects malformed queue filters before evaluating any tenant scope",async()=>{
  await expect(listProjectAdminRiskQueue(actor,collegeId,{page:"1e2"}))
   .rejects.toBeDefined();
  await expect(listProjectAdminSubmissionQueue(actor,collegeId,{
   submissionStatus:"IMPOSSIBLE" as "APPROVED",
  })).rejects.toBeDefined();
  expect(mocks.scope).not.toHaveBeenCalled();
  expect(mocks.transaction).not.toHaveBeenCalled();
 });
});
