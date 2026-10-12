import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (p) => readFileSync(new URL(p, import.meta.url), "utf8");
const source = read("../src/modules/courses/teaching-assignment-service.ts");
const start = source.indexOf("export async function endCourseTeachingAssignment(");
assert.ok(start >= 0);
const body = source.slice(start);

test("DB05 end faculty assignment locks row before mutating, within one transaction", () => {
  assert.match(body, /return getDb\(\)\.transaction\(async \(tx\) => \{/);
  assert.match(body, /const \[lockedAssignment\] = await tx[\s\S]*?\.for\("update"\)/);
  assert.match(body, /const \[updated\] = await tx\s*\.update\(courseTeachingAssignments\)/);
  assert.ok(body.indexOf('.for("update")') < body.indexOf(".update(courseTeachingAssignments)"));
});

test("DB05 assignment ending rejects parent or assigned faculty rescope after permission check", () => {
  assert.match(body, /eq\(courseTeachingAssignments\.deliveryId, current\.deliveryId\)/);
  assert.match(body, /eq\(courseTeachingAssignments\.membershipId, current\.membershipId\)/);
  assert.match(body, /isNull\(courseTeachingAssignments\.endedAt\)/);
  assert.match(body, /TEACHING_ASSIGNMENT_NOT_FOUND/);
});

test("DB05 assignment ending rechecks college and organization with SHARE-locked ancestry", () => {
  for (const name of ["courseSectionDeliveries", "courseOfferings", "courses", "departments", "colleges", "organizations"]) {
    assert.match(body, new RegExp("\\b" + name + "\\b"), name);
  }
  assert.match(body, /eq\(colleges\.status, "ACTIVE"\)/);
  assert.match(body, /eq\(organizations\.status, "ACTIVE"\)/);
  assert.match(body, /\.for\("share"\)/);
  assert.match(body, /liveScope\.collegeId !== current\.collegeId/);
  assert.match(body, /liveScope\.organizationId !== current\.organizationId/);
  const lock = body.indexOf('.for("update")');
  const scope = body.indexOf('.for("share")');
  const update = body.indexOf(".update(courseTeachingAssignments)");
  assert.ok(lock < scope && scope < update);
});

test("DB05 assignment ending keeps original permission check and no role escalation", () => {
  assert.match(body, /await loadCourseTeachingAssignmentScope/);
  assert.match(body, /requirePermission\(context, "courses\.manage"/);
  assert.doesNotMatch(body, /\.insert\(membershipRoles\)|\.update\(membershipRoles\)/);
});
