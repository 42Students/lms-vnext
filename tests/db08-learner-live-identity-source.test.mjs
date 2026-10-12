import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(path, "utf8");
const access = read("src/modules/placements/learner-participation-guard.ts");
const applications = read("src/modules/placements/application-service.ts");
const registration = read("src/modules/placements/batch-registration-service.ts");

const applicationGate = applications.slice(
  applications.indexOf("async function lockLearnerApplicationGateInputs("),
  applications.indexOf("async function resolveApplicationRoleOption("),
);
const withdrawal = applications.slice(
  applications.indexOf("export async function withdrawPlacementApplication("),
);
const registrationIdentity = registration.slice(
  registration.indexOf("const [learner] ="),
  registration.indexOf("const enrollments ="),
);

test("learner placement reads use the persisted account status, not only stale RequestContext", () => {
  assert.match(access, /platformStatus:\s*users\.platformStatus/);
  assert.match(access, /\.innerJoin\(users,\s*eq\(users\.id,\s*collegeMemberships\.userId\)\)/);
  assert.match(access, /authorized\.platformStatus\s*!==\s*"ACTIVE"/);
  assert.match(access, /authorized\.userId\s*!==\s*context\.user\.id/);
  assert.match(access, /authorized\.collegeId\s*!==\s*membership\.collegeId/);
});

test("application creation holds a FOR SHARE user lock and rejects disabled accounts", () => {
  assert.match(applicationGate, /\.from\(users\)[\s\S]*?\.for\("share"\)/);
  assert.match(applicationGate, /account\.platformStatus\s*!==\s*"ACTIVE"/);
  assert.ok(applicationGate.indexOf('account.platformStatus !== "ACTIVE"') <
    applicationGate.indexOf("placementEligibilityDecisions"));
});

test("application withdrawal rechecks persisted membership, user and learner role before mutation", () => {
  assert.match(withdrawal, /\.from\(collegeMemberships\)[\s\S]*?\.for\("share"\)/);
  assert.match(withdrawal, /\.from\(users\)[\s\S]*?\.for\("share"\)/);
  assert.match(withdrawal, /\.from\(membershipRoles\)[\s\S]*?\.for\("share"\)/);
  for (const check of [
    'liveMembership.status !== "ACTIVE"',
    'liveUser.platformStatus !== "ACTIVE"',
    'if (!liveRole)',
  ]) {
    assert.ok(withdrawal.includes(check), "missing withdrawal check " + check);
    assert.ok(withdrawal.indexOf(check) < withdrawal.indexOf(".update(placementApplications)"),
      "withdrawal check must precede application mutation: " + check);
  }
});

test("registration validates and locks joined persisted account, membership and role", () => {
  assert.match(registrationIdentity, /\.innerJoin\(users,\s*eq\(users\.id,\s*collegeMemberships\.userId\)\)/);
  assert.match(registrationIdentity, /\.innerJoin\(membershipRoles,[\s\S]*?\.for\("share"\)/);
  assert.match(registrationIdentity, /learner\.platformStatus\s*!==\s*"ACTIVE"/);
  assert.match(registrationIdentity, /learner\.userId\s*!==\s*context\.user\.id/);
  assert.match(registrationIdentity, /learner\.collegeId\s*!==\s*membership\.collegeId/);
});

test("runtime tests cover both denied and legitimately active learner paths", () => {
  const unit = read("tests/unit/placement-persisted-learner-access.test.ts");
  assert.match(unit, /denies an account disabled after request-context authentication/);
  assert.match(unit, /preserves eligible active learners/);
  assert.match(unit, /denies a persisted membership suspended/);
  const pg = read("tests/integration/placements-db08-registration.test.ts");
  assert.match(pg, /persisted learner account was disabled/);
  assert.match(pg, /persisted membership is suspended/);
  assert.match(pg, /registrations\.rows\)\.toHaveLength\(0\)/);
});
