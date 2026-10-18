import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";
import {can,type PlatformPermission} from "@/modules/permissions/policy";
import type {RequestContext} from "@/modules/identity/context";
const collegeId="11111111-1111-4111-8111-111111111111";
const organizationId="22222222-2222-4222-8222-222222222222";
const active:RequestContext={
 user:{id:"33333333-3333-4333-8333-333333333333",identityUid:"tpo",
  platformStatus:"ACTIVE",systemRoles:[]},
 membership:{id:"44444444-4444-4444-8444-444444444444",
  collegeId,organizationId,status:"ACTIVE",roles:["TPO"]},
};
describe("TPO-settings-audit-COMM-READ-10 private college settings",()=>{
 it("cannot authorize an inactive or off-college actor to read placement settings",()=>{
  const permission:PlatformPermission="placements.manage";
  expect(can(active,permission,{collegeId,organizationId})).toBe(true);
  expect(can({...active,user:{...active.user,platformStatus:"DISABLED"}},
   permission,{collegeId,organizationId})).toBe(false);
  expect(can({...active,membership:{...active.membership!,roles:["LEARNER"]}},
   permission,{collegeId,organizationId})).toBe(false);
  expect(can(active,permission,{collegeId:organizationId,organizationId})).toBe(false);
 });
 it("locks persisted active role before reading signature, SMS cap and student email choices",()=>{
  const source=readFileSync("src/modules/placements/tpo-communication-settings-service.ts","utf8");
  const read=source.slice(source.indexOf("export async function getTpoCommunicationSettings("),
   source.indexOf("export async function updateTpoCommunicationSettings("));
  const firstGate=read.indexOf("await requireTpoBatchActor(context)");
  const transaction=read.indexOf("getDb().transaction(async tx=>");
  const college=read.indexOf("eq(colleges.id,collegeId)",transaction);
  const activeCollege=read.indexOf('college.status!=="ACTIVE"',college);
  const persisted=read.indexOf('assertPersistedPlatformPermission(tx,context,"placements.manage"',activeCollege);
  const settings=read.indexOf("await tx.select({smsMonthlyCap:",persisted);
  const result=read.indexOf("return {ready:true as const",settings);
  expect(firstGate).toBeGreaterThan(0);
  expect(transaction).toBeGreaterThan(firstGate);
  expect(college).toBeGreaterThan(transaction);
  expect(activeCollege).toBeGreaterThan(college);
  expect(read.slice(college,persisted)).toContain('.for("share").limit(1)');
  expect(persisted).toBeGreaterThan(activeCollege);
  expect(settings).toBeGreaterThan(persisted);
  expect(result).toBeGreaterThan(settings);
  expect(read.slice(persisted,settings)).toContain("collegeId,organizationId:college.organizationId");
  expect(read).not.toContain("await getDb().select({smsMonthlyCap:");
  expect(read).toContain("private college delivery settings");
 });
});
