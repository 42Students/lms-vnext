import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const application = fs.readFileSync(
  "src/modules/placements/application-service.ts",
  "utf8",
);
const eligibility = fs.readFileSync(
  "src/modules/placements/eligibility-service.ts",
  "utf8",
);
const race = fs.readFileSync(
  "tests/integration/db18-placement-race-gap.test.ts",
  "utf8",
);

function between(source, start, end) {
  const a = source.indexOf(start);
  assert.ok(a >= 0, "missing start marker: " + start);
  const b = end ? source.indexOf(end, a + start.length) : -1;
  return source.slice(a, b >= 0 ? b : undefined);
}

test("DB54 application transaction revalidates the gate after ordering locks", () => {
  const apply = between(
    application,
    "export async function applyToPlacementJob",
    "\nexport async function ",
  );
  const tx = apply.indexOf("const created = await getDb().transaction");
  assert.ok(tx > 0);
  const body = apply.slice(tx);

  const lock = body.indexOf("await lockLearnerApplicationGateInputs(");
  const live = body.indexOf("const liveEligibility = await evaluatePlacementEligibility(");
  const insert = body.indexOf(".insert(placementApplications)");
  assert.ok(lock >= 0 && live > lock && insert > live);

  assert.match(body, /eligibilityStatus:\s*liveEligibility\.status/);
  assert.match(body, /eligibilitySnapshot:\s*liveEligibility/);
  assert.doesNotMatch(body, /eligibilityStatus:\s*eligibility\.status/);
  assert.doesNotMatch(body, /eligibilitySnapshot:\s*eligibility[,\n]/);
});

test("DB54 gate freezes every current restrictive placement input", () => {
  const helper = between(
    application,
    "async function lockLearnerApplicationGateInputs",
    "\nasync function resolveApplicationRoleOption",
  );
  for (const required of [
    "collegeMemberships",
    "membershipRoles",
    "learnerProgramEnrollments",
    "cohorts",
    "programs",
    "departments",
    "sectionEnrollments",
    "sections",
    "moduleAccessRules",
    "placementEligibilityDecisions",
    "placementEligibilityOverrides",
    "placementJobEligibilityPolicies",
    "placementCandidateAcademicEvidence",
  ]) {
    assert.ok(helper.includes(required), "missing gate input " + required);
  }
  assert.ok((helper.match(/\.for\("share"\)/g) ?? []).length >= 10);
  assert.match(helper, /moduleAccessRules\.module, "placements"/);
  assert.match(helper, /placementEligibilityOverrides\.revokedAt/);
});

test("DB54 job-specific eligibility writers serialize on placement_jobs", () => {
  assert.match(eligibility, /async function lockEligibilityJob[\s\S]*?\.for\("update"\)/);
  for (const fn of [
    "upsertJobEligibilityPolicy",
    "setEligibilityOverride",
    "revokeEligibilityOverride",
  ]) {
    const block = between(
      eligibility,
      "export async function " + fn,
      "\nexport async function ",
    );
    assert.match(block, /db\.transaction\(async \(tx\)/, fn);
    assert.match(block, /lockEligibilityJob\(tx, jobId\)/, fn);
  }
});

test("DB54 evidence writers serialize on learner membership", () => {
  assert.match(eligibility, /async function lockEvidenceMembership[\s\S]*?\.for\("update"\)/);
  for (const fn of [
    "upsertOwnAcademicEvidence",
    "upsertVerifiedAcademicEvidence",
  ]) {
    const block = between(
      eligibility,
      "export async function " + fn,
      "\nexport async function ",
    );
    assert.match(block, /db\.transaction\(async \(tx\)/, fn);
    assert.match(block, /lockEvidenceMembership\(tx,/, fn);
  }
});

test("DB54 deterministic P5-R01 witness still requires rejection and zero persistence", () => {
  assert.match(race, /P5-R01 rejects placement application if paid access is revoked after precheck/);
  assert.match(race, /select id from module_access_rules where id = \$1 for update/);
  assert.match(race, /select id from college_memberships where id = \$1 for update/);
  assert.match(race, /update module_access_rules set enabled = false/);
  assert.match(race, /expect\(outcome\.kind\)\.toBe\("rejected"\)/);
  assert.match(race, /expect\(persisted\.rows\[0\]\?\.count\)\.toBe\("0"\)/);
});
