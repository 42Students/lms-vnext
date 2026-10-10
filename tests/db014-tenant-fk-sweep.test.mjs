import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const sweep = JSON.parse(
  fs.readFileSync(
    "docs/planning/database-parity-db014-tenant-fk-sweep.json",
    "utf8",
  ),
);
const snapshot = JSON.parse(
  fs.readFileSync("drizzle/meta/0040_snapshot.json", "utf8"),
);
const scopeMigration = fs.readFileSync(
  "drizzle/0039_db03_scope_triggers.sql",
  "utf8",
);

test("DB-014 sweep is pinned to current registered snapshot 0040", () => {
  assert.equal(sweep.registeredJournalHead.idx, 40);
  assert.equal(sweep.registeredJournalHead.tag, "0040_db03_history_actor_types");
  assert.equal(sweep.registeredSnapshot.id, snapshot.id);
  assert.equal(sweep.registeredSnapshot.tables, 90);
  assert.equal(sweep.registeredSnapshot.foreignKeys, 211);
  assert.equal(sweep.registeredSnapshot.compositeForeignKeys, 0);
  assert.equal(sweep.registeredSnapshot.multiParentTables, 65);
  assert.equal(sweep.registeredSnapshot.cascadeForeignKeys, 9);
});

test("DB-014 preserves the 0036→0040 delta instead of reusing stale Pass-3 counts", () => {
  assert.deepEqual(sweep.deltaFromPass3Snapshot0036.addedTables, [
    "elective_offerings",
    "elective_slots",
    "lms_group_member_events",
    "lms_group_members",
    "lms_group_rules",
    "lms_groups",
  ]);
  assert.equal(sweep.deltaFromPass3Snapshot0036.oldPass3MultiParentCandidateCount, 41);
  assert.equal(sweep.deltaFromPass3Snapshot0036.currentMultiParentCount, 65);
  assert.equal(sweep.deltaFromPass3Snapshot0036.newMultiParentTables.length, 24);
});

test("DB03 scope protection is represented as trigger evidence, not fake composite FKs", () => {
  for (const trigger of [
    "db03_member_tenant_guard",
    "db03_elective_slot_scope_guard",
    "db03_elective_offering_scope_guard",
    "db03_project_team_scope_guard",
  ]) {
    assert.match(scopeMigration, new RegExp(`CREATE TRIGGER ${trigger}`));
  }

  assert.equal(
    sweep.multiParentRows.find((row) => row.table === "lms_group_members")
      ?.registeredDbGuard?.trigger,
    "db03_member_tenant_guard",
  );
  assert.equal(
    sweep.multiParentRows.find((row) => row.table === "lms_group_member_events")
      ?.registeredDbGuard,
    null,
  );
});

test("DB-014 keeps cascade retention and tenant-unique reviews explicit", () => {
  const riskyCascadeTables = new Set(
    sweep.cascadeReview
      .filter((row) => row.classification === "HISTORY_RETENTION_REVIEW_REQUIRED")
      .map((row) => row.table),
  );
  for (const table of [
    "attendance_sessions",
    "attendance_records",
    "course_discussion_messages",
    "placement_drive_day_coordinator_assignments",
    "placement_round_attendance",
  ]) {
    assert.ok(riskyCascadeTables.has(table));
  }

  assert.equal(sweep.cascadeReview.length, 9);
  assert.equal(sweep.tenantUniqueScopeReview.length, 5);
  assert.ok(
    sweep.tenantUniqueScopeReview.some(
      (row) =>
        row.table === "activity_events" &&
        row.index === "activity_events_dedupe_uq",
    ),
  );
});

test("DB-014 never upgrades source review into runtime proof", () => {
  assert.equal(
    sweep.runtimeVerification.postgresReplay,
    "NOT_EXECUTED_DB-001_BLOCKED",
  );
  assert.equal(
    sweep.runtimeVerification.directNegativeWrites,
    "NOT_EXECUTED_DB-001_BLOCKED",
  );
  assert.equal(
    sweep.runtimeVerification.catalogIntrospection,
    "NOT_EXECUTED_DB-001_BLOCKED",
  );
  assert.equal(sweep.status, "SOURCE_RECONCILIATION_RUNTIME_UNVERIFIED");
});
