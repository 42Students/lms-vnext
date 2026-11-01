import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = path => readFileSync(path, "utf8");
const json = path => JSON.parse(read(path));
const TABLES = [
  "admin_audit_log",
  "app_setting",
  "log_alert_signature",
  "log_alert_signature_account",
  "log_alert_state",
  "scheduled_job_lock",
];
const FIELD_COUNTS = [13, 9, 17, 3, 4, 4];
const fieldKey = row => row.legacyTable + "." + row.legacyColumn;

test("DB19-P29 owns precisely 50 distinct audited legacy fields", () => {
  const tracker = json("docs/tracker.json");
  const parent = tracker.tasks.find(task => task.id === "DB-019");
  const package29 = parent?.workPlan?.packages.find(item => item.id === "DB19-P29");
  assert.ok(package29, "DB19-P29 is missing from authoritative tracker");
  assert.deepEqual(package29.sourceTables, TABLES);
  assert.equal(package29.sourceFieldCount, 50);
  const inventory = json("docs/planning/db-pass4-columns-db10_shared_operations.json");
  const tables = inventory.tables.filter(table => TABLES.includes(table.table));
  assert.deepEqual(tables.map(table => table.table), TABLES);
  assert.deepEqual(tables.map(table => table.rows.length), FIELD_COUNTS);
  assert.equal(tables.reduce((count, table) => count + table.rows.length, 0), 50);

  const identities = tables.flatMap(table => table.rows.map(row => fieldKey(row)));
  const ledger = json("docs/planning/database-parity-db10-field-ledger.json");
  const rows = ledger.records.filter(row => TABLES.includes(row.legacyTable));
  assert.equal(rows.length, 50);
  assert.equal(new Set(identities).size, 50, "census has duplicate source columns");
  assert.equal(new Set(rows.map(fieldKey)).size, 50, "ledger has duplicate source columns");
  assert.deepEqual(rows.map(fieldKey).sort(), identities.sort(), "census/ledger disagree");
  for (const row of rows) {
    assert.equal(typeof row.sourceDisposition, "string", fieldKey(row));
    assert.ok(row.sourceDisposition.trim().length > 0, fieldKey(row));
    assert.ok(row.status !== "VERIFIED" || row.validationEvidence?.length > 0,
      "runtime verification must never be inferred from source dispositions: " + fieldKey(row));
  }
});

test("DB19-P29 does not flatten security-critical operational semantics", () => {
  const ledger = json("docs/planning/database-parity-db10-field-ledger.json");
  const get = (table, column) => ledger.records.find(
    row => row.legacyTable === table && row.legacyColumn === column);
  assert.match(get("app_setting", "setting_value").sourceDisposition, /TYPED_REGISTRY/);
  assert.match(get("admin_audit_log", "actor_user_type").sourceDisposition, /FORENSIC/);
  assert.match(get("log_alert_signature", "occurrence_count").sourceDisposition, /PRECISION/);
  assert.match(get("log_alert_signature_account", "account_id").sourceDisposition, /PRIVACY_IDENTITY/);
  const editor = read("src/modules/platform-settings/admin-editor-service.ts");
  assert.match(editor, /sensitiveSettingKey/);
  assert.match(editor, /SETTING_STALE/);
  const admin = read("src/modules/log-alerts/admin-service.ts");
  assert.match(admin, /requireGlobalLogAdmin\(context\)/);
  assert.match(admin, /occurrenceCount: row\.occurrenceCount\.toString\(\)/);
});

test("DB19-P29 log-alert jobs claim PostgreSQL-clock fencing and never eagerly release", () => {
  const scheduler = read("src/modules/log-alerts/scheduler.ts");
  const store = read("src/modules/operations/postgres-scheduled-job-lease-store.ts");
  const slice = scheduler.slice(
    scheduler.indexOf("export async function runFencedLogAlertTask("),
    scheduler.indexOf("/** Subsequent burst errors"),
  );
  assert.match(slice, /executeScheduledJobWithLease\(store/);
  assert.match(slice, /postgresScheduledJobLeaseStore/);
  assert.doesNotMatch(slice, /lockedUntil:\s*new Date/);
  assert.doesNotMatch(slice, /finally\s*\{/);
  for (const pattern of [
    /clock_timestamp\(\)/,
    /on conflict \(job_name\) do update/,
    /scheduled_job_leases\.fence \+ 1/,
    /locked_by = \$\{holderId\}/,
    /fence = \$\{lease\.fence\}/,
  ]) assert.match(store, pattern);
  assert.match(scheduler, /await fence\.assertCurrent\(\);\s*const ok = await sendTelegramAlert/);
  assert.match(scheduler, /await fence\.assertCurrent\(\);\s*if \(!await sendTelegramAlert\(message\)\)/);
  assert.match(scheduler, /await fence\.assertCurrent\(\);\s*const success = await reportErrorForAlert/);
});
