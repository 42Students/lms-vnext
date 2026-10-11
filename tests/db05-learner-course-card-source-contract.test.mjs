import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
const read = p => readFileSync(new URL(p, import.meta.url), "utf8");
const contract = JSON.parse(read("../docs/planning/db05-learner-course-card-source-contract.json"));
const learner = read("../src/modules/courses/learner-course-service.ts");
const identity = read("../scripts/sql/db05-course-identity.draft.sql");
const metadata = read("../scripts/sql/db05-course-metadata-extension.draft.sql");
const visibility = read("../scripts/sql/db05-course-parent-facets.draft.sql");

test("legacy explicit zero visibility must not be conflated with active status", () => {
  assert.equal(contract.status, "SOURCE_CONTRACT_NOT_RUNTIME_VERIFIED");
  const policy = contract.coreRules.find(x => x.id === "COURSE_CARD_HIDDEN_ON_EXPLICIT_ZERO");
  assert.ok(policy);
  assert.match(policy.legacy, /Integer\.valueOf\(0\)\.equals\(course\.getAllowedForDisplay\(\)\)/);
  assert.match(policy.legacy, /Null\/nonzero not filtered/);
  assert.match(visibility, /ADD COLUMN IF NOT EXISTS allowed_for_display integer/);
  assert.ok(!policy.verified);
});

test("card code override is metadata courseCode then shortTitle, not courses.code", () => {
  const precedence = contract.coreRules.find(x => x.id === "COURSE_CARD_CODE_PRECEDENCE");
  assert.ok(precedence);
  assert.match(precedence.legacy, /metadata\.courseCode/);
  assert.match(precedence.legacy, /fallback shortTitle/);
  assert.match(learner, /courseCode:\s*courses\.code/);
  assert.match(identity, /short_title varchar\(255\)/);
  assert.match(metadata, /course_code text/);
  assert.equal(contract.formalVerified, false);
});

test("student-card privacy remains gated pending complete source consumer acceptance", () => {
  assert.ok(contract.coreRules.some(x => x.id === "COURSE_CARD_HTML_PRIVACY"));
  assert.equal(contract.postgreSQL, "NOT_RUN");
  assert.equal(contract.api, "NOT_RUN");
  assert.equal(contract.frontend, "NOT_RUN");
  assert.ok(contract.acceptance.some(x => /Cross-tenant/.test(x)));
});
