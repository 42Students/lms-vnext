import {describe, expect, it} from "vitest";
import {readFileSync} from "node:fs";
import type {RequestContext} from "@/modules/identity/context";
import {can} from "@/modules/permissions/policy";
import {
 isCollegeAtGlanceCounts, displayedGlanceNumber,
 COLLEGE_GLANCE_REFRESH_ERROR, COLLEGE_GLANCE_LOAD_ERROR,
} from "@/modules/colleges/admin-college-at-glance-model";

const collegeA="11111111-1111-4111-8111-111111111111";
const collegeB="22222222-2222-4222-8222-222222222222";
const orgA="aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const orgB="bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const root:RequestContext={
 user:{id:"admin",identityUid:"admin",platformStatus:"ACTIVE",systemRoles:["SUPER_ADMIN"]},
 membership:null,adminScope:{collegeId:collegeA,organizationId:orgA},
};
describe("Super Admin college summary tenant, lifecycle and safe counts",()=>{
 it("SA-colleges-at-glance-01 counts only CURRENT active users and roles from the scoped college",()=>{
  const s=readFileSync("src/modules/colleges/admin-college-at-glance-service.ts","utf8");
  expect(s).toContain('eq(colleges.status,"ACTIVE")');
  expect(s).toContain('eq(collegeMemberships.collegeId,collegeId)');
  expect(s).toContain('eq(collegeMemberships.status,"ACTIVE")');
  expect(s).toContain('eq(users.platformStatus,"ACTIVE")');
  expect(s).toContain('eq(membershipRoles.role,role)');
  expect(s).toContain("countDistinct(collegeMemberships.id)");
  expect(s).toContain('eq(departments.collegeId,collegeId)');
  expect(s).toContain('eq(placementJobs.collegeId,collegeId)');
 });
 it("SA-colleges-at-glance-02 disables stale Super Admin sessions within the same persisted read transaction",()=>{
  const s=readFileSync("src/modules/colleges/admin-college-at-glance-service.ts","utf8");
  const tx=s.indexOf("getDb().transaction(async tx=>");
  const guard=s.indexOf('assertPersistedPlatformPermission(tx,ctx,"college.read"');
  const counts=s.indexOf("const byRole=",guard);
  const queries=s.indexOf("Promise.all([",counts);
  expect(tx).toBeGreaterThan(-1);
  expect(guard).toBeGreaterThan(tx);
  expect(counts).toBeGreaterThan(guard);
  expect(queries).toBeGreaterThan(counts);
  expect(can(root,"college.read",{collegeId:collegeA,organizationId:orgA})).toBe(true);
  expect(can(root,"college.read",{collegeId:collegeB,organizationId:orgA})).toBe(false);
  expect(can(root,"college.read",{collegeId:collegeA,organizationId:orgB})).toBe(false);
  expect(can({...root,user:{...root.user,platformStatus:"DISABLED"}},"college.read",{collegeId:collegeA,organizationId:orgA})).toBe(false);
 });
 it("SA-colleges-at-glance-03 finite nonnegative counts only and clear unavailable-state copy",()=>{
  expect(isCollegeAtGlanceCounts({students:0,faculty:0,courses:0,activeDrives:0})).toBe(true);
  for(const input of [
   null,{}, {students:-1,faculty:0,courses:0,activeDrives:0},
   {students:1.5,faculty:0,courses:0,activeDrives:0},
   {students:Infinity,faculty:0,courses:0,activeDrives:0},
   {students:0,faculty:0,courses:0,activeDrives:"0"},
  ])expect(isCollegeAtGlanceCounts(input)).toBe(false);
  expect(displayedGlanceNumber(null)).toBe("—");
  expect(displayedGlanceNumber(0)).toBe("0");
  expect(COLLEGE_GLANCE_REFRESH_ERROR).toBe("Summary refresh failed");
  expect(COLLEGE_GLANCE_LOAD_ERROR).toBe("Couldn't load college summary");
 });
});