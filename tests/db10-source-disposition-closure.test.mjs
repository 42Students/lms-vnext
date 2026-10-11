import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = p => readFileSync(p, "utf8");
const ledger = JSON.parse(read("docs/planning/database-parity-db10-field-ledger.json"));
const overlay = JSON.parse(read("docs/planning/database-parity-db10-source-disposition-closure.json"));
const contract = read("docs/planning/database-parity-db10-source-disposition-closure.md");
const notificationMap = JSON.parse(read("docs/planning/database-parity-db10-notification-campaign-field-map.json"));
const notificationSql = read("scripts/sql/db10-notification-campaign-staging.sql");
const logSql = read("scripts/sql/db10-log-alerts-staging.sql");
const skillsDraft = read("src/db/schema/db10-skills-catalog.draft.ts");
const smsSql = read("scripts/sql/db10-sms-delivery-attempts-staging.sql");

test("DB46 closes the remaining 77 source-disposition rows exactly once", () => {
  assert.equal(overlay.records.length, 77);
  assert.equal(new Set(overlay.records.map(r => r.legacyId)).size, 77);
  const expected = {
    app_setting: 9,
    log_alert_signature: 17,
    log_alert_signature_account: 3,
    log_alert_state: 4,
    notification: 21,
    skill_synonyms: 3,
    skill_usage: 3,
    skills: 9,
    sms_delivery_log: 8,
  };
  for (const [table, count] of Object.entries(expected)) {
    assert.equal(overlay.records.filter(r => r.legacyTable === table).length, count, table);
  }
});

test("DB46 shared ledger is 221 of 221 source-dispositioned but still unverified", () => {
  assert.equal(ledger.records.length, 221);
  assert.equal(ledger.records.filter(r => r.sourceDisposition).length, 221);
  assert.equal(ledger.records.filter(r => !r.sourceDisposition).length, 0);
  assert.equal(ledger.records.filter(r => r.status === "UNMAPPED").length, 221);
  assert.equal(ledger.counts.verified, 0);
  assert.equal(ledger.counts.sourceDispositionedFields, 221);
  assert.equal(ledger.counts.sourceDispositionMissing, 0);
  assert.equal(ledger.counts.sourceDispositionRuntimeVerified, 0);
});

test("DB46 overlay IDs match ledger rows and claim no runtime/final proof", () => {
  const ledgerById = new Map(ledger.records.map(r => [r.id, r]));
  for (const row of overlay.records) {
    const shared = ledgerById.get(row.legacyId);
    assert.ok(shared, "Missing shared row " + row.legacyId);
    assert.equal(shared.sourceDisposition, row.sourceDisposition);
    assert.equal(shared.sourceDispositionTarget, row.sourceDispositionTarget);
    assert.equal(row.runtimeVerified, false);
    assert.equal(row.finalDispositionApproved, false);
  }
});

test("DB46 preserves active GENERAL notification type and per-user read semantics", () => {
  assert.match(notificationSql, /notification_type IN \('GENERAL','JOB','COURSE','SYSTEM'\)/);
  const type = notificationMap.records.find(r => r.legacyColumn === "notification_type");
  assert.match(type.sourceRationale, /GENERAL default/);
  const readRow = overlay.records.find(r =>
    r.legacyTable === "notification" && r.legacyColumn === "is_read"
  );
  assert.equal(readRow.sourceDispositionTarget, "in_app_notifications.read_at");
});

test("DB46 retires MySQL app-setting helper instead of inventing product state", () => {
  const helper = overlay.records.find(r =>
    r.legacyTable === "app_setting" && r.legacyColumn === "scope_id_key"
  );
  assert.equal(helper.sourceDisposition, "SOURCE_RETIRED_MYSQL_STORAGE_HELPER");
  assert.equal(helper.sourceDispositionTarget, "none");
  const value = overlay.records.find(r =>
    r.legacyTable === "app_setting" && r.legacyColumn === "setting_value"
  );
  assert.match(value.sourceDispositionTarget, /typed domain-owned value\/config/);
});

test("DB46 log-alert identity and counters preserve privacy and precision redesign", () => {
  const account = overlay.records.find(r =>
    r.legacyTable === "log_alert_signature_account" && r.legacyColumn === "account_id"
  );
  assert.equal(account.sourceDispositionTarget, "log_alert_signature_accounts.account_key_hash");
  assert.match(account.sourceDisposition, /PRIVACY_IDENTITY_REDESIGN/);
  const count = overlay.records.find(r =>
    r.legacyTable === "log_alert_signature" && r.legacyColumn === "occurrence_count"
  );
  assert.match(count.sourceDisposition, /PRECISION_REDESIGN/);
  assert.match(logSql, /occurrence_count bigint NOT NULL DEFAULT 1/);
  assert.match(logSql, /account_key_hash varchar\(64\) NOT NULL/);
});

test("DB46 keeps catalog and free-text skill usage counters independent", () => {
  const catalog = overlay.records.find(r =>
    r.legacyTable === "skills" && r.legacyColumn === "usage_count"
  );
  const freeText = overlay.records.find(r =>
    r.legacyTable === "skill_usage" && r.legacyColumn === "usage_count"
  );
  assert.equal(catalog.sourceDispositionTarget, "skills.usage_count");
  assert.equal(freeText.sourceDispositionTarget, "skill_usage.usage_count");
  assert.notEqual(catalog.sourceDispositionTarget, freeText.sourceDispositionTarget);
  assert.match(skillsDraft, /Legacy SkillRepository's popularity counter/);
  assert.match(skillsDraft, /SECOND, INDEPENDENT skill_usage counter/);
});

test("DB46 maps SMS SENT semantics to provider acceptance, not delivery", () => {
  const status = overlay.records.find(r =>
    r.legacyTable === "sms_delivery_log" && r.legacyColumn === "status"
  );
  assert.equal(status.sourceDispositionTarget, "sms_delivery_attempts.outcome");
  assert.match(status.sourceDispositionRationale, /PROVIDER_ACCEPTED/);
  assert.match(smsSql, /legacy status='SENT'\s+-> outcome='PROVIDER_ACCEPTED'/);
  assert.doesNotMatch(smsSql, /outcome IN \([^\n]*'DELIVERED'/);
});

test("DB46 contract enumerates the 20 closure requirements and preserves DB19 DB20 authority", () => {
  for (let i = 1; i <= 20; i += 1) {
    const id = "DB46-" + String(i).padStart(2, "0");
    assert.ok(contract.includes(id), "Missing " + id);
  }
  assert.match(contract, /DB19\/DB20 remain the authority/);
  assert.match(contract, /0\/221 runtime verified/);
});
