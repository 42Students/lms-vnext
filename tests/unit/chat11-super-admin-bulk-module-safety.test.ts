import {beforeEach,describe,expect,it,vi} from "vitest";
import type {RequestContext} from "@/modules/identity/context";

const mocks=vi.hoisted(()=>({
 acting:vi.fn(),trace:vi.fn(),db:vi.fn(),values:vi.fn(),
 learners:vi.fn(),storedRules:vi.fn(),ancestors:vi.fn(),
}));
vi.mock("@/modules/permissions/acting-college",()=>({resolveActingCollege:mocks.acting}));
vi.mock("@/modules/module-access/admin-trace-service",()=>({
 getSuperAdminLearnerAccessTrace:mocks.trace,
}));
vi.mock("@/modules/permissions/persisted-actor",()=>({
 assertPersistedPlatformPermission:vi.fn(async()=>({})),
}));
vi.mock("@/db/client",()=>({getDb:mocks.db}));
import {updateSuperAdminStudentRulesInBulk} from
 "@/modules/module-access/super-admin-student-bulk-rule-service";

const collegeId="11111111-1111-4111-8111-111111111111";
const organizationId="22222222-2222-4222-8222-222222222222";
const membershipId="33333333-3333-4333-8333-333333333333";
const admin:RequestContext={
 user:{id:"44444444-4444-4444-8444-444444444444",
  identityUid:"root",platformStatus:"ACTIVE",systemRoles:["SUPER_ADMIN"]},
 membership:null,adminScope:{collegeId,organizationId},
};
const raw={membershipIds:[membershipId],module:"projects",action:"ENABLE",confirmed:true};
function chain(rows:readonly unknown[]){
 const query={
  from:()=>query,
  where:()=>query,
  orderBy:()=>query,
  for:()=>query,
  limit:()=>Promise.resolve(rows),
  then:(resolve:(items:readonly unknown[])=>unknown)=>Promise.resolve(rows).then(resolve),
 };
 return query;
}
function makeTransaction(){
 const tx={
  select:(columns:Record<string,unknown>)=>{
   const keys=Object.keys(columns);
   if(keys.includes("organizationId")&&keys.includes("status"))
    return chain([{id:collegeId,organizationId,status:"ACTIVE"}]);
   if(keys.includes("userStatus"))
    return chain(mocks.learners());
   if(keys.includes("membershipId"))
    return chain([{membershipId}]);
   if(keys.includes("enabled"))
    return chain(mocks.storedRules());
   if(keys.includes("scopeType"))
    return chain(mocks.ancestors());
   return chain([]);
  },
  insert:()=>({values:mocks.values}),
  delete:()=>({where:()=>Promise.resolve()}),
  update:()=>({set:()=>({where:()=>Promise.resolve()})}),
 };
 return {transaction:<T>(fn:(transaction:typeof tx)=>Promise<T>)=>fn(tx)};
}
const defaultTrace=()=>({selected:{
 modules:[{module:"projects",steps:[],winnerLocked:false}],
 chain:[],
}});
beforeEach(()=>{
 for(const fn of Object.values(mocks))fn.mockReset();
 mocks.acting.mockResolvedValue({collegeId,organizationId});
 mocks.trace.mockResolvedValue(defaultTrace());
 mocks.learners.mockReturnValue([{id:membershipId,status:"ACTIVE",userStatus:"ACTIVE"}]);
 mocks.storedRules.mockReturnValue([]);
 mocks.ancestors.mockReturnValue([]);
 mocks.values.mockResolvedValue(undefined);
 mocks.db.mockImplementation(makeTransaction);
});

describe("SA-tenants-modules-MOD-BULK-07 atomic student bulk module outcomes",()=>{
 it("never claims to save a learner absent from the scoped live trace",async()=>{
  mocks.trace.mockResolvedValueOnce({selected:null});
  const result=await updateSuperAdminStudentRulesInBulk(admin,raw);
  expect(result).toMatchObject({requested:1,applied:0,auditRecorded:false});
  expect(result.failures).toEqual([{id:membershipId,error:"Learner unavailable in this college."}]);
  expect(mocks.values).not.toHaveBeenCalled();
 });
 it("redacts unexpected SQL/provider errors while disclosing that nothing was saved",async()=>{
  mocks.trace.mockRejectedValueOnce(Error("postgres://user:password@host/private"));
  const result=await updateSuperAdminStudentRulesInBulk(admin,raw);
  expect(result).toMatchObject({applied:0,auditRecorded:false});
  expect(result.failures[0]?.error).toBe("Could not update the selected learners. No changes were saved.");
  expect(JSON.stringify(result)).not.toContain("password");
  expect(mocks.values).not.toHaveBeenCalled();
 });
 it("checks stale optimistic tokens and ancestor locks before writes",async()=>{
  mocks.trace.mockResolvedValueOnce({selected:{
   modules:[{module:"projects",steps:[{level:"MEMBERSHIP",source:"PERSISTED",value:true,locked:false}]}],
   chain:[],
  }});
  const stale=await updateSuperAdminStudentRulesInBulk(admin,raw);
  expect(stale.applied).toBe(0);
  expect(stale.failures[0]?.error).toBe("The rule changed. Refresh and try again.");
  mocks.trace.mockResolvedValueOnce({selected:{
   modules:[{module:"projects",steps:[]}],
   chain:[{scopeType:"COLLEGE",scopeId:collegeId}],
  }});
  mocks.ancestors.mockReturnValueOnce([{scopeType:"COLLEGE",scopeId:collegeId,locked:true}]);
  const locked=await updateSuperAdminStudentRulesInBulk(admin,raw);
  expect(locked.failures[0]?.error).toBe("A higher-level locked rule prevents this change.");
  expect(mocks.values).not.toHaveBeenCalled();
 });
 it("writes per-learner evidence and the summary in the same transaction",async()=>{
  const result=await updateSuperAdminStudentRulesInBulk(admin,raw);
  expect(result).toMatchObject({requested:1,applied:1,failures:[],auditRecorded:true});
  expect(mocks.values).toHaveBeenCalledWith(expect.objectContaining({
   collegeId,organizationId,actorUserId:admin.user.id,eventType:"MODULE_ACCESS_BULK_SET",
   metadata:expect.objectContaining({studentCount:1,requestedCount:1,failedCount:0}),
  }));
  const perLearner=mocks.values.mock.calls.map(call=>call[0])
   .filter((value):value is readonly {subjectId?:string}[]=>
     Array.isArray(value));
  expect(perLearner.some(rows=>rows.some(row=>row.subjectId===membershipId))).toBe(true);
 });
 it("reports a rolled-back batch, not a falsely applied partial success, on audit failure",async()=>{
  mocks.values.mockRejectedValueOnce(Error("audit offline"));
  const warning=await updateSuperAdminStudentRulesInBulk(admin,raw);
  expect(warning).toMatchObject({applied:0,auditRecorded:false});
  expect(warning.auditWarning).toMatch(/not saved/);
 });
 it("rejects revoked global administrators before selecting an acting college",async()=>{
  await expect(updateSuperAdminStudentRulesInBulk({
   ...admin,user:{...admin.user,systemRoles:[]},
  },raw)).rejects.toMatchObject({name:"AuthorizationError"});
  expect(mocks.acting).not.toHaveBeenCalled();
 });
});
