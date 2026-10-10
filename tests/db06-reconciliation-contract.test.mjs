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


const fieldReconciliation = JSON.parse(
  fs.readFileSync(
    "docs/planning/database-parity-db06-field-reconciliation.json",
    "utf8",
  ),
);

test("DB06 dispositions cover every active source field exactly once", () => {
  assert.equal(fieldReconciliation.counts.activeTables, 9);
  assert.equal(fieldReconciliation.counts.activeSourceFields, 120);
  assert.equal(fieldReconciliation.counts.fieldDispositions, 120);
  assert.equal(fieldReconciliation.counts.runtimeVerifiedFields, 0);

  const sourceActive = ledger.tables.filter(
    (row) => row.sourceDisposition === "ACTIVE_SOURCE_CONTRACT",
  );
  const expected = new Set(
    sourceActive.flatMap((table) =>
      table.rows.map((field) => `${table.table}.${field.legacyColumn}`),
    ),
  );
  const actual = new Set(
    fieldReconciliation.tables.flatMap((table) =>
      table.fields.map((field) => `${table.legacyTable}.${field.legacyField}`),
    ),
  );

  assert.equal(expected.size, 120);
  assert.equal(actual.size, 120);
  assert.deepEqual([...actual].sort(), [...expected].sort());

  for (const table of fieldReconciliation.tables) {
    assert.equal(table.fields.length, table.sourceFieldCount);
    for (const field of table.fields) {
      assert.equal(field.runtimeVerified, false);
      assert.equal(field.validationEvidence, null);
      assert.ok(field.decision);
      assert.ok(Object.hasOwn(field, "targetRef"));
      assert.ok(field.reason);
    }
  }
});

test("DB06 source-backed target gaps cannot disappear without an explicit decision", () => {
  const byKey = new Map(
    fieldReconciliation.tables.flatMap((table) =>
      table.fields.map((field) => [
        `${table.legacyTable}.${field.legacyField}`,
        field,
      ]),
    ),
  );

  assert.equal(
    byKey.get("quizzes.shuffle_questions").decision,
    "TARGET_GAP_REQUIRED",
  );
  assert.equal(
    byKey.get("quizzes.shuffle_options").decision,
    "TARGET_GAP_REQUIRED",
  );
  assert.equal(
    byKey.get("grade_audit_log.action").decision,
    "TARGET_GAP_REQUIRED",
  );
  assert.equal(
    byKey.get("student_assignment.attempt_number").decision,
    "TARGET_GAP_NEEDS_PRODUCT_CONFIRMATION",
  );
  assert.equal(
    byKey.get("assignment_upload_receipt.public_url").decision,
    "RETIRE_SECURITY_ANTI_PATTERN",
  );
  assert.equal(
    byKey.get("attend.is_deleted").decision,
    "NORMALIZED_TO_HISTORY_AND_STATUS",
  );
});


test("DB06 reconciliation includes post-V150 attendance-session persistence", () => {
  const postSnapshot =
    ledger.reconciliation.snapshotBoundary?.postSnapshotDb06Evidence ?? [];
  const attendanceMarked = postSnapshot.find(
    (entry) =>
      entry.migration ===
        "src/main/resources/db/migration/V156__class_schedule_attendance_marked.sql" &&
      entry.legacyTable === "class_schedule" &&
      entry.legacyColumn === "attendance_marked_at",
  );

  assert.ok(attendanceMarked, "V156 attendance_marked_at must not disappear from DB06 reconciliation");
  assert.equal(
    attendanceMarked.sourceDisposition,
    "ACTIVE_CROSS_DOMAIN_SOURCE_CONTRACT",
  );
  assert.match(
    attendanceMarked.normalizedVnextMapping,
    /attendance_sessions\.status/,
  );
  assert.equal(
    attendanceMarked.mappingStatus,
    "SOURCE_MAPPED_RUNTIME_UNVERIFIED",
  );
});
