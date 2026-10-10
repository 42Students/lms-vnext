import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const ledger = JSON.parse(
  fs.readFileSync(
    "docs/planning/db-pass4-columns-db06_assessments_and_attendance.json",
    "utf8",
  ),
);

const active = [
  "assignment_upload_receipt",
  "attend",
  "grade_audit_log",
  "quiz_answers",
  "quiz_attempts",
  "quiz_options",
  "quiz_questions",
  "quizzes",
  "student_assignment",
].sort();

const historical = [
  "assigned_exam",
  "attempted_question",
  "exam",
  "exam_faculty",
  "exam_faculty_mapping",
  "exam_monitoring",
  "examinee",
  "facial_recognition_result",
  "question",
  "question_option",
  "quiz_attempt",
  "selected_option",
].sort();

test("DB06 source reconciliation partitions all 21 historical candidates without silent retirement", () => {
  assert.equal(ledger.domain, "DB06_ASSESSMENTS_AND_ATTENDANCE");
  assert.equal(ledger.counts.tables, 21);
  assert.equal(ledger.counts.fields, 248);
  assert.equal(ledger.reconciliation.activeSourceContracts.tables, 9);
  assert.equal(ledger.reconciliation.activeSourceContracts.fields, 120);
  assert.equal(ledger.reconciliation.historicalCandidates.tables, 12);
  assert.equal(ledger.reconciliation.historicalCandidates.fields, 128);
  assert.equal(
    ledger.reconciliation.runtimeVerification,
    "BLOCKED_BY_DB-001",
  );

  const activeRows = ledger.tables
    .filter((row) => row.sourceDisposition === "ACTIVE_SOURCE_CONTRACT")
    .map((row) => row.table)
    .sort();
  const historicalRows = ledger.tables
    .filter((row) => row.sourceDisposition === "RETIREMENT_CANDIDATE_NOT_APPROVED")
    .map((row) => row.table)
    .sort();

  assert.deepEqual(activeRows, active);
  assert.deepEqual(historicalRows, historical);
  assert.equal(
    new Set([...activeRows, ...historicalRows]).size,
    ledger.tables.length,
  );
});

test("DB06 historical candidates remain unverified until live/native-SQL evidence exists", () => {
  for (const row of ledger.tables.filter(
    (entry) =>
      entry.sourceDisposition === "RETIREMENT_CANDIDATE_NOT_APPROVED",
  )) {
    assert.equal(
      row.reconciliationStatus,
      "NO_CURRENT_JPA_OR_ROUTE_EVIDENCE_LIVE_NATIVE_SQL_CONFIRMATION_REQUIRED",
    );
    for (const field of row.rows) {
      assert.equal(field.verifiedMapping, null);
      assert.equal(field.validationEvidence, null);
    }
  }
});

test("DB06 active contracts keep explicit target gaps instead of name-match closure", () => {
  const gaps = ledger.reconciliation.targetGaps.join("\n");
  assert.match(gaps, /shuffle_questions\/shuffle_options/);
  assert.match(gaps, /grade-change\/publish history/);
  assert.match(gaps, /re-attempt semantics unresolved/);
  assert.match(gaps, /upload receipt persistence/);
  assert.match(gaps, /attendance correction/);
  assert.match(gaps, /same-tenant schedule\/membership\/actor integrity/);

  for (const row of ledger.tables.filter(
    (entry) => entry.sourceDisposition === "ACTIVE_SOURCE_CONTRACT",
  )) {
    assert.equal(
      row.reconciliationStatus,
      "SOURCE_ACTIVE_TARGET_SEMANTICS_REVIEWED_RUNTIME_UNVERIFIED",
    );
    for (const field of row.rows) {
      assert.equal(field.verifiedMapping, null);
      assert.equal(field.validationEvidence, null);
    }
  }
});
