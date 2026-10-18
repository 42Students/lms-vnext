import {describe,expect,it} from "vitest";
import {can} from "@/modules/permissions/policy";
import {canOpenTpoWorkspace,hasTpoTooling} from "@/modules/placements/tpo-workspace-access-model";
import type {RequestContext} from "@/modules/identity/context";

/** PROJ-BREAK-TPO-ROLE-01 / IIT Dharwad: TPO may read scoped Projects facts,
 * but must never mutate a project. Recruiter grants are not project grants. */
const scope={organizationId:"orgA",collegeId:"collegeA"};
const otherCollege={organizationId:"orgA",collegeId:"collegeB"};
const otherOrg={organizationId:"orgB",collegeId:"collegeA"};
const context=(roles:readonly string[],status="ACTIVE",platformStatus="ACTIVE"):RequestContext=>({
 user:{id:"u",identityUid:"id",platformStatus,systemRoles:[]},
 membership:{id:"membership",collegeId:"collegeA",organizationId:"orgA",
  roles,status},
}) as unknown as RequestContext;

describe("PROJ-BREAK-TPO-ROLE-01 Projects and placements per-account scope",()=>{
 it("allows only a same-college read of Projects; TPO never gains edit, publish or assignment rights",()=>{
  const tpo=context(["TPO"]);
  expect(can(tpo,"projects.read",scope)).toBe(true);
  expect(can(tpo,"projects.manage",scope)).toBe(false);
  expect(can(tpo,"project-template.manage",scope)).toBe(false);
  expect(can(tpo,"project-template.assign",scope)).toBe(false);
  expect(can(tpo,"projects.read",otherCollege)).toBe(false);
  expect(can(tpo,"projects.read",otherOrg)).toBe(false);
  expect(can(tpo,"placements.manage",scope)).toBe(true);
  expect(canOpenTpoWorkspace(tpo)).toBe(true);
  expect(hasTpoTooling(tpo)).toBe(true);
 });
 it("rejects suspended membership, disabled platform account and missing session across both modules",()=>{
  for(const c of [context(["TPO"],"SUSPENDED"),
   context(["TPO"],"ACTIVE","DISABLED"),{...context(["TPO"]),membership:null}]){
   expect(can(c,"projects.read",scope)).toBe(false);
   expect(can(c,"placements.manage",scope)).toBe(false);
   expect(hasTpoTooling(c)).toBe(false);
  }
  expect(can(null,"projects.read",scope)).toBe(false);
  expect(can(undefined,"placements.manage",scope)).toBe(false);
 });
 it("College Admin retains same-college project mutation but not another college's",()=>{
  const admin=context(["COLLEGE_ADMIN"]);
  expect(can(admin,"projects.manage",scope)).toBe(true);
  expect(can(admin,"projects.manage",otherCollege)).toBe(false);
  expect(can(admin,"projects.manage",otherOrg)).toBe(false);
  expect(canOpenTpoWorkspace(admin)).toBe(true);
  expect(hasTpoTooling(admin)).toBe(false);
 });
 it("recruiter company grants do not grant Projects visibility or TPO privileges",()=>{
  const recruiter={
   user:{id:"hr",identityUid:"hr",platformStatus:"ACTIVE",systemRoles:[]},
   membership:null,
   recruiter:{userId:"hr",companyId:"companyA",companyName:"Employer",title:null,status:"ACTIVE",grants:[
    {id:"grant",organizationId:"orgA",collegeId:"collegeA",collegeName:"College",
     companyRelationshipId:"relationshipA"},
   ]},
  } as unknown as RequestContext;
  expect(can(recruiter,"placements.recruiter.read",{
   ...scope,placementCompanyRelationshipId:"relationshipA"})).toBe(true);
  expect(can(recruiter,"projects.read",scope)).toBe(false);
  expect(can(recruiter,"projects.manage",scope)).toBe(false);
  expect(canOpenTpoWorkspace(recruiter)).toBe(false);
  expect(can(recruiter,"placements.recruiter.read",{
   ...scope,placementCompanyRelationshipId:"relationshipB"})).toBe(false);
 });
 it("Super Admin cannot use a selected-college scope to read another college's project",()=>{
  const root={
   ...context(["TPO"]),
   user:{...context(["TPO"]).user,systemRoles:["SUPER_ADMIN"]},
   adminScope:{collegeId:"collegeA",organizationId:"orgA"},
  } as unknown as RequestContext;
  expect(can(root,"projects.read",scope)).toBe(true);
  expect(can(root,"projects.manage",scope)).toBe(true);
  expect(can(root,"projects.manage",otherCollege)).toBe(false);
  expect(can(root,"projects.read",otherOrg)).toBe(false);
 });
});
