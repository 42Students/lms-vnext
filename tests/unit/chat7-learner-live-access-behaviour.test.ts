import {beforeEach,describe,expect,it,vi} from "vitest";
import {readFileSync} from "node:fs";
import type {RequestContext} from "@/modules/identity/context";

const state=vi.hoisted(()=>({
 select:vi.fn(),
 owners:[] as Array<{userId:string;collegeId:string;status:string;userStatus:string}>,
}));
vi.mock("@/db/client",()=>({getDb:()=>({select:state.select})}));
vi.mock("@/modules/permissions/policy",async importOriginal=>{
 const original=await importOriginal<typeof import("@/modules/permissions/policy")>();
 return {...original,requirePermission:vi.fn()};
});
import {requirePermission} from "@/modules/permissions/policy";
import {requireOwnCourseLearnerRead} from "@/modules/courses/learner-access-guard";

const membershipId="11111111-1111-4111-8111-111111111111";
const collegeId="22222222-2222-4222-8222-222222222222";
const organizationId="33333333-3333-4333-8333-333333333333";
const userId="44444444-4444-4444-8444-444444444444";
const active={userId,collegeId,status:"ACTIVE",userStatus:"ACTIVE"};
function context(overrides:{membership?:Record<string,unknown>|null;user?:Record<string,unknown>}={}):RequestContext {
 return {user:{id:userId,platformStatus:"ACTIVE",...overrides.user},
  membership:overrides.membership===null?null:{
   id:membershipId,collegeId,organizationId,status:"ACTIVE",roles:["LEARNER"],
   ...overrides.membership,
  }} as unknown as RequestContext;
}
beforeEach(()=>{
 state.select.mockReset();
 state.owners=[active];
 vi.mocked(requirePermission).mockReset();
 state.select.mockImplementation(()=>({
  from(){return this;},innerJoin(){return this;},where(){return this;},
  limit:async()=>state.owners,
 }));
});
describe("LEARNER-COURSE-ACCESS-01 persisted learner read identity",()=>{
 it("rejects unauthenticated membership, suspended user and wrong role before DB read",async()=>{
  const invalid=[
   context({membership:null}),
   context({membership:{status:"DISABLED"}}),
   context({membership:{roles:["FACULTY"]}}),
   context({user:{platformStatus:"DISABLED"}}),
  ];
  for(const c of invalid)await expect(requireOwnCourseLearnerRead(c)).rejects.toThrow();
  expect(state.select).not.toHaveBeenCalled();
 });
 it("denies removed membership, account deactivation, foreign tenant or wrong persisted owner",async()=>{
  for(const owner of [
   null,
   {...active,userId:"another-user"},
   {...active,collegeId:"another-college"},
   {...active,status:"DISABLED"},
   {...active,userStatus:"DISABLED"},
  ]){
   state.owners=owner?[owner]:[];
   await expect(requireOwnCourseLearnerRead(context())).rejects.toThrow();
  }
  expect(state.select).toHaveBeenCalledTimes(5);
 });
 it("returns the current membership only after live role/tenant/account read",async()=>{
  const c=context();
  expect(await requireOwnCourseLearnerRead(c)).toBe(c.membership);
  expect(requirePermission).toHaveBeenCalledWith(c,"courses.read",{collegeId,organizationId});
 });
 it("requires persisted cohort, tenant, active role and user for direct delivery reads",()=>{
  const src=readFileSync("src/modules/courses/learning-access.ts","utf8");
  for(const required of [
   'eq(learnerProgramEnrollments.cohortId,delivery.cohortId)',
   'eq(collegeMemberships.collegeId,delivery.collegeId)',
   'eq(collegeMemberships.userId,context.user.id)',
   'eq(collegeMemberships.status,"ACTIVE")',
   'eq(users.platformStatus,"ACTIVE")',
   'eq(membershipRoles.role,"LEARNER")',
   'eq(sectionEnrollments.sectionId,',
  ])expect(src).toContain(required);
 });
});
