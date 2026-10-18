import {beforeEach,describe,expect,it,vi} from "vitest";
import type {RequestContext} from "@/modules/identity/context";

const mocks=vi.hoisted(()=>({
 acting:vi.fn(),trace:vi.fn(),write:vi.fn(),db:vi.fn(),insert:vi.fn(),values:vi.fn(),
}));
vi.mock("@/modules/permissions/acting-college",()=>({resolveActingCollege:mocks.acting}));
vi.mock("@/modules/module-access/admin-trace-service",()=>({
 getSuperAdminLearnerAccessTrace:mocks.trace,
}));
vi.mock("@/modules/module-access/admin-student-rule-write",()=>{
 class StudentRuleConflict extends Error{
  constructor(public readonly code:string){super(code);}
 }
 return {StudentRuleConflict,writeSuperAdminStudentRule:mocks.write};
});
vi.mock("@/db/client",()=>({getDb:mocks.db}));
import {StudentRuleConflict} from "@/modules/module-access/admin-student-rule-write";
import {updateSuperAdminStudentRulesInBulk} from "@/modules/module-access/super-admin-student-bulk-rule-service";

const collegeId="11111111-1111-4111-8111-111111111111";
const organizationId="22222222-2222-4222-8222-222222222222";
const membershipId="33333333-3333-4333-8333-333333333333";
const admin:RequestContext={user:{
 id:"44444444-4444-4444-8444-444444444444",
 identityUid:"root",platformStatus:"ACTIVE",systemRoles:["SUPER_ADMIN"],
},membership:null,adminScope:{collegeId,organizationId}};
const raw={membershipIds:[membershipId],module:"projects",action:"ENABLE",confirmed:true};
beforeEach(()=>{
 for(const fn of Object.values(mocks))fn.mockReset();
 mocks.acting.mockResolvedValue({collegeId,organizationId});
 mocks.trace.mockResolvedValue({selected:{modules:[{
  module:"projects",steps:[],winnerLocked:false,
 }]}});
 mocks.write.mockResolvedValue({module:"projects",enabled:true,locked:false,unchanged:false});
 mocks.values.mockResolvedValue(undefined);
 mocks.insert.mockReturnValue({values:mocks.values});
 mocks.db.mockReturnValue({insert:mocks.insert});
});

describe("SA-tenants-modules-MOD-BULK-07 student bulk module outcomes",()=>{
 it("does not report an unapplied or unavailable student rule as saved",async()=>{
  mocks.write.mockResolvedValueOnce(null);
  const result=await updateSuperAdminStudentRulesInBulk(admin,raw);
  expect(result.requested).toBe(1);
  expect(result.applied).toBe(0);
  expect(result.failures).toEqual([{id:membershipId,error:"Learner unavailable in this college."}]);
  expect(mocks.insert).not.toHaveBeenCalled();
 });
 it("does not leak SQL, provider or token errors in per-student failures",async()=>{
  mocks.write.mockRejectedValueOnce(Error("postgres://user:password@host/private"));
  const result=await updateSuperAdminStudentRulesInBulk(admin,raw);
  expect(result.failures).toEqual([{id:membershipId,error:"Could not update this learner."}]);
  expect(JSON.stringify(result)).not.toContain("password");
  expect(mocks.insert).not.toHaveBeenCalled();
 });
 it("keeps stale and ancestor-lock failures actionable but does not claim success",async()=>{
  mocks.write.mockRejectedValueOnce(new StudentRuleConflict("STALE_RULE"));
  const stale=await updateSuperAdminStudentRulesInBulk(admin,raw);
  expect(stale.applied).toBe(0);
  expect(stale.failures[0]?.error).toBe("The rule changed. Refresh and try again.");
  mocks.write.mockRejectedValueOnce(new StudentRuleConflict("ANCESTOR_LOCKED"));
  const locked=await updateSuperAdminStudentRulesInBulk(admin,raw);
  expect(locked.failures[0]?.error).toBe("A higher-level locked rule prevents this change.");
 });
 it("audits only real saved learners; a summary failure cannot erase completed edits",async()=>{
  const result=await updateSuperAdminStudentRulesInBulk(admin,raw);
  expect(result).toMatchObject({requested:1,applied:1,failures:[],auditRecorded:true});
  expect(mocks.values).toHaveBeenCalledWith(expect.objectContaining({
   collegeId,organizationId,actorUserId:admin.user.id,
   eventType:"MODULE_ACCESS_BULK_SET",
   metadata:expect.objectContaining({studentCount:1,requestedCount:1,failedCount:0}),
  }));
  mocks.values.mockRejectedValueOnce(Error("audit offline"));
  const warning=await updateSuperAdminStudentRulesInBulk(admin,raw);
  expect(warning).toMatchObject({applied:1,auditRecorded:false});
  expect(warning.auditWarning).toMatch(/saved/);
 });
 it("rejects revoked global administrators before selecting an acting college",async()=>{
  await expect(updateSuperAdminStudentRulesInBulk({
   ...admin,user:{...admin.user,systemRoles:[]},
  },raw)).rejects.toMatchObject({name:"AuthorizationError"});
  expect(mocks.acting).not.toHaveBeenCalled();
 });
});
