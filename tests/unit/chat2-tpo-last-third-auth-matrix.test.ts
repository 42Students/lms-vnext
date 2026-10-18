import {describe,expect,it} from "vitest";
import type {RequestContext} from "@/modules/identity/context";
import {canOpenTpoWorkspace,hasTpoTooling} from "@/modules/placements/tpo-workspace-access-model";
import {can} from "@/modules/permissions/policy";

const actor=(role:"TPO"|"COLLEGE_ADMIN"|"LEARNER"|"FACULTY",opts:{
 platform?:"ACTIVE"|"DISABLED";membership?:"ACTIVE"|"SUSPENDED";collegeId?:string;organizationId?:string;
}={}):RequestContext=>({
 user:{id:"staff-a",identityUid:"identity-a",platformStatus:opts.platform??"ACTIVE",systemRoles:[]},
 membership:{id:"membership-a",collegeId:opts.collegeId??"college-a",
  organizationId:opts.organizationId??"org-a",status:opts.membership??"ACTIVE",roles:[role]},
});

describe("UX-tpo-LAST-THIRD-01 TPO route boundary permission matrix",()=>{
 it("UX-tpo-LAST-THIRD-01 admits active TPO and college-admin placements managers, but only TPO has personal tooling",()=>{
  expect(canOpenTpoWorkspace(actor("TPO"))).toBe(true);
  expect(hasTpoTooling(actor("TPO"))).toBe(true);
  expect(canOpenTpoWorkspace(actor("COLLEGE_ADMIN"))).toBe(true);
  expect(hasTpoTooling(actor("COLLEGE_ADMIN"))).toBe(false);
  for(const role of ["LEARNER","FACULTY"] as const){
   expect(canOpenTpoWorkspace(actor(role))).toBe(false);
   expect(hasTpoTooling(actor(role))).toBe(false);
  }
 });
 it("UX-tpo-LAST-THIRD-01 rejects expired/disabled/missing identity before any private page renders",()=>{
  expect(canOpenTpoWorkspace(null)).toBe(false);
  expect(canOpenTpoWorkspace(undefined)).toBe(false);
  expect(canOpenTpoWorkspace({...actor("TPO"),membership:null})).toBe(false);
  expect(canOpenTpoWorkspace(actor("TPO",{platform:"DISABLED"}))).toBe(false);
  expect(canOpenTpoWorkspace(actor("TPO",{membership:"SUSPENDED"}))).toBe(false);
  expect(hasTpoTooling(actor("TPO",{platform:"DISABLED"}))).toBe(false);
 });
 it("UX-tpo-LAST-THIRD-01 authorizes the current membership pair, not forged college identifiers",()=>{
  const member=actor("TPO");
  expect(can(member,"placements.manage",{collegeId:"college-a",organizationId:"org-a"})).toBe(true);
  for(const resource of [
   {collegeId:"college-b",organizationId:"org-a"},
   {collegeId:"college-a",organizationId:"org-b"},
   {collegeId:"college-b",organizationId:"org-b"},
  ])expect(can(member,"placements.manage",resource)).toBe(false);
  const admin:RequestContext={...member,user:{...member.user,systemRoles:["SUPER_ADMIN"]},
   adminScope:{collegeId:"college-b",organizationId:"org-b"}};
  expect(canOpenTpoWorkspace(admin)).toBe(false);
 });
});
