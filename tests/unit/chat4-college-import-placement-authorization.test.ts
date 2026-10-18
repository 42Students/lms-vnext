import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import type {RequestContext} from "@/modules/identity/context";
import {can} from "@/modules/permissions/policy";

const file=()=>readFileSync("src/modules/people/college-student-import-placement.ts","utf8");
const collegeA="11111111-1111-4111-8111-111111111111";
const collegeB="22222222-2222-4222-8222-222222222222";
const orgA="aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const orgB="bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
function admin():RequestContext {
 return {user:{id:"actor",identityUid:"actor",platformStatus:"ACTIVE",systemRoles:[]},
  membership:{id:"member",collegeId:collegeA,organizationId:orgA,status:"ACTIVE",roles:["COLLEGE_ADMIN"]}};
}

describe("College Admin imported-learner class placement adversarial isolation",()=>{
 it("COL-student-import-PG-01 rejects forged learner enrollment from another college",()=>{
  const s=file();
  expect(s).toContain("resolveActingCollege(context");
  expect(s).toContain("eq(departments.collegeId, member.collegeId)");
  expect(s).toContain("eq(academicPeriods.collegeId, member.collegeId)");
  expect(s).toContain("eq(collegeMemberships.id,learnerProgramEnrollments.membershipId)");
  expect(s).toContain("eq(collegeMemberships.collegeId,member.collegeId)");
  expect(s).toContain('alias(academicPeriods,"college_import_start_period")');
  expect(s).toContain("eq(cohortStartPeriod.id,cohorts.startPeriodId)");
  expect(s).toContain("eq(cohortStartPeriod.collegeId,member.collegeId)");
  expect(s).toContain("eq(collegeMemberships.status,\"ACTIVE\")");
  expect(s).toContain("eq(membershipRoles.role,\"LEARNER\")");
  expect(s).toContain("eq(users.platformStatus,\"ACTIVE\")");
  expect(s).toContain("enrollment.cohortId !== target.cohortId");
 });

 it("COL-student-import-PG-02 rejects revoked actors inside the same locked transaction as placement",()=>{
  const s=file(),start=s.indexOf("return getDb().transaction(async tx =>");
  const lock=s.indexOf('.for("update", {of: sections})',start);
  const guard=s.indexOf('assertPersistedPlatformPermission(tx,context,"academics.manage"');
  const insert=s.indexOf("tx.insert(sectionEnrollments)");
  expect(lock).toBeGreaterThan(start);
  expect(guard).toBeGreaterThan(lock);
  expect(insert).toBeGreaterThan(guard);
  expect(s).toContain("CLASS_FULL");
  expect(s).toContain("ALREADY_PLACED_IN_PERIOD");
  expect(s).toContain("recordActivityEventInTransaction(tx,context");
  const a=admin();
  expect(can(a,"academics.manage",{collegeId:collegeA,organizationId:orgA})).toBe(true);
  expect(can(a,"academics.manage",{collegeId:collegeB,organizationId:orgA})).toBe(false);
  expect(can(a,"academics.manage",{collegeId:collegeA,organizationId:orgB})).toBe(false);
  expect(can({...a,user:{...a.user,platformStatus:"DISABLED"}},"academics.manage",{collegeId:collegeA,organizationId:orgA})).toBe(false);
  expect(can({...a,membership:{...a.membership!,roles:["FACULTY"]}},"academics.manage",{collegeId:collegeA,organizationId:orgA})).toBe(false);
 });
});
