import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {can,requirePermission,AuthorizationError} from "@/modules/permissions/policy";
import {projectNoticeHref} from "@/modules/projects/project-notification-service";
import type {RequestContext} from "@/modules/identity/context";

const college="11111111-1111-4111-8111-111111111111";
const other="22222222-2222-4222-8222-222222222222";
const org="33333333-3333-4333-8333-333333333333";
const otherOrg="44444444-4444-4444-8444-444444444444";
const actor=(roles:("TPO"|"COLLEGE_ADMIN"|"MENTOR"|"LEARNER")[],opts:{
 status?:"ACTIVE"|"SUSPENDED";platform?:"ACTIVE"|"DISABLED";collegeId?:string;orgId?:string;superAdmin?:boolean;
}={}):RequestContext=>({
 user:{id:"55555555-5555-4555-8555-555555555555",identityUid:"actor",platformStatus:opts.platform??"ACTIVE",systemRoles:opts.superAdmin?["SUPER_ADMIN"]:[]},
 membership:{id:"66666666-6666-4666-8666-666666666666",collegeId:opts.collegeId??college,organizationId:opts.orgId??org,status:opts.status??"ACTIVE",roles},
});
const source=(file:string)=>readFileSync(new URL("../../"+file,import.meta.url),"utf8");
describe("IIT Dharwad project isolation: TPO cross-product breaker",()=>{
 it("PROJ-BREAK-TPO-01 permits same-college project read but never TPO mutation, template assignment or role elevation",()=>{
  const tpo=actor(["TPO"]);
  const scope={collegeId:college,organizationId:org};
  expect(can(tpo,"projects.read",scope)).toBe(true);
  expect(can(tpo,"placements.manage",scope)).toBe(true);
  for(const permission of ["projects.manage","project-template.assign","project-template.manage","system-role.manage","membership.role.manage"] as const){
   expect(can(tpo,permission,scope),permission).toBe(false);
   expect(()=>requirePermission(tpo,permission,scope)).toThrow(AuthorizationError);
  }
  expect(()=>requirePermission(tpo,"projects.read",scope)).not.toThrow();
 });
 it("PROJ-BREAK-TPO-02 denies projects and placement data from any wrong college OR organization",()=>{
  const tpo=actor(["TPO"]);
  for(const scope of [
   {collegeId:other,organizationId:org},
   {collegeId:college,organizationId:otherOrg},
   {collegeId:other,organizationId:otherOrg},
  ])for(const permission of ["projects.read","projects.manage","placements.read","placements.manage"] as const)
   expect(can(tpo,permission,scope),JSON.stringify({scope,permission})).toBe(false);
 });
 it("PROJ-BREAK-TPO-03 suspended, disabled or missing memberships cannot view or manage Project data",()=>{
  const valid={collegeId:college,organizationId:org};
  for(const tpo of [actor(["TPO"],{status:"SUSPENDED"}),actor(["TPO"],{platform:"DISABLED"}),
   {...actor(["TPO"]),membership:null}]){
   for(const permission of ["projects.read","projects.manage","placements.read","placements.manage"] as const)
    expect(can(tpo,permission,valid)).toBe(false);
  }
  expect(can(actor(["COLLEGE_ADMIN"]),"projects.manage",valid)).toBe(true);
  expect(can(actor(["MENTOR"]),"projects.manage",valid)).toBe(false);
 });
 it("PROJ-BREAK-TPO-04 honors Super Admin acting-college boundary on project reads and writes",()=>{
  const admin={...actor(["TPO"],{superAdmin:true}),adminScope:{collegeId:college,organizationId:org}};
  expect(can(admin,"projects.manage",{collegeId:college,organizationId:org})).toBe(true);
  expect(can(admin,"projects.read",{collegeId:other,organizationId:org})).toBe(false);
  expect(can(admin,"projects.manage",{collegeId:college,organizationId:otherOrg})).toBe(false);
 });
 it("PROJ-BREAK-TPO-05 project notices may only link to learner/mentor views; never TPO or HR private project destinations",()=>{
  expect(projectNoticeHref("LEARNER",college)).toBe("/learn/projects/"+college);
  expect(projectNoticeHref("MENTOR",college)).toBe("/mentor/projects/"+college);
  expect(projectNoticeHref("MENTOR","../../admin")).toBe("/mentor/projects/..%2F..%2Fadmin");
  expect(projectNoticeHref("LEARNER","a?b#c")).toBe("/learn/projects/a%3Fb%23c");
  const code=source("src/modules/projects/project-notification-service.ts");
  for(const guard of ["isNull(projectMembers.endedAt)","eq(collegeMemberships.collegeId, notice.collegeId)",
   'eq(collegeMemberships.status, "ACTIVE")','eq(users.platformStatus, "ACTIVE")',
   "roles?: (\"LEARNER\" | \"MENTOR\")[]","new Set(rows.map(row => row.userId))",
   "filter(id => id !== notice.exceptUserId)"])
   expect(code).toContain(guard);
 });
});
