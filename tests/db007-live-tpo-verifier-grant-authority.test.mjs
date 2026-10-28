import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const source = readFileSync(new URL(
  "../src/modules/profile-verification/tpo-grants-service.ts", import.meta.url,
), "utf8");
const writer = source.slice(source.indexOf("export async function setTpoProfileVerificationAdminGrant("));

test("DB-007 grant writer checks current actor identity and grant under the college lock", () => {
  const college = writer.indexOf('const [college]=await tx.select');
  const user = writer.indexOf('const [actingUser]=await tx.select');
  const superRole = writer.indexOf('const [liveSuperRole]=await tx.select');
  const adminRole = writer.indexOf('const [liveCollegeAdmin]=await tx.select');
  const target = writer.indexOf('const [target]=await tx.select');
  assert.ok(college >= 0 && college < user && user < superRole && superRole < target);
  assert.ok(user < adminRole && adminRole < target);
  assert.match(writer.slice(user, superRole), /eq\(users\.platformStatus,"ACTIVE"\)/);
  assert.match(writer.slice(user, superRole), /\.for\("share"\)/);
  assert.match(writer.slice(superRole, adminRole), /eq\(systemRoles\.role,"SUPER_ADMIN"\)/);
  assert.match(writer.slice(superRole, adminRole), /\.for\("share"\)/);
  assert.match(writer.slice(adminRole, target), /eq\(membershipRoles\.role,"COLLEGE_ADMIN"\)/);
  assert.match(writer.slice(adminRole, target), /eq\(collegeMemberships\.status,"ACTIVE"\)/);
  assert.match(writer.slice(adminRole, target), /\.for\("share"\)/);
});
test("DB-007 TPO role is locked before grant activation", () => {
  const role = writer.slice(writer.indexOf("const [tpoRole]="), writer.indexOf("if(enabled&&"));
  assert.match(role, /eq\(membershipRoles\.role,"TPO"\)/);
  assert.match(role, /\.for\("share"\)/);
  assert.match(writer, /if\(enabled&&\(target\.status!=="ACTIVE"\|\|target\.platformStatus!=="ACTIVE"\|\|!tpoRole\)\)/);
});
