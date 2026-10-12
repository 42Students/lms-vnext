import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync(
  new URL("../src/modules/academics/enrollment-service.ts", import.meta.url),
  "utf8",
);
const start = source.indexOf("export async function createLearnerProgramEnrollment(");
const end = source.indexOf("export async function transitionLearnerProgramEnrollment(", start);
const create = source.slice(start, end);

test("DB005 enrollment retains a live locked college membership decision", () => {
  assert.ok(start >= 0 && end > start);
  assert.match(create, /\.from\(collegeMemberships\)[\s\S]*?\.where\(eq\(collegeMemberships\.id, input\.membershipId\)\)[\s\S]*?\.for\("share"\)/);
  assert.match(create, /liveMembership\.status !== "ACTIVE"/);
  assert.match(create, /liveMembership\.collegeId !== program\.collegeId/);
  assert.match(create, /MEMBERSHIP_NOT_ACTIVE/);
  assert.match(create, /ENROLLMENT_COLLEGE_MISMATCH/);
});

test("DB005 enrollment locks canonical LEARNER grant after membership parent", () => {
  assert.match(create, /\.from\(membershipRoles\)[\s\S]*?eq\(membershipRoles\.membershipId, input\.membershipId\)/);
  assert.match(create, /eq\(membershipRoles\.role, "LEARNER"\)/);
  assert.match(create, /\.for\("share"\)[\s\S]*?if \(!liveLearnerRole\)/);
  assert.match(create, /LEARNER_ROLE_REQUIRED/);
  const parentLock = create.indexOf("const [liveMembership]");
  const roleLock = create.indexOf("const [liveLearnerRole]");
  const cohortLock = create.indexOf("const [liveCohort]");
  const insertion = create.indexOf(".insert(learnerProgramEnrollments)");
  assert.ok(parentLock > 0 && roleLock > parentLock && cohortLock > roleLock && insertion > cohortLock,
    "parent membership and LEARNER grant must be locked before cohort/enrollment insert");
});

test("DB005 keeps a real disposable PostgreSQL race witness, not an assertion-only proof", () => {
  const integration = readFileSync(
    new URL("./integration/db005-enrollment-membership-revocation-race.test.ts", import.meta.url),
    "utf8",
  );
  assert.match(integration, /DB03_ISOLATED_TEST_DATABASE/);
  assert.match(integration, /testUrl !== process\.env\.DATABASE_URL/);
  assert.match(integration, /for update/);
  assert.match(integration, /MEMBERSHIP_NOT_ACTIVE/);
  assert.match(integration, /LEARNER_ROLE_REQUIRED/);
  assert.match(integration, /enrollmentCount\(f\.membershipId\)/);
});
