import {describe,expect,it} from "vitest";
import type {RequestContext} from "@/modules/identity/context";
import {getProjectAdminCollegeId} from "@/modules/projects/admin-college-scope";
import {mayRecordCollegeAdminDeliveryLock} from "@/modules/projects/admin-submission-lock-policy";

const collegeId="11111111-1111-4111-8111-111111111111";
const otherCollegeId="22222222-2222-4222-8222-222222222222";
const organizationId="33333333-3333-4333-8333-333333333333";
const otherOrganizationId="44444444-4444-4444-8444-444444444444";
const context:RequestContext={
 user:{id:"55555555-5555-4555-8555-555555555555",identityUid:"actor",
  platformStatus:"ACTIVE",systemRoles:[]},
 membership:{id:"66666666-6666-4666-8666-666666666666",
  collegeId,organizationId,status:"ACTIVE",roles:["COLLEGE_ADMIN"]},
 adminScope:null,
};

describe("IIT Dharwad College Projects membership and Super Admin tenant scope",()=>{
 it("PROJ-BREAK-admin-idor-18 active College Admin may use own workspace; inactive, removed and wrong role cannot",()=>{
  expect(getProjectAdminCollegeId(context)).toBe(collegeId);
  const learner:RequestContext={...context,membership:{...context.membership!,roles:["LEARNER"]}};
  const tpo:RequestContext={...context,membership:{...context.membership!,roles:["TPO"]}};
  const inactive:RequestContext={...context,membership:{...context.membership!,status:"DISABLED"}};
  const removed:RequestContext={...context,membership:null};
  const disabled:RequestContext={...context,user:{...context.user,platformStatus:"DISABLED"}};
  for(const candidate of [learner,tpo,inactive,removed,disabled]){
   expect(getProjectAdminCollegeId(candidate)).toBeNull();
  }
 });
 it("PROJ-BREAK-admin-idor-19 Super Admin requires an explicit selected college and never uses unrelated membership",()=>{
  const sa:RequestContext={
   ...context,
   user:{...context.user,systemRoles:["SUPER_ADMIN"]},
   adminScope:{organizationId:null,collegeId:null},
  };
  expect(getProjectAdminCollegeId(sa)).toBeNull();
  expect(getProjectAdminCollegeId({...sa,adminScope:null})).toBeNull();
  expect(getProjectAdminCollegeId({...sa,adminScope:{organizationId,collegeId:null}})).toBeNull();
  expect(getProjectAdminCollegeId({...sa,adminScope:{organizationId,collegeId:otherCollegeId}})).toBe(otherCollegeId);
  expect(getProjectAdminCollegeId({...sa,user:{...sa.user,platformStatus:"DISABLED"},
   adminScope:{organizationId,collegeId}})).toBeNull();
 });
 it("PROJ-BREAK-admin-idor-20 delivery lock requires the real active College Admin membership in both tenant dimensions",()=>{
  expect(mayRecordCollegeAdminDeliveryLock(context,collegeId,organizationId)).toBe(true);
  expect(mayRecordCollegeAdminDeliveryLock(context,otherCollegeId,organizationId)).toBe(false);
  expect(mayRecordCollegeAdminDeliveryLock(context,collegeId,otherOrganizationId)).toBe(false);
  const stale:RequestContext={...context,membership:{...context.membership!,status:"DISABLED"}};
  const wrongRole:RequestContext={...context,membership:{...context.membership!,roles:["MENTOR"]}};
  const disabled:RequestContext={...context,user:{...context.user,platformStatus:"DISABLED"}};
  const scopedSa:RequestContext={...context,user:{...context.user,systemRoles:["SUPER_ADMIN"]},
   membership:null,adminScope:{collegeId,organizationId}};
  for(const candidate of [stale,wrongRole,disabled,scopedSa]){
   expect(mayRecordCollegeAdminDeliveryLock(candidate,collegeId,organizationId)).toBe(false);
  }
 });
});
