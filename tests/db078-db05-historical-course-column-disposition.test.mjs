import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const decision = JSON.parse(
  readFileSync(
    "docs/planning/db05-chat05-historical-course-column-final-disposition-2026-10-12.json",
    "utf8",
  ),
);

test("DB078 closes both historical physical course-column decisions", () => {
  assert.equal(decision.task, "DB-078");
  assert.equal(decision.decisions.length, 2);
  assert.equal(decision.summary.historicalPhysicalColumnsReviewed, 2);
  assert.equal(decision.summary.retiredPhysicalColumns, 2);
  assert.equal(decision.summary.openPersistenceDecisions, 0);
});

test("DB078 does not invent subscription expiry from default_subscription_days", () => {
  const row = decision.decisions.find(
    (x) => x.sourceField === "course.default_subscription_days",
  );
  assert.ok(row);
  assert.equal(
    row.persistenceDisposition,
    "RETIRED_HISTORICAL_PHYSICAL_COLUMN_NO_CURRENT_PRODUCT_CONSUMER",
  );
  assert.equal(row.vnextPersistenceTarget, null);
  assert.equal(row.currentProductBehaviorRequired, false);
  assert.match(row.futureRule, /explicit typed policy/i);
});

test("DB078 retires only the formal_title column, not the active wire contract", () => {
  const row = decision.decisions.find(
    (x) => x.sourceField === "course.formal_title",
  );
  assert.ok(row);
  assert.equal(
    row.persistenceDisposition,
    "RETIRED_HISTORICAL_PHYSICAL_COLUMN_ACTIVE_WIRE_CONCEPT_DERIVED",
  );
  assert.equal(row.vnextPersistenceTarget, null);
  assert.equal(row.currentProductBehaviorRequired, true);
  assert.equal(row.activeWireContract.responseField, "formal_title");
  assert.equal(
    row.activeWireContract.legacyDerivedExpression,
    "course.shortTitle != null ? course.shortTitle : course.courseName",
  );
  assert.match(row.activeWireContract.vnextPlan, /derived response/i);
});

test("DB078 preserves exact null fallback rather than silently changing blank semantics", () => {
  const row = decision.decisions.find(
    (x) => x.sourceField === "course.formal_title",
  );
  assert.match(row.activeWireContract.exactFallbackRule, /null-based/i);
  assert.match(row.activeWireContract.exactFallbackRule, /not blank-string/i);
});

test("DB078 keeps compatibility-only physical columns out of migration registration", () => {
  assert.equal(
    decision.compatibilityDraftDisposition.decision,
    "DO_NOT_REGISTER_FOR_THESE_TWO_COLUMNS",
  );
  assert.equal(decision.summary.replacementPhysicalColumnsRequired, 0);
  assert.equal(decision.summary.runtimeVerified, 0);
  assert.equal(decision.summary.postgresVerified, 0);
});
