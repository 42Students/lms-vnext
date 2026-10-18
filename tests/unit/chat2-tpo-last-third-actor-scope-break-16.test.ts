import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";
import type {MembershipRole} from "@/modules/identity/constants";
import type {RequestContext} from "@/modules/identity/context";
import {can} from "@/modules/permissions/policy";
import {canOpenTpoWorkspace,hasTpoTooling} from "@/modules/placements/tpo-workspace-access-model";

const college="11111111-1111-4111-8111-111111111111";
const foreignCollege="22222222-2222-4222-8222-222222222222";
const org="33333333-3333-4333-8333-333333333333";
const foreignOrg="44444444-4444-4444-8444-444444444444";

function actor(role:MembershipRole,options:{
 collegeId?:string;organizationId?:string;status?:"ACTIVE"|"SUSPENDED";
 platformStatus?:"ACTIVE"|"DISABLED";
}={}):RequestContext{
 return {user:{id:"55555555-5555-4555-8555-555555555555",
  identityUid:"test",platformStatus:options.platformStatus??"ACTIVE",systemRoles:[]},
  membership:{id:"66666666-6666-4666-8666-666666666666",
   collegeId:options.collegeId??college,organizationId:options.organizationId??org,
   status:options.status??"ACTIVE",roles:[role]}};
}

describe("UX-tpo-LAST-THIRD-01 account authorization journey across 42 inherited routes",()=>{
 it("TPO gets own-college tooling; college admin gets delegated placement workspace without impersonating a TPO",()=>{
  expect(canOpenTpoWorkspace(actor("TPO"))).toBe(true);
  expect(hasTpoTooling(actor("TPO"))).toBe(true);
  expect(canOpenTpoWorkspace(actor("COLLEGE_ADMIN"))).toBe(true);
  expect(hasTpoTooling(actor("COLLEGE_ADMIN"))).toBe(false);
  expect(can(actor("COLLEGE_ADMIN"),"placements.manage",{collegeId:foreignCollege,organizationId:org})).toBe(false);
  expect(can(actor("COLLEGE_ADMIN"),"placements.manage",{collegeId:college,organizationId:foreignOrg})).toBe(false);
 });
 it("learner, faculty and mentor memberships never inherit TPO write access",()=>{
  for(const role of ["LEARNER","FACULTY","MENTOR"] as const){
   expect(canOpenTpoWorkspace(actor(role)),role).toBe(false);
   expect(hasTpoTooling(actor(role)),role).toBe(false);
  }
 });
 it("revoked, disabled and absent sessions fail closed even if the URL still points into TPO",()=>{
  for(const session of [null,undefined,
   actor("TPO",{status:"SUSPENDED"}),actor("TPO",{platformStatus:"DISABLED"}),
   {...actor("TPO"),membership:null},
  ]){
   expect(canOpenTpoWorkspace(session)).toBe(false);
   expect(hasTpoTooling(session)).toBe(false);
  }
 });
 it("a recruiter relationship without a live college TPO membership cannot open the workspace",()=>{
  const recruiter:RequestContext={user:{id:"user",identityUid:"identity",platformStatus:"ACTIVE",systemRoles:[]},
   membership:null,recruiter:{userId:"user",companyId:"company",companyName:"Employer",title:null,status:"ACTIVE",
    grants:[{id:"grant",organizationId:org,collegeId:college,collegeName:"College",
     companyRelationshipId:"company-relationship"}]}};
  expect(canOpenTpoWorkspace(recruiter)).toBe(false);
  expect(hasTpoTooling(recruiter)).toBe(false);
 });
 it("the top-level Next.js layout redirects before any private inbox or notifications are fetched",()=>{
  const source=readFileSync("src/app/(authenticated)/tpo/layout.tsx","utf8");
  const guard=source.indexOf("if (!canOpenTpoWorkspace(context)) redirect(deniedPortalHome(context))");
  expect(guard).toBeGreaterThan(-1);
  expect(guard).toBeLessThan(source.indexOf("getTpoPersonalInbox(context,"));
  expect(guard).toBeLessThan(source.indexOf("countTpoUnreadRecruiterMessages(context)"));
  expect(source).toContain("if (!hasTpoTooling(context))");
 });
});
