import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const sql = readFileSync("scripts/sql/db10-sms-delivery-attempts-staging.sql", "utf8");
const contract = readFileSync("docs/planning/database-parity-db10-sms-delivery-attempts.md", "utf8");

test("DB31 is staging-only and keeps runtime evidence unclaimed", () => {
  assert.match(sql, /HISTORICAL DB-031 PROPOSAL ONLY; DO NOT EXECUTE THIS AS A MIGRATION/);
  assert.match(sql, /registered provider-attempt table is messaging_sms_delivery_attempts/);
  assert.match(sql, /21bad59d4dfaf2fa11fdeaf9353327ce105697d5/);
  assert.match(contract, /STAGED_NOT_REGISTERED \/ POSTGRES_NOT_RUN/);
  assert.match(contract, /ALL NOT_RUN/);
  assert.doesNotMatch(sql, /^\s*(?:DROP TABLE|DROP COLUMN|TRUNCATE)\b/im);
});

test("DB31 stores support-safe SMS attempt data and no message or phone field", () => {
  assert.match(sql, /CREATE TABLE sms_delivery_attempts/);
  assert.match(sql, /purpose varchar\(64\) NOT NULL/);
  assert.match(sql, /provider varchar\(32\) NOT NULL/);
  assert.match(sql, /recipient_suffix varchar\(8\) NULL/);
  assert.match(sql, /provider_message_id varchar\(200\) NULL/);
  assert.match(sql, /safe_failure_code varchar\(40\) NULL/);
  assert.match(sql, /safe_failure_summary varchar\(500\) NULL/);
  assert.doesNotMatch(sql, /^\s*(?:message|message_body|body|phone|phone_number|recipient_phone|otp)\s+/im);
});

test("DB31 truthfully maps legacy SENT to provider acceptance, never handset delivery", () => {
  assert.match(sql, /outcome IN \('PROVIDER_ACCEPTED','FAILED'\)/);
  assert.match(sql, /legacy status='SENT'\s+-> outcome='PROVIDER_ACCEPTED'/);
  assert.match(contract, /not proof that a handset received the message/i);
  assert.doesNotMatch(sql, /outcome IN \([^\n]*'DELIVERED'/);
});

test("DB31 enforces provider outcome shape and privacy-safe suffix", () => {
  assert.match(sql, /recipient_suffix ~ '\^\[0-9\]\{1,4\}\$'/);
  assert.match(sql, /db31_sms_attempt_outcome_shape_ck/);
  assert.match(sql, /outcome = 'PROVIDER_ACCEPTED'/);
  assert.match(sql, /provider_message_id IS NOT NULL/);
  assert.match(sql, /provider_accepted_at IS NOT NULL/);
  assert.match(sql, /outcome = 'FAILED'/);
  assert.match(sql, /safe_failure_code IS NOT NULL/);
});

test("DB31 accepts truly global attempts but fail-closes forged tenant pairs", () => {
  assert.match(sql, /db31_sms_attempt_scope_pair_ck/);
  assert.match(sql, /\(organization_id IS NULL\) = \(college_id IS NULL\)/);
  assert.match(sql, /CREATE OR REPLACE FUNCTION db31_guard_sms_attempt_scope/);
  assert.match(sql, /c\.organization_id = NEW\.organization_id/);
  assert.match(sql, /FOR SHARE;\s*IF NOT FOUND THEN/);
  assert.doesNotMatch(sql, /IF NEW\.college_id IS NOT NULL AND NOT EXISTS/);
  assert.match(sql, /ERRCODE = '23514'/);
});

test("DB31 is append-only and supports retry history instead of overwriting rows", () => {
  assert.match(sql, /attempt_number integer NOT NULL DEFAULT 1/);
  assert.match(sql, /attempt_number >= 1/);
  assert.match(sql, /CREATE TRIGGER db31_sms_attempt_append_only_guard/);
  assert.match(sql, /BEFORE UPDATE OR DELETE ON sms_delivery_attempts/);
  assert.match(sql, /ERRCODE = '55000'/);
  assert.match(contract, /A retry is a new row with a\s+higher/);
});

test("DB31 stays separate from recruiter command queue and does not enum-lock purpose", () => {
  assert.doesNotMatch(sql, /REFERENCES outbound_messages/);
  assert.doesNotMatch(sql, /purpose\s+IN\s*\(/i);
  assert.match(contract, /append-only attempt ledger/);
  assert.match(contract, /recruiter invitation command outbox/);
  assert.match(contract, /otp/);
  assert.match(contract, /job\.update/);
  assert.match(contract, /notification/);
});

test("DB31 enumerates all 16 acceptance witnesses", () => {
  for (let i = 1; i <= 16; i += 1) {
    const id = "DB31-" + String(i).padStart(2, "0");
    assert.ok(contract.includes(id), "Missing acceptance witness " + id);
  }
  assert.match(contract, /not DONE_VERIFIED until/);
});
