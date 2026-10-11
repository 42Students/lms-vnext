import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const load = (path) => JSON.parse(readFileSync(resolve(root, path), "utf8"));

const matrix = load("docs/planning/db05-original-11-gaps-closure-matrix.json");
const review = load("docs/planning/db05-chat06-source-semantic-review.json");
const manifest = load("docs/planning/db05-migration-readiness-manifest.json");
const expectedSources = [
  "classroom_messages.is_deleted",
  "classroom_messages.sender_name",
  "course.allowed_for_display",
  "course.created_by_org_id",
  "course.default_subscription_days",
  "course.formal_title",
  "course.parent_course_id",
  "learner_content_progress.is_deleted",
  "lesson_contents.course_name",
  "lesson_contents.points",
  "lesson_contents.deadline",
];

test("original 11 legacy source gaps remain complete and nonduplicated", () => {
  assert.equal(matrix.phase, "DATABASE");
  assert.equal(matrix.fields.length, 11);
  assert.deepEqual(matrix.fields.map((f) => f.source).sort(), expectedSources.sort());
  assert.equal(new Set(matrix.fields.map((f) => f.source)).size, 11);
  assert.equal(matrix.counts.originalMissingListLength, 11);
});

test("the old missing list is reconciled to latest DB05 source ledger without false closure", () => {
  const observed = {};
  for (const item of matrix.fields) {
    const row = review.fields.find((field) => field.source === item.source);
    assert.ok(row, item.source);
    assert.equal(item.sourceClassification, row.classification, item.source);
    assert.equal(row.semanticVerification, "NOT_VERIFIED", item.source);
    assert.equal(row.runtimeDatabaseVerification, "NOT_RUN", item.source);
    assert.equal(item.semanticVerified, false, item.source);
    assert.equal(item.postgresVerified, false, item.source);
    assert.equal(item.migrationRegistered, false, item.source);
    assert.equal(item.decisionStatus, "OPEN", item.source);
    observed[item.sourceClassification] = (observed[item.sourceClassification] || 0) + 1;
  }
  assert.deepEqual(observed, matrix.counts.currentDisposition);
  assert.equal(matrix.counts.semanticVerified, 0);
  assert.equal(matrix.counts.postgresVerified, 0);
});

test("all candidate SQL and acceptance gates are real repository paths/IDs", () => {
  const gateIds = new Set(manifest.gates.map((gate) => gate.id));
  for (const item of matrix.fields) {
    if (item.candidateDraft) {
      assert.match(item.candidateDraft, /^scripts\/sql\/[\w.-]+\.draft\.sql$/);
      assert.ok(existsSync(resolve(root, item.candidateDraft)), item.candidateDraft);
    }
    if (item.criticalAcceptanceGate) {
      assert.ok(gateIds.has(item.criticalAcceptanceGate), item.criticalAcceptanceGate);
      assert.notEqual(
        manifest.gates.find((gate) => gate.id === item.criticalAcceptanceGate).status,
        "PASS",
        item.criticalAcceptanceGate,
      );
    }
  }
});

test("all 11 rows document concrete consumer-level acceptance scenarios for later execution", () => {
  const scenarios = matrix.fields.flatMap((item) =>
    item.mandatoryAcceptanceScenarios.map((scenario) => item.source + ":" + scenario),
  );
  assert.ok(scenarios.length >= 40);
  assert.equal(scenarios.length, new Set(scenarios).size);
  assert.ok(matrix.fields.every((item) => item.mandatoryAcceptanceScenarios.length >= 4));
  assert.ok(matrix.fields.every((item) => item.actionableNextStep.length >= 60));
});

test("the historical-only pair remains explicit rather than silently retired", () => {
  for (const name of ["course.default_subscription_days", "course.formal_title"]) {
    const item = matrix.fields.find((field) => field.source === name);
    assert.equal(item.sourceClassification, "MISSING_OR_UNPROVEN");
    assert.equal(item.decisionStatus, "OPEN");
    assert.match(item.candidateDraft, /historical-course-columns\.compatibility/);
    assert.ok(item.mandatoryAcceptanceScenarios.includes("explicitRetainOrRetire"));
  }
});
