import {beforeEach,describe,expect,it,vi} from "vitest";

const state=vi.hoisted(()=>({
 read:vi.fn(),permission:vi.fn(),
 owners:[] as Array<{userId:string;collegeId:string;status:string;userStatus:string}>,
}));
vi.mock("@/db/client",()=>({
 getDb:()=>({
  select:state.read,
 }),
}));
vi.mock("@/modules/permissions/policy",()=>({
 AuthorizationError:class AuthorizationError extends Error {
  constructor(permission:string){super("Permission denied: "+permission);}
 },
 requirePermission:state.permission,
}));
import {requireOwnCourseLearnerRead} from "@/modules/courses/learner-access-guard";

const userId="11111111-1111-4111-8111-111111111111";
const memberId="22222222-2222-4222-8222-222222222222";
const collegeId="33333333-3333-4333-8333-333333333333";
const organizationId="44444444-4444-4444-8444-444444444444";
const context=(override:Record<string,unknown>={})=>({
 user:{id:userId,platformStatus:"ACTIVE"},
 membership:{id:memberId,userId,collegeId,organizationId,status:"ACTIVE",roles:["LEARNER"]},
 ...override,
}) as unknown as Parameters<typeof requireOwnCourseLearnerRead>[0];
beforeEach(()=>{
 state.owners=[{userId,collegeId,status:"ACTIVE",userStatus:"ACTIVE"}];
 state.read.mockReset();state.permission.mockReset();
 state.read.mockImplementation(()=>{
  const chain={
   from(){return chain;},innerJoin(){return chain;},
   where(){return chain;},limit(){return Promise.resolve(state.owners);},
  };
  return chain;
 });
});
describe("COURSES-BREAK-LEARNER-ACCESS-01 hostile and expired own-course requests",()=>{
 it("reads only an active persisted learner in the selected college",async()=>{
  const actor=context();
  await expect(requireOwnCourseLearnerRead(actor)).resolves.toEqual(actor.membership);
  expect(state.permission).toHaveBeenCalledWith(actor,"courses.read",{
   collegeId,organizationId,
  });
  expect(state.read).toHaveBeenCalledTimes(1);
 });
 it.each(["SUSPENDED","DISABLED","ENDED"] as const)(
  "refuses %s selected membership before touching the database",async(status)=>{
   const actor=context({membership:{...context().membership,status}});
   await expect(requireOwnCourseLearnerRead(actor)).rejects.toThrow();
   expect(state.read).not.toHaveBeenCalled();
  },
 );
 it("refuses absent membership, wrong role and disabled signed-in user before database reads",async()=>{
  for(const actor of [
   context({membership:null}),
   context({membership:{...context().membership,roles:["FACULTY"]}}),
   context({user:{id:userId,platformStatus:"DISABLED"}}),
  ]){
   await expect(requireOwnCourseLearnerRead(actor)).rejects.toThrow();
  }
  expect(state.read).not.toHaveBeenCalled();
 });
 it("refuses a deleted membership or a revoked persisted learner-role join",async()=>{
  state.owners=[];
  await expect(requireOwnCourseLearnerRead(context())).rejects.toThrow();
 });
 it.each([
  [{userId:"foreign-user",collegeId,status:"ACTIVE",userStatus:"ACTIVE"}],
  [{userId,collegeId:"foreign-college",status:"ACTIVE",userStatus:"ACTIVE"}],
  [{userId,collegeId,status:"DISABLED",userStatus:"ACTIVE"}],
  [{userId,collegeId,status:"ACTIVE",userStatus:"DISABLED"}],
 ])("refuses mismatched or inactive persisted identity %#",async(owner)=>{
  state.owners=[owner];
  await expect(requireOwnCourseLearnerRead(context())).rejects.toThrow();
 });
 it("refuses a malformed selected membership UUID before invoking the database",async()=>{
  const actor=context({membership:{...context().membership,id:"forged-id"}});
  await expect(requireOwnCourseLearnerRead(actor)).rejects.toThrow();
  expect(state.read).not.toHaveBeenCalled();
 });
 it("honors a global permission denial before database reads",async()=>{
  state.permission.mockImplementationOnce(()=>{throw new Error("denied");});
  await expect(requireOwnCourseLearnerRead(context())).rejects.toThrow("denied");
  expect(state.read).not.toHaveBeenCalled();
 });
});
