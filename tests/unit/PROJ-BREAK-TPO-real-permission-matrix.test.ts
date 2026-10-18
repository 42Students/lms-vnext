import {describe,expect,it} from "vitest";
import {can} from "@/modules/permissions/policy";
import type {RequestContext} from "@/modules/identity/context";

const A="aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa", B="bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const ORG_A="cccccccc-cccc-4ccc-8ccc-cccccccccccc",ORG_B="dddddddd-dddd-4ddd-8ddd-dddddddddddd";
const base=(roles:RequestContext["membership"] extends infer M?readonly ("TPO"|"COLLEGE_ADMIN"|"MENTOR"|"FACULTY"|"LEARNER")[]:never,
 collegeId=A,organizationId=ORG_A):RequestContext=>({
 user:{id:"eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee",identityUid:"tpo-role-matrix",
  platformStatus:"ACTIVE",systemRoles:[]},
 membership:{id:"ffffffff-ffff-4fff-8fff-ffffffffffff",collegeId,organizationId,
  status:"ACTIVE",roles},
});
const subject={collegeId:A,organizationId:ORG_A};
describe("PROJ-BREAK-TPO-role-matrix-04 production permission policy",()=>{
 it("allows TPO to manage placements but never manage projects even at the same college",()=>{
  const ctx=base(["TPO"]);
  expect(can(ctx,"placements.manage",subject)).toBe(true);
  expect(can(ctx,"projects.read",subject)).toBe(true);
  expect(can(ctx,"projects.manage",subject)).toBe(false);
  expect(can(ctx,"project-template.manage",subject)).toBe(false);
  expect(can(ctx,"project-template.assign",subject)).toBe(false);
 });
 it("denies foreign college and forged organization for both TPO and College Admin",()=>{
  for(const ctx of [base(["TPO"]),base(["COLLEGE_ADMIN"])]){
   expect(can(ctx,"placements.manage",{collegeId:B,organizationId:ORG_B})).toBe(false);
   expect(can(ctx,"projects.read",{collegeId:A,organizationId:ORG_B})).toBe(false);
   expect(can(ctx,"projects.manage",{collegeId:B,organizationId:ORG_A})).toBe(false);
  }
 });
 it("requires active platform and membership even when the stale cookie retains TPO",()=>{
  const ctx=base(["TPO"]);
  expect(can({...ctx,user:{...ctx.user,platformStatus:"DISABLED"}},"placements.manage",subject)).toBe(false);
  expect(can({...ctx,membership:{...ctx.membership!,status:"DISABLED"}},"projects.read",subject)).toBe(false);
  expect(can({...ctx,membership:null},"projects.manage",subject)).toBe(false);
 });
 it("does not infer project management from faculty, mentor, learner or recruiter context",()=>{
  for(const role of ["MENTOR","FACULTY","LEARNER"] as const){
   expect(can(base([role]),"projects.manage",subject)).toBe(false);
  }
  const recruiter={...base([]),membership:null,recruiter:{
   userId:"eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee",companyId:B,companyName:"Company",
   title:null,status:"ACTIVE" as const,grants:[],
  }};
  expect(can(recruiter,"projects.manage",subject)).toBe(false);
 });
 it("permits scoped Super Admin only within explicitly selected college and organization",()=>{
  const superAdmin={...base([]),membership:null,
   user:{...base([]).user,systemRoles:["SUPER_ADMIN"] as const},
   adminScope:{collegeId:A,organizationId:ORG_A},
  };
  expect(can(superAdmin,"projects.manage",subject)).toBe(true);
  expect(can(superAdmin,"projects.manage",{collegeId:B,organizationId:ORG_B})).toBe(false);
 });
});
