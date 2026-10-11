import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const file = (path) => readFileSync(path, "utf8");
const ledger = JSON.parse(file("docs/planning/database-parity-db10-notification-campaign-field-map.json"));
const sql = file("scripts/sql/db10-notification-campaign-staging.sql");
const contract = file("docs/planning/database-parity-db10-notification-campaign-contract.md");
const activity = file("src/db/schema/activity.ts");
const notificationService = file("src/modules/activity/notification-service.ts");

test("DB043 tracks all 21 distinct legacy notification columns with explicit source evidence", () => {
  assert.equal(ledger.task, "DB-043");
  assert.equal(ledger.counts.legacyFields, 21);
  assert.equal(ledger.counts.sourceDispositions, 21);
  assert.equal(ledger.records.length, 21);
  assert.equal(new Set(ledger.records.map(row => row.legacyColumn)).size, 21);
  for (const row of ledger.records) {
    assert.equal(row.legacyTable, "notification");
    assert.ok(row.canonicalTarget);
    assert.ok(row.sourceRationale);
    assert.ok(row.disposition);
    assert.ok(row.sourceEvidence.length >= 5);
    assert.equal(row.runtimeVerified, false);
    assert.equal(row.finalRetirementApproved, false);
  }
  assert.equal(ledger.counts.runtimeVerified, 0);
  assert.equal(ledger.counts.retirementApproved, 0);
});

test("DB043 preserves the active GENERAL type alongside explicit producer types", () => {
  for (const type of ["GENERAL", "JOB", "COURSE", "SYSTEM"]) {
    assert.ok(sql.includes("'" + type + "'"), "Missing notification type " + type);
  }
  const row = ledger.records.find(item => item.legacyColumn === "notification_type");
  assert.match(row.sourceRationale, /GENERAL default/);
  assert.match(contract, /defaults a null non-course type to `GENERAL`/);
});

test("DB043 preserves broadcast audience shapes, including SECTION_COURSE and recipient-only", () => {
  assert.match(sql, /CREATE TABLE notification_campaigns/);
  assert.match(sql, /audience_scope varchar\(20\) NOT NULL/);
  for (const scope of ["USER", "SECTION", "COURSE", "SECTION_COURSE"]) {
    assert.ok(sql.includes("audience_scope = '" + scope + "'"), "Missing " + scope);
  }
  assert.match(sql, /target_user_id IS NOT NULL/);
  assert.match(sql, /target_section_id IS NOT NULL/);
  assert.match(sql, /target_course_id IS NOT NULL/);
  assert.match(contract, /class_id = 0/);
  assert.match(contract, /course-wide/);
});

