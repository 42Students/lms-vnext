import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = p => JSON.parse(fs.readFileSync(path.join(root, p), "utf8"));
const text = p => fs.readFileSync(path.join(root, p), "utf8");

const audit = read("docs/planning/database-parity-pass3-fk-audit.json");
const reconciliation = audit.currentHeadReconciliation;
const guardDraft = text("docs/planning/sql/db14-cross-domain-event-scope-candidate.sql");

test("DB-014 current-head sweep records the 0040 registered schema drift", () => {
  assert.equal(reconciliation.queueTask, "DB-014");
  assert.equal(reconciliation.baseline.pass3Snapshot, "0036");
  assert.equal(reconciliation.baseline.tables, 84);
  assert.equal(reconciliation.registeredHead.journalIndex, 40);
  assert.equal(reconciliation.registeredHead.snapshot, "drizzle/meta/0040_snapshot.json");
  assert.equal(reconciliation.registeredHead.tables, 90);
  assert.equal(reconciliation.registeredHead.foreignKeys, 211);
  assert.equal(reconciliation.registeredHead.checks, 201);
  assert.equal(reconciliation.registeredHead.compositeForeignKeys, 0);
  assert.equal(reconciliation.runtimeVerification, "BLOCKED_BY_DB-001");
});

test("DB-014 broadens the old risk-selected queue to all structural multi-parent tables", () => {
  assert.equal(reconciliation.coverageFinding.baselineStructuralMultiParentTables, 60);
  assert.equal(reconciliation.coverageFinding.baselineSelectedQueue, 41);
  assert.equal(reconciliation.coverageFinding.baselineStructurallyOmitted, 19);
  assert.equal(reconciliation.coverageFinding.currentStructuralMultiParentTables, 65);

  const rows = reconciliation.structuralMultiParentInventory;
  assert.equal(rows.length, 65);
  assert.equal(new Set(rows.map(row => row.table)).size, 65);
  assert.ok(rows.every(row => row.runtimeVerified === false));

  for (const table of [
    "lms_groups",
    "lms_group_members",
    "lms_group_member_events",
    "elective_slots",
    "elective_offerings",
  ]) {
    assert.ok(rows.some(row => row.table === table), table);
  }
});

test("registered DB03 and staged DB07 integrity are not mislabeled as runtime verification", () => {
  const byTable = new Map(
    reconciliation.structuralMultiParentInventory.map(row => [row.table, row]),
  );
  assert.equal(
    byTable.get("lms_group_members")?.disposition,
    "REGISTERED_DB03_TRIGGER_GUARD_RUNTIME_NOT_REEXECUTED",
  );
  assert.equal(
    byTable.get("project_members")?.disposition,
    "STAGED_DB07_GUARD_RUNTIME_UNVERIFIED",
  );
  assert.equal(
    byTable.get("project_instances")?.disposition,
    "PARTIAL_LIVE_DB03_PLUS_STAGED_DB07",
  );
});

test("high-priority event/notification/history scope gaps stay explicit", () => {
  const ids = new Set(
    reconciliation.highPriorityOpenFindings.map(finding => finding.id),
  );
  for (const id of ["DB014-F01", "DB014-F02", "DB014-F03"]) {
    assert.ok(ids.has(id), id);
  }

  assert.match(guardDraft, /db14_guard_activity_event_scope/);
  assert.match(guardDraft, /db14_guard_notification_recipient_scope/);
  assert.match(guardDraft, /db14_guard_group_member_event_scope/);
  assert.match(guardDraft, /actor_membership_status <> 'ACTIVE'/);
  assert.match(guardDraft, /group event SYSTEM actor shape mismatch/);
  assert.match(guardDraft, /SUPER_ADMIN/);
});

test("cascade retention risks remain decisions, not silently rewritten DDL", () => {
  const high = reconciliation.cascadeReview
    .filter(row => row.retentionDisposition === "HIGH_HISTORY_RETENTION_REVIEW")
    .map(row => row.childTable);
  assert.ok(high.includes("attendance_sessions"));
  assert.ok(high.includes("attendance_records"));
  assert.ok(high.includes("placement_round_attendance"));
  assert.match(guardDraft, /does NOT change the cascade-retention findings/);
});
