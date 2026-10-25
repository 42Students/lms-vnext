import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";
import {can} from "@/modules/permissions/policy";
import type {RequestContext} from "@/modules/identity/context";

const collegeId="11111111-1111-4111-8111-111111111111";
const organizationId="33333333-3333-4333-8333-333333333333";
const owner:RequestContext={
 user:{id:"44444444-4444-4444-8444-444444444444",
 identityUid:"admin",platformStatus:"ACTIVE",systemRoles:[]},
 membership:{id:"55555555-5555-4555-8555-555555555555",
 collegeId,organizationId,status:"ACTIVE",roles:["COLLEGE_ADMIN"]},
};
const src=readFileSync("src/modules/projects/member-service.ts","utf8");

describe("PROJ-COL-REVOKE-03 member/mentor mutation safety",()=>{
 it("allows active College Admin only inside own college and denies revoked/expired actors",()=>{
  const resource={collegeId,organizationId};
  expect(can(owner,"projects.manage",resource)).toBe(true);
  const denied:RequestContext[]=[
   {...owner,membership:{...owner.membership!,status:"SUSPENDED"}},
   {...owner,membership:{...owner.membership!,status:"ENDED"}},
   {...owner,user:{...owner.user,platformStatus:"DISABLED"}},
   {...owner,membership:{...owner.membership!,collegeId:"22222222-2222-4222-8222-222222222222"}},
   {...owner,membership:{...owner.membership!,roles:["LEARNER"]}},
   {...owner,membership:null},
  ];
  for(const actor of denied)expect(can(actor,"projects.manage",resource)).toBe(false);
 });
 it("rechecks persisted actor under locked project before no-op or member writes in all four mutations",()=>{
  const operations=[
   ["reassignProjectPrimaryMentor","bulkReassignProjectMentor","const [eligibleTarget]"],
   ["addProjectMember","updateProjectMember","const [created]="],
   ["updateProjectMember","endProjectMember","const [fresh]="],
   ["endProjectMember","listProjectMembers","const [fresh]"],
  ] as const;
  for(const [name,next,after] of operations){
   const begin=src.indexOf("export async function "+name+"(");
   const end=src.indexOf("export async function "+next+"(",begin);
   const action=src.slice(begin,end);
   const lock=action.indexOf('.for("update")');
   const check=action.indexOf('assertPersistedPlatformPermission(tx,context,"projects.manage"');
   const future=action.indexOf(after);
   expect(begin,name).toBeGreaterThan(0);
   expect(end,name).toBeGreaterThan(begin);
   expect(lock,name).toBeGreaterThan(0);
   if(name==="reassignProjectPrimaryMentor"){
    expect(check,name).toBeGreaterThan(lock);
   }else{
    // These three shared mutations have two persisted authorization paths:
    // live Mentor project membership or live College Admin permission.
    expect(action,name).toContain("assertPersistedProjectMutationActor(tx,context,scope)");
    expect(check,name).toBeGreaterThan(lock);
   }
   expect(future,name).toBeGreaterThan(check);
   expect(action,name).toContain("collegeId:scope.collegeId,organizationId:scope.organizationId");
   expect(action,name).toMatch(/project\.status\s*===\s*"ARCHIVED"|\["ARCHIVED","COMPLETED"\]\.includes\(project\.status\)/);
  }
  expect(src).toContain("recordActivityEventInTransaction(");
  expect(src).toContain("notifyProjectMemberships(tx");
 });
 it("PROJ-COL-REVOKE-04 validates the target learner/mentor and locks their platform role inside the same insert transaction",()=>{
  const helperStart=src.indexOf("async function loadEligibleMembership(");
  const helperEnd=src.indexOf("async function loadActiveProjectMember(",helperStart);
  const helper=src.slice(helperStart,helperEnd);
  expect(helper).toContain("tx: PermissionTransaction");
  expect(helper).toContain('eq(collegeMemberships.status, "ACTIVE")');
  expect(helper).toContain('eq(membershipRoles.role, role)');
  expect(helper).toContain('.for("share")');
  expect(helper).toContain('membership.platformStatus !== "ACTIVE"');
  const begin=src.indexOf("export async function addProjectMember(");
  const end=src.indexOf("export async function updateProjectMember(",begin);
  const action=src.slice(begin,end);
  const tx=action.indexOf("getDb().transaction(async tx =>");
  const actor=action.indexOf('assertPersistedPlatformPermission(tx,context,"projects.manage"');
  const target=action.indexOf("await loadEligibleMembership(tx,input.membershipId,scope.collegeId,input.role)");
  const insert=action.indexOf("tx.insert(projectMembers)");
  expect(tx).toBeGreaterThan(0);
  expect(actor).toBeGreaterThan(tx);
  expect(target).toBeGreaterThan(actor);
  expect(insert).toBeGreaterThan(target);
  expect(action.slice(0,tx)).not.toContain("loadEligibleMembership(");
 });

 it("does not implicitly grant a removed mentor permission through retained membership rows",()=>{
  const access=readFileSync("src/modules/projects/access.ts","utf8");
  expect(access).toContain("isNull(projectMembers.endedAt)");
  expect(access).toContain('eq(collegeMemberships.status,"ACTIVE")');
  expect(access).toContain('eq(users.platformStatus,"ACTIVE")');
  expect(access).toContain("membership.roles.includes(");
 });
});