test("DB043 does not share a broadcast read marker", () => {
  assert.match(activity, /inAppNotifications = pgTable/);
  assert.match(activity, /readAt: timestamp\("read_at"/);
  assert.match(activity, /in_app_notifications_user_event_uq/);
  const ddl = sql.slice(sql.indexOf("CREATE TABLE"), sql.indexOf("CREATE INDEX"));
  assert.doesNotMatch(ddl, /\\bis_read\\s+\\w+|\\bread_at\\s+\\w+/i);
  const read = ledger.records.find(row => row.legacyColumn === "is_read");
  assert.equal(read.canonicalTarget, "in_app_notifications.read_at");
  assert.match(contract, /per recipient/);
});

test("DB043 scheduled campaigns are separate from delivered receipts", () => {
  assert.match(sql, /scheduled_at timestamptz/);
  assert.match(sql, /published_at timestamptz/);
  assert.match(sql, /claim_token uuid/);
  assert.match(sql, /claim_expires_at timestamptz/);
  assert.match(sql, /CREATE INDEX db43_campaign_due_idx/);
  assert.match(sql, /status IN \('SCHEDULED','FAILED'\)/);
  assert.match(contract, /SCHEDULED campaign does not appear/);
  assert.match(notificationService, /\.insert\(inAppNotifications\)/);
});

test("DB043 campaigns guard exact college/organization/activity event scope", () => {
  assert.match(sql, /REFERENCES organizations\(id\)/);
  assert.match(sql, /REFERENCES colleges\(id\)/);
  assert.match(sql, /source_event_id uuid NOT NULL UNIQUE REFERENCES activity_events\(id\)/);
  assert.match(sql, /event_college IS DISTINCT FROM NEW\.college_id/);
  assert.match(sql, /event_org IS DISTINCT FROM NEW\.organization_id/);
  assert.match(sql, /creator_college IS DISTINCT FROM NEW\.college_id/);
  assert.match(sql, /section_college IS DISTINCT FROM NEW\.college_id/);
  assert.match(sql, /course_college IS DISTINCT FROM NEW\.college_id/);
  assert.match(sql, /Campaign personal recipient is not active in college/);
});

test("DB043 section-course targets require a real active course delivery", () => {
  assert.match(sql, /IF NEW\.audience_scope='SECTION_COURSE' THEN/);
  assert.match(sql, /JOIN course_offerings o ON o\.id=cd\.offering_id/);
  assert.match(sql, /cd\.section_id=NEW\.target_section_id/);
  assert.match(sql, /o\.course_id=NEW\.target_course_id/);
  assert.match(sql, /cd\.ended_at IS NULL AND o\.status='ACTIVE'/);
});

test("DB043 disallows provider secrets and unchecked external assessment URLs", () => {
  const assessment = ledger.records.find(row => row.legacyColumn === "assessment_url");
  assert.match(assessment.disposition, /SECURITY_REDESIGN/);
  assert.match(assessment.canonicalTarget, /safe internal assessment redirect/);
  assert.match(sql, /action_href LIKE '\/%'/);
  assert.match(sql, /action_href NOT LIKE '\/\/%'/);
  assert.match(sql, /position\(chr\(92\) in action_href\) = 0/);
  assert.doesNotMatch(sql, /ADD COLUMN\s+assessment_url|recipient_phone|recipient_email|otp|api_secret/i);
  assert.match(contract, /separate approved trusted renderer/);
});

test("DB043 retains truthful publication status and claims instead of false provider delivery", () => {
  for (const status of ["DRAFT", "SCHEDULED", "PUBLISHING", "PUBLISHED", "FAILED", "CANCELLED"]) {
    assert.ok(sql.includes("'" + status + "'"), "Missing " + status);
  }
  assert.match(sql, /status <> 'PUBLISHED' OR \(published_at IS NOT NULL/);
  assert.match(sql, /status <> 'PUBLISHING' OR \(claim_token IS NOT NULL/);
  assert.match(sql, /status <> 'FAILED' OR last_failure_code IS NOT NULL/);
  assert.match(contract, /No provider email\\/SMS send is implied/);
});

test("DB043 drafts stay unregistered and require independent Postgres proof", () => {
  assert.match(sql, /STAGING ONLY: NOT a registered Drizzle migration/);
  assert.match(contract, /RUNTIME_NOT_VERIFIED/);
  assert.match(contract, /ALL NOT_RUN/);
  assert.match(contract, /GitHub Actions is stopped because of billing/);
  assert.match(contract, /Chat 1.*only registered Drizzle migration/s);
});

test("DB043 enumerates all 20 negative/race acceptance requirements", () => {
  for (let i = 1; i <= 20; i++) {
    const id = "DB43-" + String(i).padStart(2, "0");
    assert.ok(contract.includes(id), "Missing " + id);
  }
});

test("DB043 greenfield system does not require legacy MySQL data migration", () => {
  assert.match(sql, /NOT a legacy-data migration/);
  assert.match(contract, /No legacy data is being migrated/);
});

test("DB043 SQL uses only source stage objects, not shared migration journal edits", () => {
  assert.equal((sql.match(/CREATE TABLE /g) || []).length, 1);
  assert.equal((sql.match(/CREATE TRIGGER /g) || []).length, 1);
  assert.equal((sql.match(/CREATE FUNCTION /g) || []).length, 1);
  assert.doesNotMatch(sql, /DROP TABLE|TRUNCATE|DELETE FROM/);
});
