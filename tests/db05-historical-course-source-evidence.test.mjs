import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const load = (name) => JSON.parse(readFileSync(resolve(root, name), "utf8"));
const bounded = load("docs/planning/db05-historical-course-columns-source-evidence.json");
const review = load("docs/planning/db05-chat06-source-semantic-review.json");
const inventory = load("docs/planning/db-pass4-columns-db05_courses_and_content.json");
const decisions = load("docs/planning/db05-unresolved-semantic-decisions.json");

const columns = ["course.default_subscription_days", "course.formal_title"];

test("DB05 historical-only course column evidence must remain bounded and exact", () => {
  assert.equal(bounded.status, "BOUNDED_NEGATIVE_SOURCE_EVIDENCE_NOT_EXHAUSTIVE_CODEBASE_SEARCH");
  assert.equal(bounded.inspectedRelevantCurrentLegacyFiles.length, 13);
  assert.equal(new Set(bounded.inspectedRelevantCurrentLegacyFiles.map(x => x.path)).size, 13);
  assert.ok(bounded.inspectedRelevantCurrentLegacyFiles.every(x =>
    x.formalTitleHits === 0 && x.defaultSubscriptionDaysHits === 0 &&
    /^[0-9a-f]{40}$/.test(x.blobSha)
  ));
  assert.ok(bounded.snapshotSource.snippets.some(s => s.includes("default_subscription_days")));
  assert.ok(bounded.snapshotSource.snippets.some(s => s.includes("formal_title")));
});

test("DB05 never confuses no hits in bounded current Java review with globally retired source columns", () => {
  assert.equal(bounded.unmappedHistoricalColumns.length, 2);
  for (const id of columns) {
    const source = review.fields.find(f => f.source === id);
    assert.equal(source.classification, "MISSING_OR_UNPROVEN");
    assert.equal(source.semanticVerification, "NOT_VERIFIED");
    assert.match(source.sourceContractStatus, /BOUNDED_13_CURRENT_COURSE_SURFACE_REVIEW/);
    const decision = decisions.items.find(f => f.source === id);
    assert.equal(decision.disposition, "OPEN");
    const [table, col] = id.split(".");
    const canonical = inventory.tables.find(t => t.table === table).rows.find(x => x.legacyColumn === col);
    assert.equal(canonical.verifiedMapping, null);
  }
  assert.ok(bounded.unmappedHistoricalColumns.every(x =>
    x.retirementApproved === false && x.runtimeConsumerVerified === false
  ));
});

test("DB05 source-backed progress deletion draft does not consume the two historical-only unknowns", () => {
  const row = review.fields.find(f => f.source === "learner_content_progress.is_deleted");
  assert.equal(row.classification, "UNREGISTERED_DRAFT");
  assert.equal(row.runtimeDatabaseVerification, "NOT_RUN");
  assert.deepEqual(
    review.fields.filter(f => f.classification === "MISSING_OR_UNPROVEN").map(f => f.source).sort(),
    columns.sort()
  );
});
