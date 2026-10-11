import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = path => readFileSync(new URL(path, import.meta.url), "utf8");
const draft = read("../scripts/sql/db05-lesson-content-authoring-facets.draft.sql");
const review = JSON.parse(read("../docs/planning/db05-chat06-source-semantic-review.json"));
const canonical = JSON.parse(read("../docs/planning/db-pass4-columns-db05_courses_and_content.json"));
const rows = canonical.tables.find(t => t.table === "lesson_contents").rows;

test("lesson content authoring keeps active and enabled independent of publication status", () => {
  assert.match(draft, /UNREGISTERED DB05 COMPANION/);
  assert.match(draft, /legacy_active boolean/);
  assert.match(draft, /legacy_enabled boolean/);
  assert.match(draft, /INDEPENDENT booleans/);
  assert.match(draft, /new content true/);
  assert.match(draft, /update preserves old if input omitted/);
  assert.doesNotMatch(draft, /ALTER COLUMN status|DROP COLUMN status/i);
});

test("lesson content persisted points are bigint with negative protection, not assignment maxPoints", () => {
  assert.match(draft, /legacy_points bigint/);
  assert.match(draft, /legacy_points IS NULL OR legacy_points >= 0/);
  assert.match(draft, /course_assignments\.max_points is NOT synonymous/);
  assert.match(draft, /negative input coerced to 0/);
  assert.ok(rows.find(r => r.legacyColumn === "points"));
});

test("lesson deadline preserves timezone-naive LocalDateTime and explicit-clear update", () => {
  assert.match(draft, /legacy_deadline_local timestamp without time zone/);
  assert.match(draft, /incoming null means preserve existing/);
  assert.match(draft, /explicit clearDeadline=true clears/);
  assert.match(draft, /course_assignments\.due_at is TIMESTAMPTZ/);
  assert.ok(rows.find(r => r.legacyColumn === "deadline"));
});

test("no shadow authoring proposal is counted as semantically database verified", () => {
  for (const key of ["active", "enabled", "points", "deadline"]) {
    const row = review.fields.find(f => f.source === "lesson_contents." + key);
    assert.ok(row, key);
    assert.equal(row.semanticVerification, "NOT_VERIFIED", key);
    assert.equal(row.runtimeDatabaseVerification, "NOT_RUN", key);
    const canonicalRow = rows.find(r => r.legacyColumn === key);
    assert.equal(canonicalRow.verifiedMapping, null, key);
    assert.match(canonicalRow.proposedSemanticMapping, /db05-lesson-content-authoring-facets\.draft\.sql/, key);
  }
});
