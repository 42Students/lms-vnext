import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
const settings = readFileSync(new URL(
  "../src/modules/profile-verification/settings-service.ts", import.meta.url,
), "utf8");
const cgpa = settings.slice(
  settings.indexOf("export async function setCollegeCgpaConversionRule("),
  settings.indexOf("export async function readTpoProfileVerificationEnabled("),
);
test("DB-007 conversion-rule mutations revalidate live TPO or admin ownership", () => {
  const college = cgpa.indexOf('const [college]=await tx.select');
  const actor = cgpa.indexOf('const [actorUser]=await tx.select');
  const system = cgpa.indexOf('const [role]=await tx.select');
  const membership = cgpa.indexOf('const [activeGrant]=await tx.select');
  const mutation = cgpa.indexOf('await tx.insert(profileVerificationSettings)');
  assert.ok([college,actor,system,membership,mutation].every(n => n >= 0));
  assert.ok(college < actor && actor < system && system < mutation);
  assert.ok(actor < membership && membership < mutation);
  assert.match(cgpa, /eq\(users\.platformStatus,"ACTIVE"\)/);
  assert.match(cgpa, /eq\(systemRoles\.role,"SUPER_ADMIN"\)/);
  assert.match(cgpa, /inArray\(membershipRoles\.role,\["TPO","COLLEGE_ADMIN"\]\)/);
  assert.match(cgpa, /eq\(collegeMemberships\.status,"ACTIVE"\)/);
  assert.match(cgpa.slice(actor, mutation), /\.for\("share"\)/);
  assert.match(cgpa, /if\(!activeGrant\)throw new AuthorizationError\("placements.manage"\)/);
});
