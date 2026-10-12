import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const decision = JSON.parse(
  readFileSync(
    "docs/planning/db04-chat05-historical-final-disposition-2026-10-12.json",
    "utf8",
  ),
);

test("DB077 dispositions cover exactly the 33 historical DB04 fields", () => {
  assert.equal(decision.task, "DB-077");
  assert.equal(decision.dispositions.length, 2);
  assert.equal(
    decision.dispositions.reduce((n, row) => n + row.sourceFieldCount, 0),
    33,
  );
  assert.equal(decision.summary.fieldsDispositioned, 33);
  assert.equal(decision.summary.anonymousDispositionGaps, 0);
});

test("DB077 approver card stays retired with the removed proctored-exam module", () => {
  const row = decision.dispositions.find(
    (x) => x.legacyTable === "approver_id_card",
  );
  assert.ok(row);
  assert.equal(
    row.disposition,
    "RETIRED_SOURCE_CONFIRMED_LEGACY_PROCTORED_EXAM_REMOVED",
  );
  assert.equal(row.replacementTarget, null);
  assert.equal(row.currentProductRequired, false);
  assert.ok(
    row.evidence.some((value) =>
      value.includes("87731589d37f7a2fe3bce6a689b3f440a77de28c"),
    ),
  );
});

test("DB077 student registration cannot be remapped to placement registration", () => {
  const row = decision.dispositions.find(
    (x) => x.legacyTable === "student_registration",
  );
  assert.ok(row);
  assert.equal(
    row.disposition,
    "RETIRED_CURRENT_PRODUCT_ABSENT_HISTORICAL_EXTERNAL_SYNC_LEDGER",
  );
  assert.equal(row.replacementTarget, null);
  assert.equal(row.currentProductRequired, false);
  assert.match(row.futureRule, /Do not map it to placement_registration/i);
});

test("DB077 future integrations require a fresh contract, not table resurrection", () => {
  for (const row of decision.dispositions) {
    assert.match(row.futureRule, /new|new normalized/i);
    assert.equal(row.runtimeVerificationRequiredForRetirement, false);
  }
  assert.ok(
    decision.guardrails.some((x) =>
      x.includes("future external integration"),
    ),
  );
});

test("DB077 makes no PostgreSQL verification claim for source retirement", () => {
  assert.equal(
    decision.status,
    "SOURCE_DISPOSITION_COMPLETE_RUNTIME_NOT_APPLICABLE",
  );
  assert.equal(
    decision.summary.postgresRuntimeTestsRequiredForSourceRetirement,
    0,
  );
});
