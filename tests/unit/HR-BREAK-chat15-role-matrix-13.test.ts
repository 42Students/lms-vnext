import {describe,expect,it} from "vitest";
import {can} from "@/modules/permissions/policy";
import type {RequestContext} from "@/modules/identity/context";

const userId="123e4567-e89b-42d3-a456-426614174001";
const college="123e4567-e89b-42d3-a456-426614174002";
const otherCollege="123e4567-e89b-42d3-a456-426614174003";
const organization="123e4567-e89b-42d3-a456-426614174004";
const otherOrganization="123e4567-e89b-42d3-a456-426614174005";
const relationship="123e4567-e89b-42d3-a456-426614174006";
const otherRelationship="123e4567-e89b-42d3-a456-426614174007";
const grant={id:"123e4567-e89b-42d3-a456-426614174008",organizationId:organization,
 collegeId:college,collegeName:"College A",companyRelationshipId:relationship};
const recruiter:RequestContext={
 user:{id:userId,identityUid:"verified-work-login",platformStatus:"ACTIVE",systemRoles:[]},
 membership:null,
 recruiter:{userId,companyId:"123e4567-e89b-42d3-a456-426614174009",
  companyName:"Employer A",title:null,status:"ACTIVE",grants:[grant]},
};
const membership=(role:"FACULTY"|"TPO"|"COLLEGE_ADMIN"):RequestContext=>({
 user:recruiter.user,recruiter:null,
 membership:{id:"123e4567-e89b-42d3-a456-426614174010",collegeId:college,
  organizationId:organization,status:"ACTIVE",roles:[role]},
});
const companyScope={collegeId:college,placementCompanyRelationshipId:relationship};
const collegeScope={collegeId:college,organizationId:organization};
describe("HR-ROLE-MATRIX-13 role separation and cross-tenant authorization",()=>{
 it("recruiter has only own-relationship HR capabilities, never TPO offers or project admin",()=>{
  for(const permission of [
   "placements.recruiter.read","placements.recruiter.round.manage",
   "placements.recruiter.slot.manage","placements.recruiter.result.stage",
  ] as const)expect(can(recruiter,permission,companyScope)).toBe(true);
  expect(can(recruiter,"placements.manage",collegeScope)).toBe(false);
  expect(can(recruiter,"projects.manage",collegeScope)).toBe(false);
  expect(can(recruiter,"projects.read",collegeScope)).toBe(false);
  expect(can(recruiter,"academics.manage",collegeScope)).toBe(false);
 });
 it("recruiter cannot borrow a valid company relationship for a foreign college or sibling relationship",()=>{
  for(const scope of [
   {...companyScope,collegeId:otherCollege},
   {...companyScope,placementCompanyRelationshipId:otherRelationship},
   {collegeId:college},
   {placementCompanyRelationshipId:relationship},
  ])expect(can(recruiter,"placements.recruiter.read",scope)).toBe(false);
 });
 it("HR-GRANT-OWNER-20 central policy forbids a valid college grant attached to a different recruiter session",()=>{
  const swapped={...recruiter,recruiter:{...recruiter.recruiter!,userId:otherRelationship}};
  for(const permission of ["placements.recruiter.read","placements.recruiter.round.manage",
    "placements.recruiter.slot.manage","placements.recruiter.outside.record",
    "placements.recruiter.result.stage","placements.recruiter.note"] as const){
    expect(can(swapped,permission,companyScope)).toBe(false);
    expect(can(recruiter,permission,{...companyScope,collegeId:" "})).toBe(false);
    expect(can(recruiter,permission,{...companyScope,placementCompanyRelationshipId:" "})).toBe(false);
    expect(can(recruiter,permission,companyScope)).toBe(true);
  }
 });
 it("TPO can manage placement flow but cannot invoke recruiter-only round or slot writes",()=>{
  const tpo=membership("TPO");
  expect(can(tpo,"placements.manage",collegeScope)).toBe(true);
  expect(can(tpo,"placements.recruiter.round.manage",companyScope)).toBe(false);
  expect(can(tpo,"placements.recruiter.slot.manage",companyScope)).toBe(false);
  expect(can(tpo,"projects.manage",collegeScope)).toBe(false);
  expect(can(tpo,"placements.manage",{collegeId:otherCollege,organizationId:organization})).toBe(false);
 });
 it("college administrator has college-scoped management, but cannot impersonate recruiter grant",()=>{
  const admin=membership("COLLEGE_ADMIN");
  expect(can(admin,"placements.manage",collegeScope)).toBe(true);
  expect(can(admin,"projects.manage",collegeScope)).toBe(true);
  expect(can(admin,"placements.recruiter.read",companyScope)).toBe(false);
  expect(can(admin,"placements.manage",{collegeId:college,organizationId:otherOrganization})).toBe(false);
  expect(can(membership("FACULTY"),"placements.manage",collegeScope)).toBe(false);
 });
 it("disabled sessions and removed memberships deny both management and recruiter views",()=>{
  const inactive={...recruiter,user:{...recruiter.user,platformStatus:"DISABLED" as const}};
  expect(can(inactive,"placements.recruiter.read",companyScope)).toBe(false);
  expect(can({...recruiter,recruiter:null},"placements.recruiter.read",companyScope)).toBe(false);
  const tpo=membership("TPO");
  expect(can({...tpo,membership:{...tpo.membership!,status:"SUSPENDED"}} as RequestContext,
   "placements.manage",collegeScope)).toBe(false);
 });
 it("Super Admin cannot repurpose its college scope as a recruiter identity",()=>{
  const superAdmin:RequestContext={user:{...recruiter.user,systemRoles:["SUPER_ADMIN"]},
   membership:null,adminScope:{collegeId:college,organizationId:organization}};
  expect(can(superAdmin,"placements.manage",collegeScope)).toBe(true);
  expect(can(superAdmin,"placements.manage",{collegeId:college,organizationId:otherOrganization})).toBe(false);
  expect(can(superAdmin,"placements.manage",{collegeId:otherCollege,organizationId:organization})).toBe(false);
  expect(can(superAdmin,"placements.recruiter.read",companyScope)).toBe(false);
 });
});
