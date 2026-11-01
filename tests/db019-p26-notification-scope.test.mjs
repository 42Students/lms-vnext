// DB19-P26 scoped source + retry contract guard. This is not PG17 acceptance.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(new URL("../" + path, import.meta.url), "utf8");
const source = JSON.parse(read("docs/planning/db-pass4-columns-db09_tpo_and_recruiter_operations.json"));
const ledger = JSON.parse(read("docs/planning/database-parity-db09-field-ledger.json"));
const service = read("src/modules/operations/notification-scheduled-job-service.ts");
const names = ["email_suppression", "notification_outbox", "tpo_audit_log", "tpo_bell", "tpo_bell_read"];
const oracle = "21bad59d4dfaf2fa11fdeaf9353327ce105697d5";

function inspectFieldScope(inventory = source, decisions = ledger) {
  const fieldKeys = [];
  const reviewed = new Set();
  const errors = [];
  for (const name of names) {
    const table = inventory.tables.filter((row) => row.table === name);
    if (table.length !== 1) { errors.push("TABLE_MISSING_OR_DUPLICATED:" + name); continue; }
    const rows = table[0].rows;
    if (rows.length !== table[0].sourceFieldCount)
      errors.push("FIELD_COUNT_DRIFT:" + name);
    for (const row of rows) fieldKeys.push(name + "." + row.legacyColumn);
  }
  const expected = new Set(fieldKeys);
  if (expected.size !== 37 || fieldKeys.length !== 37) errors.push("P26_CENSUS_DRIFT");
  if (inventory.sourceSha !== oracle || decisions.legacyBackendSha !== oracle)
    errors.push("ORACLE_PIN_DRIFT");
  for (const row of decisions.records.filter((x) => names.includes(x.legacyTable))) {
    const key = row.legacyTable + "." + row.legacyColumn;
    if (!expected.has(key) || reviewed.has(key)) {
      errors.push("UNKNOWN_OR_DUPLICATE_REVIEW:" + key); continue;
    }
    reviewed.add(key);
    const original = inventory.tables.find((table) => table.table === row.legacyTable)
      ?.rows.find((field) => field.legacyColumn === row.legacyColumn);
    if (row.legacySqlType !== original?.sourceType ||
        row.reviewedAtLegacySha !== oracle)
      errors.push("FIELD_OR_ORACLE_DRIFT:" + key);
    if (row.status !== "REDESIGNED" || !row.mappingTarget?.table ||
        !row.mappingTarget?.column || !row.mappingTarget?.status ||
        !row.semanticDefinition?.trim() || !row.tenantKey?.trim() ||
        !row.actorPermission?.trim() ||
        !row.constraintAndLifecycleEvidence?.trim() ||
        !row.producerPaths?.length || !row.consumerPaths?.length)
      errors.push("DECISION_OR_CONTRACT_MISSING:" + key);
    if (row.dbTestEvidence?.length || row.workflowEvidence?.length)
      errors.push("UNREVIEWED_RUNTIME_EVIDENCE_CLAIM:" + key);
  }
  if (reviewed.size !== 37) errors.push("REVIEW_COVERAGE_DRIFT");
  return errors;
}

function releaseSections(input) {
  const release = input.split("export async function releaseScheduledNotificationOutbox(")[1]
    ?.split("export async function queueFencedInterviewReminders(")[0] ?? "";
  const insert = release.split("const attempt = await tx.execute")[1]
    ?.split("eligible = Boolean(attempt.rows[0])")[0] ?? "";
  const receipt = release.split("const existing = await tx.execute")[1]
    ?.split("eligible = existing.rows[0]")[0] ?? "";
  return { release, insert, receipt };
}

function safeExistingSentReceipt(text) {
  return /n\.delivery_status\s*=\s*'SENT'/.test(text) &&
    /n\.delivered_at\s+is\s+not\s+null/i.test(text) &&
    /n\.deleted_at\s+is\s+null/i.test(text) &&
    /e\.college_id\s*=\s*\$\{entry\.college_id\}/.test(text) &&
    /e\.organization_id\s*=\s*\$\{entry\.organization_id\}/.test(text) &&
    /c\.organization_id\s*=\s*\$\{entry\.organization_id\}/.test(text) &&
    /join organizations o on o.id = c.organization_id/.test(text) &&
    /o\.status = 'ACTIVE'/.test(text) &&
    /m\.status = 'ACTIVE'/.test(text) &&
    /u\.platform_status = 'ACTIVE'/.test(text);
}

test("P26 has exactly 37 reviewed source-field identities across five tables, no runtime promotion", () => {
  assert.deepEqual(inspectFieldScope(), []);
  assert.equal(ledger.sourceOnly, true);
  assert.equal(ledger.verifiedFieldCount, 0);
});

