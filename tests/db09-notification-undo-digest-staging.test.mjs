/**
 * DB-012 static staging regression tests. These test a SQL *source contract*,
 * NOT SQL syntax execution, migrations, security enforcement or delivery.
 *
 * Run on a repo checkout with:
 *   node --test tests/db09-notification-undo-digest-staging.test.mjs
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const sql = readFileSync(
  "docs/planning/sql/db09-notification-undo-digest-candidate.sql", "utf8",
);
const ddl = sql.split(/--[^\n]*/g).join(" ");
const matches = (re) => re.test(ddl);

test("the pending source is a candidate, not a registered migration", () => {
  assert.match(sql, /NOT REGISTERED, NOT EXECUTED/);
  assert.match(sql, /Legacy oracle lms@21bad59d4dfaf2fa11fdeaf9353327ce105697d5/);
  assert.match(ddl, /CREATE TABLE placement_notification_undo_groups/i);
  assert.match(ddl, /CREATE TABLE placement_notification_intents/i);
});

test("cross-college and cross-organization source and undo references are not silently accepted", () => {
  assert.ok(matches(/FOREIGN KEY\s*\(college_id,\s*organization_id\)\s*REFERENCES colleges\(id,\s*organization_id\)/i));
  assert.ok(matches(/FOREIGN KEY\s*\(source_event_id,\s*organization_id,\s*college_id\)\s*REFERENCES activity_events\(id,\s*organization_id,\s*college_id\)/i));
  assert.ok(matches(/FOREIGN KEY\s*\(undo_group_id,\s*organization_id,\s*college_id\)\s*REFERENCES placement_notification_undo_groups\(id,\s*organization_id,\s*college_id\)/i));
});

test("the metadata queue cannot hold plaintext contact/payload fields", () => {
  assert.doesNotMatch(ddl, /\bpayload_json\b|\brecipient_email\b|\brecipient_phone\b|\binvitation_url\b/i);
  assert.match(ddl, /encrypted_outbound_ref_id uuid/);
  assert.ok(matches(/channel IN\s*\('APP','EMAIL','SMS'\)/i));
  assert.ok(matches(/channel = 'APP' OR encrypted_outbound_ref_id IS NOT NULL/i));
  assert.ok(matches(/channel <> 'APP' OR encrypted_outbound_ref_id IS NULL/i));
});

test("undo and digest scheduling need an explicit durable state", () => {
  assert.match(ddl, /undo_group_id uuid/);
  assert.match(ddl, /undo_deadline timestamptz NOT NULL/);
  assert.match(ddl, /interval '30 seconds'/);
  assert.match(ddl, /digest_day date/);
  assert.match(ddl, /digest_day IS NULL OR channel = 'EMAIL'/);
  assert.doesNotMatch(ddl, /send_after::date/);
  assert.match(ddl, /WHERE status = 'PENDING'/);
});

test("claim token protects state handoff and APP publication has separate terminal state", () => {
  assert.match(ddl, /claim_token uuid/);
  assert.match(ddl, /claim_lease_expires_at timestamptz/);
  assert.match(ddl, /status = 'CLAIMED'/);
  assert.match(ddl, /APP_PUBLISHED/);
  assert.match(ddl, /PROVIDER_ACCEPTED/);
  assert.match(ddl, /DELIVERED/);
  assert.match(ddl, /UNIQUE \(source_event_id, recipient_user_id, channel\)/);
});

test("all 13 legacy outbox fields retain explicit unverified cross-domain evidence", () => {
  const ledger = JSON.parse(readFileSync(
    "docs/planning/db-pass4-columns-db09_tpo_and_recruiter_operations.json",
    "utf8",
  ));
  const rows = ledger.tables.flatMap((table) => table.rows);
  assert.equal(rows.length, 279);
  const notification = rows.filter((row) => row.legacyTable === "notification_outbox");
  assert.equal(notification.length, 13);
  for (const row of notification) {
    assert.equal(row.reviewStatus, "UNVERIFIED_FIELD_SEMANTICS");
    assert.equal(row.crossDomainEvidence?.status, "STAGED_ONLY_NOT_PG_VERIFIED");
    assert.equal(row.crossDomainEvidence?.runtimeTested, false);
    assert.ok(row.crossDomainEvidence?.observedGap);
  }
  for (const [table, field] of [
    ["prep_assignment", "assessment_id"],
    ["industry_company", "export_columns_json"],
  ]) {
    const row = rows.find((r) => r.legacyTable === table && r.legacyColumn === field);
    assert.ok(row, "Missing unresolved source field " + table + "." + field);
    assert.equal(row.reviewStatus, "UNVERIFIED_FIELD_SEMANTICS");
    assert.equal(row.crossDomainEvidence?.runtimeTested, false);
  }
  assert.equal(ledger.sourceReviewSummary.crossDomainNoSqlOrPgExecution, true);
  assert.equal(ledger.sourceReviewSummary.unresolvedCrossDomainSourceRevisitedFields, 15);
});
