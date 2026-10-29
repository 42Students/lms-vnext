import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

// Source-only guard. Actual two-worker SQLSTATE/claim isolation still needs
// the registered migration and disposable PostgreSQL witness.
const sql = readFileSync("docs/planning/sql/db10-outbound-dispatch-lease-candidate.sql", "utf8");
const start = sql.indexOf("CREATE OR REPLACE FUNCTION db10_claim_outbound_messages(");
const end = sql.indexOf("$db067_claim$;", start);
const claim = start >= 0 && end > start ? sql.slice(start, end) : "";

test("DB067 candidate claims EMAIL only until other channels are certified", () => {
  assert.ok(claim.length > 0, "claimed function must remain present");
  assert.match(claim, /WHERE m\.status IN \('PENDING', 'RETRY'\)[\s\S]*?AND m\.channel = 'EMAIL'/);
  assert.match(claim, /FOR UPDATE OF m SKIP LOCKED/);
  assert.match(claim, /o\.claim_fence \+ 1/);
  assert.match(claim, /provider_accepted_at IS NULL/);
});

test("DB067 remains staged and requires pre-send suppression plus PUBLIC revocation", () => {
  assert.match(sql, /DB-067 candidate ONLY/);
  assert.match(sql, /GLOBAL_EMAIL_HASH_MISMATCH/);
  assert.match(sql, /REVOKE ALL ON FUNCTION db10_claim_outbound_messages/);
  assert.match(sql, /REVOKE ALL ON FUNCTION db10_check_outbound_pre_send/);
});
