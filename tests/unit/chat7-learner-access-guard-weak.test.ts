import {beforeEach,describe,expect,it,vi} from "vitest";

const state=vi.hoisted(()=>({
 rows:[] as Array<{userId:string;collegeId:string;status:string;userStatus:string}>,
 selections:vi.fn(),
 permission:vi.fn(),
}));
vi.mock("@/db/client",()=>({getDb:()=>({select:state.selections})}));
vi.mock("@/modules/permissions/policy",()=>({
 AuthorizationError:class AuthorizationError extends Error{},
 requirePermission:state.permission,
}));
import {requireOwnCourseLearnerRead} from "@/modules/courses/learner-access-guard";

const learnerId="11111111-1111-4111-8111-111111111111";
const ownerId="22222222-2222-4222-8222-222222222222";
const collegeId="33333333-3333-4333-8333-333333333333";
const otherCollege="44444444-4444-4444-8444-444444444444";
const ctx={
 user:{id:ownerId,platformStatus:"ACTIVE"},
 membership:{id:learnerId,status:"ACTIVE",roles:["LEARNER"],collegeId,organizationId:"org-1"},
};
const context=(o:unknown)=>o as Parameters<typeof requireOwnCourseLearnerRead>[0];
const owner={userId:ownerId,collegeId,status:"ACTIVE",userStatus:"ACTIVE"};
beforeEach(()=>{
 state.rows=[owner];
 state.selections.mockReset();
 state.permission.mockReset();
 state.selections.mockImplementation(()=>({
  from(){return this;},innerJoin(){return this;},where(){return this;},
  limit(){return Promise.resolve(state.rows);},
 }));
});
describe("COURSES-WEAK-LEARNER-ACCESS-01 active persisted membership and cross-tenant denial",()=>{
 it("rejects inactive, non-learner and suspended account before any database query",async()=>{
  for(const suspect of [
   {...ctx,membership:null},
   {...ctx,membership:{...ctx.membership,status:"ENDED"}},
   {...ctx,membership:{...ctx.membership,roles:["FACULTY"]}},
   {...ctx,user:{...ctx.user,platformStatus:"SUSPENDED"}},
  ]){
   await expect(requireOwnCourseLearnerRead(context(suspect))).rejects.toThrow();
  }
  expect(state.selections).not.toHaveBeenCalled();
  expect(state.permission).not.toHaveBeenCalled();
 });
 it("checks requested college/organization scope and persisted row before returning learner membership",async()=>{
  await expect(requireOwnCourseLearnerRead(context(ctx))).resolves.toEqual(ctx.membership);
  expect(state.permission).toHaveBeenCalledWith(context(ctx),"courses.read",{
   collegeId,organizationId:"org-1",
  });
  expect(state.selections).toHaveBeenCalledTimes(1);
 });
 it("fails closed for missing row, another tenant, foreign owner, revoked membership or suspended DB user",async()=>{
  const unauthorized=[
   [],[{...owner,collegeId:otherCollege}],[{...owner,userId:learnerId}],
   [{...owner,status:"ENDED"}],[{...owner,userStatus:"SUSPENDED"}],
  ];
  for(const rows of unauthorized){
   state.rows=rows;
   await expect(requireOwnCourseLearnerRead(context(ctx))).rejects.toThrow();
  }
 });
});
