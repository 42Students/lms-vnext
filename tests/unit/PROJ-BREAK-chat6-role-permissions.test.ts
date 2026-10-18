import {describe,it,expect} from "vitest";
import {can} from "@/modules/permissions/policy";
import type {RequestContext} from "@/modules/identity/context";
const collegeA="11111111-1111-4111-8111-111111111111";
const collegeB="22222222-2222-4222-8222-222222222222";
const orgA="33333333-3333-4333-8333-333333333333";
const orgB="44444444-4444-4444-8444-444444444444";
const make=(roles:("LEARNER"|"FACULTY"|"MENTOR"|"COLLEGE_ADMIN"|"TPO")[],
 status:"ACTIVE"|"SUSPENDED"|"ENDED"="ACTIVE"):RequestContext=>({
 user:{id:"55555555-5555-4555-8555-555555555555",identityUid:"member",
  platformStatus:"ACTIVE",systemRoles:[]},
 membership:{id:"66666666-6666-4666-8666-666666666666",collegeId:collegeA,
  organizationId:orgA,status,roles},
});
const own={collegeId:collegeA,organizationId:orgA};
const wrongCollege={collegeId:collegeB,organizationId:orgA};
const wrongOrg={collegeId:collegeA,organizationId:orgB};
describe("IIT Dharwad Projects breaker — live permission matrix for every account",()=>{
 it("PROJ-BREAK-idor-02 every college role can only read within both active scope dimensions",()=>{
  for(const role of ["LEARNER","FACULTY","MENTOR","COLLEGE_ADMIN","TPO"] as const){
   const ctx=make([role]);
   expect(can(ctx,"projects.read",own),role).toBe(true);
   expect(can(ctx,"projects.read",wrongCollege),role).toBe(false);
   expect(can(ctx,"projects.read",wrongOrg),role).toBe(false);
  }
 });
 it("PROJ-BREAK-idor-03 only College Admin can manage its matching tenant project",()=>{
  for(const role of ["LEARNER","FACULTY","MENTOR","TPO"] as const){
   expect(can(make([role]),"projects.manage",own),role).toBe(false);
  }
  expect(can(make(["COLLEGE_ADMIN"]),"projects.manage",own)).toBe(true);
  expect(can(make(["COLLEGE_ADMIN"]),"projects.manage",wrongCollege)).toBe(false);
  expect(can(make(["COLLEGE_ADMIN"]),"projects.manage",wrongOrg)).toBe(false);
 });
 it("PROJ-BREAK-idor-04 expired/removed and deactivated memberships never authorize Projects",()=>{
  for(const status of ["SUSPENDED","ENDED"] as const){
   for(const permission of ["projects.read","projects.manage"] as const)
    expect(can(make(["COLLEGE_ADMIN"],status),permission,own)).toBe(false);
  }
  const disabled={...make(["COLLEGE_ADMIN"]),user:{
   ...make(["COLLEGE_ADMIN"]).user,platformStatus:"DISABLED" as const}};
  expect(can(disabled,"projects.read",own)).toBe(false);
  expect(can(disabled,"projects.manage",own)).toBe(false);
  expect(can(null,"projects.read",own)).toBe(false);
 });
 it("PROJ-BREAK-idor-05 Super Admin acts only inside selected college or organization",()=>{
  const superAdmin={...make([]),user:{
   ...make([]).user,systemRoles:["SUPER_ADMIN" as const]}};
  expect(can(superAdmin,"projects.manage",own)).toBe(true);
  const scoped={...superAdmin,adminScope:{collegeId:collegeA,organizationId:orgA}};
  expect(can(scoped,"projects.read",own)).toBe(true);
  expect(can(scoped,"projects.manage",wrongCollege)).toBe(false);
  expect(can(scoped,"projects.manage",wrongOrg)).toBe(false);
  const organizationScoped={...superAdmin,adminScope:{collegeId:null,organizationId:orgA}};
  expect(can(organizationScoped,"projects.manage",own)).toBe(true);
  expect(can(organizationScoped,"projects.read",{collegeId:collegeB,organizationId:orgB})).toBe(false);
 });
 it("PROJ-BREAK-idor-06 recruiter role alone cannot list or manage Projects via generic grants",()=>{
  const recruiter={...make([]),membership:null,
   recruiter:{userId:"77777777-7777-4777-8777-777777777777",
    companyId:"88888888-8888-4888-8888-888888888888",
    companyName:"Demo Recruiter",title:null,status:"ACTIVE" as const,
    grants:[{id:"99999999-9999-4999-8999-999999999999",
     organizationId:orgA,collegeId:collegeA,collegeName:"IIT Dharwad",
     companyRelationshipId:"aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa"}]}};
  expect(can(recruiter,"projects.read",own)).toBe(false);
  expect(can(recruiter,"projects.manage",own)).toBe(false);
 });
});
