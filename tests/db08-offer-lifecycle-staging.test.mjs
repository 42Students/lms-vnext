import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const sql = readFileSync("scripts/sql/db08-offer-lifecycle-staging.sql", "utf8");
const contract = readFileSync("docs/planning/database-parity-db08-offer-lifecycle.md", "utf8");

test("DB29 remains staging-only and keeps source/runtime evidence honest", () => {
  assert.match(sql, /STAGING ONLY, NOT A DRIZZLE MIGRATION/);
  assert.match(sql, /21bad59d4dfaf2fa11fdeaf9353327ce105697d5/);
  assert.match(contract, /STAGED_NOT_REGISTERED \/ POSTGRES_NOT_RUN/);
  assert.match(contract, /does not claim runtime\s+verification/);
  assert.doesNotMatch(sql, /^\s*(?:DROP TABLE|DROP COLUMN|DELETE FROM|TRUNCATE)\b/im);
});

test("DB29 maps source-active offer states without inventing a duplicate RELEASED state", () => {
  assert.match(sql, /legacy RELEASED\s+-> vNext ISSUED/);
  assert.match(sql, /status IN \('SELECTED','ISSUED','ACCEPTED','DECLINED','EXPIRED','WITHDRAWN'\)/);
  assert.doesNotMatch(sql, /status IN \([^\n]*'RELEASED'/);
  assert.match(contract, /PENDING_VERIFICATION.*UNVERIFIED DECLARED STATE/);
  assert.match(contract, /REVOKED.*UNVERIFIED DECLARED STATE/);
});

test("DB29 makes SELECTED participate in the one-active-offer invariant", () => {
  assert.match(sql, /DROP INDEX IF EXISTS placement_offers_active_application_uq/);
  assert.match(sql, /CREATE UNIQUE INDEX placement_offers_active_application_uq/);
  assert.match(sql, /WHERE status IN \('SELECTED','ISSUED','ACCEPTED'\)/);
});

test("DB29 stages creator/verifier provenance without fake scheduler users", () => {
  assert.match(sql, /ADD COLUMN created_by_actor_type varchar\(16\)/);
  assert.match(sql, /ADD COLUMN verified_by_user_id uuid/);
  assert.match(sql, /ADD COLUMN verified_at timestamp with time zone/);
  assert.match(sql, /db29_offer_verifier_pair_ck/);
  assert.match(sql, /ALTER COLUMN actor_user_id DROP NOT NULL/);
  assert.match(sql, /ADD COLUMN actor_type varchar\(16\) NOT NULL DEFAULT 'USER'/);
  assert.match(sql, /actor_type = 'SYSTEM' AND actor_user_id IS NULL/);
});

test("DB29 preserves external-import acceptance without pretending it was in-app released", () => {
  assert.match(sql, /acceptance_channel = 'IN_APP' AND released_at IS NOT NULL/);
  assert.match(sql, /OR acceptance_channel = 'EXTERNAL_IMPORT'/);
  assert.match(contract, /EXTERNAL_IMPORT acceptance can exist without prior release/);
});

test("DB29 status history covers selection expiry and accepted-offer reversal", () => {
  assert.match(sql, /from_status IS NULL AND to_status IN \('SELECTED','ISSUED'\)/);
  assert.match(sql, /from_status = 'SELECTED' AND to_status IN \('ISSUED','ACCEPTED','WITHDRAWN'\)/);
  assert.match(sql, /from_status = 'ISSUED' AND to_status IN \('ACCEPTED','DECLINED','EXPIRED','WITHDRAWN'\)/);
  assert.match(sql, /from_status = 'ACCEPTED' AND to_status IN \('ISSUED','WITHDRAWN'\)/);
  assert.match(sql, /db29_offer_history_reversal_reason_ck/);
  assert.match(sql, /from_status = 'ISSUED' AND to_status = 'EXPIRED'/);
});

test("DB29 keeps joining and private-letter persistence normalized instead of duplicating legacy columns", () => {
  assert.doesNotMatch(sql, /ADD COLUMN joining_status\b/);
  assert.doesNotMatch(sql, /ADD COLUMN letter_url\b/);
  assert.match(sql, /joining_status -> placement_joining_outcomes\.status\/history/);
  assert.match(sql, /letter_url -> DB-016 private object receipt\/reference/);
  assert.match(contract, /joining state remains normalized/);
  assert.match(contract, /private offer letter remains authorized private object persistence/);
});

test("DB29 enumerates all required acceptance witnesses as NOT_RUN", () => {
  for (let i = 1; i <= 15; i += 1) {
    const id = "DB29-" + String(i).padStart(2, "0");
    assert.ok(contract.includes(id), "Missing acceptance witness " + id);
  }
  assert.match(contract, /Acceptance witnesses — ALL NOT_RUN/);
  assert.match(contract, /not DONE_VERIFIED until registered PostgreSQL/);
});