test("P26 source ledger rejects missing, duplicated and forged oracle identities", () => {
  const changed = structuredClone(source);
  changed.tables.find((x) => x.table === "tpo_bell_read").rows[0].legacyColumn = "read_at";
  assert.ok(inspectFieldScope(changed).length > 0);
  const forged = structuredClone(ledger);
  forged.legacyBackendSha = "incorrect-oracle";
  assert.ok(inspectFieldScope(source, forged).includes("ORACLE_PIN_DRIFT"));
});

test("notification delivery retry requires a real, active SENT notification receipt", () => {
  const { release, insert, receipt } = releaseSections(service);
  assert.match(release, /for update skip locked/);
  assert.match(release, /delivery_status in \('SCHEDULED', 'FAILED'\)/);
  assert.match(release, /delivery_attempts < 5/);
  assert.match(insert, /join organizations o on o.id = c.organization_id/);
  assert.match(insert, /o\.status = 'ACTIVE'/);
  assert.match(insert, /m\.status = 'ACTIVE'/);
  assert.ok(safeExistingSentReceipt(receipt), "missing active SENT + tenant receipt gate");
  assert.match(release, /delivery_error = 'RECIPIENT_UNAVAILABLE'/);
});

test("P26 contract fails when delivery, tenant or organization safety predicate is removed", () => {
  const { receipt } = releaseSections(service);
  assert.ok(safeExistingSentReceipt(receipt));
  for (const [original, invalid] of [
    ["n.delivery_status = 'SENT'", "n.delivery_status = 'SCHEDULED'"],
    ["n.delivered_at is not null", "n.delivered_at is null"],
    ["n.deleted_at is null", "n.deleted_at is not null"],
    ["c.organization_id = ${entry.organization_id}", "c.organization_id is not null"],
    ["o.status = 'ACTIVE'", "o.status <> 'ACTIVE'"],
    ["m.status = 'ACTIVE'", "m.status <> 'ACTIVE'"],
  ]) {
    assert.ok(receipt.includes(original), original);
    assert.equal(safeExistingSentReceipt(receipt.replace(original, invalid)), false, original);
  }
});

test("P26 TPO inbox counters and both acknowledgement paths share delivered-only visibility", () => {
  const tpo = read("src/modules/activity/tpo-notifications-service.ts");
  const shared = read("src/modules/activity/notification-service.ts");
  const inbox = tpo.split("export async function getTpoPersonalInbox(")[1]
    ?.split("export async function markOwnTpoNotificationRead(")[0] ?? "";
  const readOne = tpo.split("export async function markOwnTpoNotificationRead(")[1]
    ?.split("export async function markAllOwnTpoNotificationsRead(")[0] ?? "";
  const readAll = tpo.split("export async function markAllOwnTpoNotificationsRead(")[1] ?? "";
  for (const code of [inbox, readOne, readAll]) {
    assert.match(code, /releasedNotificationEvent/);
    assert.match(code, /releasedNotificationReceipt/);
    assert.match(code, /eq\(inAppNotifications.userId, context.user.id\)/);
  }
  assert.match(shared, /export const releasedNotificationEvent = sql<boolean>/);
  assert.match(shared, /export const releasedNotificationReceipt = sql<boolean>/);
  const eventGate = shared.split("export const releasedNotificationEvent")[1]
    ?.split("export const releasedNotificationReceipt")[0] ?? "";
  const receiptGate = shared.split("export const releasedNotificationReceipt")[1]
    ?.split("function parseStaffNotificationSchedule")[0] ?? "";
  assert.match(eventGate, /'deletedAt' is null/);
  assert.match(eventGate, /'deliveryStatus'.*?= 'SENT'/s);
  assert.match(receiptGate, /inAppNotifications.deletedAt} is null/);
  assert.match(receiptGate, /inAppNotifications.deliveryStatus} = 'SENT'/);
  assert.match(receiptGate, /inAppNotifications.deliveredAt} is not null/);
});

test("P26 visibility mutation witness detects count and read path drift", () => {
  const tpo = read("src/modules/activity/tpo-notifications-service.ts");
  const counts = [
    ["getTpoPersonalInbox", "markOwnTpoNotificationRead"],
    ["markOwnTpoNotificationRead", "markAllOwnTpoNotificationsRead"],
    ["markAllOwnTpoNotificationsRead", null],
  ];
  for (const [begin, end] of counts) {
    const segment = tpo.split("export async function " + begin + "(")[1]
      ?.split(end ? "export async function " + end + "(" : "\n__NO_NEXT_FUNCTION__")[0] ?? "";
    const broken = segment.replace("releasedNotificationReceipt", "true");
    assert.ok(segment.includes("releasedNotificationReceipt"), begin);
    assert.equal(broken.includes("releasedNotificationReceipt"), false, begin);
  }
});

test("P26 SQL text cannot contain JavaScript-style comments or unsigned delivery receipts", () => {
  const {receipt} = releaseSections(service);
  assert.doesNotMatch(receipt, /^\s*\/\//m);
  assert.match(receipt, /n\.delivered_at is not null/);
  assert.match(receipt, /n\.delivery_status = 'SENT'/);
});
