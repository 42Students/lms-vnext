import {describe,expect,it} from "vitest";
import {can} from "@/modules/permissions/policy";
import type {RequestContext} from "@/modules/identity/context";
import {mayMutateProjectWithRole,PROJECT_MEMBER_ROLE_KINDS} from "@/modules/projects/member-role-kind-model";

const COLLEGE_A="11111111-1111-4111-8111-111111111111";
const COLLEGE_B="22222222-2222-4222-8222-222222222222";
const ORG_A="33333333-3333-4333-8333-333333333333";
const ORG_B="44444444-4444-4444-8444-444444444444";
type MembershipRole=NonNullable<RequestContext["membership"]>["roles"][number];

function actor(role:MembershipRole,status:"ACTIVE"|"SUSPENDED"|"ENDED"="ACTIVE"):RequestContext {
 return {
  user:{id:"actor",identityUid:"actor-identity",platformStatus:"ACTIVE",systemRoles:[]},
  membership:{id:"mentor-membership",collegeId:COLLEGE_A,organizationId:ORG_A,status,roles:[role]},
 };
}
const own={collegeId:COLLEGE_A,organizationId:ORG_A};

describe("PROJ-BREAK-MENTOR role and tenant permission matrix",()=>{
 it("PROJ-BREAK-mentor-idor-01 active mentor reads own tenant but cannot inherit admin mutation rights",()=>{
  const context=actor("MENTOR");
  expect(can(context,"projects.read",own)).toBe(true);
  expect(can(context,"projects.manage",own)).toBe(false);
  expect(can(context,"projects.read",{...own,collegeId:COLLEGE_B})).toBe(false);
  expect(can(context,"projects.read",{...own,organizationId:ORG_B})).toBe(false);
 });
 it("PROJ-BREAK-mentor-idor-02 terminated or suspended memberships and deactivated identities fail closed",()=>{
  for(const status of ["SUSPENDED","ENDED"] as const){
   expect(can(actor("MENTOR",status),"projects.read",own)).toBe(false);
   expect(can(actor("MENTOR",status),"projects.manage",own)).toBe(false);
  }
  const disabled=actor("MENTOR");
  disabled.user.platformStatus="DISABLED";
  expect(can(disabled,"projects.read",own)).toBe(false);
  expect(can(null,"projects.read",own)).toBe(false);
 });
 it("PROJ-BREAK-mentor-roles-03 mutable project membership requires both a recognized role kind and explicit grant",()=>{
  for(const kind of PROJECT_MEMBER_ROLE_KINDS){
   expect(mayMutateProjectWithRole(kind,false),kind).toBe(false);
   expect(mayMutateProjectWithRole(kind,true),kind)
    .toBe(kind==="MENTOR"||kind==="CO_MENTOR");
  }
 });
 it("PROJ-BREAK-mentor-roles-04 faculty, learner, TPO and admin display roles cannot themselves confer mentor capabilities",()=>{
  for(const role of ["FACULTY","LEARNER","TPO","COLLEGE_ADMIN"] as const){
   const context=actor(role);
   expect(can(context,"projects.read",own),role).toBe(true);
   expect(mayMutateProjectWithRole("OBSERVER",true),role).toBe(false);
  }
  expect(can(actor("COLLEGE_ADMIN"),"projects.manage",own)).toBe(true);
  expect(can(actor("COLLEGE_ADMIN"),"projects.manage",{...own,collegeId:COLLEGE_B})).toBe(false);
 });
});
