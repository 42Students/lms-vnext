// DB067: source-contract guards; this is NOT PostgreSQL acceptance.
// Command: node --test tests/db067-outbound-dispatch-contract.test.mjs
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const sql = readFileSync(fileURLToPath(new URL("../docs/planning/sql/db10-outbound-dispatch-lease-candidate.sql", import.meta.url)), "utf8");
const claim = sql.split("CREATE OR REPLACE FUNCTION db10_claim_outbound_messages(")[1]?.split("CREATE OR REPLACE FUNCTION db10_check_outbound_pre_send(")[0] ?? "";
const presend = sql.split("CREATE OR REPLACE FUNCTION db10_check_outbound_pre_send(")[1]?.split("CREATE OR REPLACE FUNCTION db10_complete_outbound_claim(")[0] ?? "";
const complete = sql.split("CREATE OR REPLACE FUNCTION db10_complete_outbound_claim(")[1]?.split("CREATE OR REPLACE FUNCTION db10_expire_unclaimed_outbound(")[0] ?? "";
const expire = sql.split("CREATE OR REPLACE FUNCTION db10_expire_unclaimed_outbound(")[1] ?? "";

test("exact four independent functions with balanced dollar delimiters", () => {
  assert.deepEqual([...sql.matchAll(/CREATE OR REPLACE FUNCTION (db10_[a-z_]+)/g)].map(m => m[1]), [
    "db10_claim_outbound_messages", "db10_check_outbound_pre_send",
    "db10_complete_outbound_claim", "db10_expire_unclaimed_outbound"
  ]);
  for (const label of ["claim", "presend", "complete", "expire"])
    assert.equal(sql.split("$db067_" + label + "$").length - 1, 2, label);
  assert.doesNotMatch(sql, /LANGUAGE plpgsql AS \$(?!db067_)/);
});

test("all four routines revoke PostgreSQL PUBLIC EXECUTE", () => {
  for (const name of ["db10_claim_outbound_messages", "db10_check_outbound_pre_send",
    "db10_complete_outbound_claim", "db10_expire_unclaimed_outbound"]) {
    assert.ok(sql.includes("REVOKE ALL ON FUNCTION " + name + "("), name);
  }
  assert.doesNotMatch(sql, /GRANT\s+EXECUTE[^;]+TO\s+PUBLIC/i);
});

test("claim is SKIP LOCKED, due-gated, and exclusive to unsent queued rows", () => {
  for (const needle of ["status IN ('PENDING', 'RETRY')", "FOR UPDATE OF m SKIP LOCKED",
    "attempts < 5", "provider_accepted_at IS NULL", "provider_message_id IS NULL",
    "not_before IS NULL OR", "next_attempt_at IS NULL OR", "expires_at IS NULL OR",
    "claim_fence = o.claim_fence + 1", "attempts = o.attempts + 1"]) {
    assert.ok(claim.includes(needle), needle);
  }
  assert.ok(!claim.includes("status IN ('CLAIMED'"));
});

test("claim rejects null, unreasonable, and untrusted worker parameters", () => {
  assert.match(claim, /p_worker IS NULL OR p_worker !~/);
  assert.match(claim, /p_max_rows IS NULL OR p_max_rows NOT BETWEEN 1 AND 100/);
  assert.match(claim, /p_lease_seconds IS NULL OR p_lease_seconds NOT BETWEEN 5 AND 300/);
  assert.match(claim, /ERRCODE = '22023'/);
});

test("pre-send locks and checks current owner, monotonically fenced token and lease", () => {
  for (const needle of ["WHERE id = p_message_id", "FOR UPDATE",
    "v_row.status <> 'CLAIMED'", "v_row.claimed_by IS DISTINCT FROM p_worker",
    "v_row.claim_fence IS DISTINCT FROM p_fence", "v_row.claim_expires_at <= v_now"]) {
    assert.ok(presend.includes(needle), needle);
  }
});

test("pre-send fails closed for email when global keyed HMAC is missing or invalid", () => {
  for (const needle of ["v_row.channel = 'EMAIL'", "p_global_email_hash IS NULL OR",
    "p_global_email_hash !~", "GLOBAL_EMAIL_SUPPRESSION_HASH_REQUIRED",
    "outbound_global_email_suppressions", "g.recipient_hash = p_global_email_hash"]) {
    assert.ok(presend.includes(needle), needle);
  }
});

test("pre-send rechecks local scoped suppression and safely terminalizes", () => {
  for (const needle of ["outbound_suppressions s",
    "s.organization_id = v_row.organization_id", "s.channel = v_row.channel",
    "s.recipient_hash = v_row.recipient_hash", "s.cleared_at IS NULL",
    "status = 'SUPPRESSED'", "status = 'EXPIRED'",
    "claimed_by = NULL", "claim_expires_at = NULL", "RETURN false"]) {
    assert.ok(presend.includes(needle), needle);
  }
});

test("claim completion is fenced, owns a row lock and will not accept stale response", () => {
  for (const needle of ["WHERE id = p_message_id FOR UPDATE", "v_row.status <> 'CLAIMED'",
    "v_row.claimed_by IS DISTINCT FROM p_worker", "v_row.claim_fence IS DISTINCT FROM p_fence",
    "v_row.claim_expires_at <= v_now", "status = 'PROVIDER_ACCEPTED'",
    "provider_message_id = p_provider_message_id", "provider_accepted_at = v_now"]) {
    assert.ok(complete.includes(needle), needle);
  }
});

test("retry requires known definitive nonsend, safe code, future retry and remaining attempts", () => {
  for (const needle of ["p_outcome IN ('RETRY', 'FAILED')", "v_row.attempts >= 5",
    "p_next_attempt_at IS NULL", "p_next_attempt_at <= v_now",
    "p_next_attempt_at >= v_row.expires_at",
    "p_safe_failure_code !~", "p_provider_message_id IS NOT NULL",
    "INVALID_OUTCOME"]) {
    assert.ok(complete.includes(needle), needle);
  }
});

test("expiry only terminalizes unclaimed expired rows, never reclaims an uncertain send", () => {
  for (const needle of ["status IN ('PENDING', 'RETRY')",
    "FOR UPDATE OF m SKIP LOCKED", "p_max_rows IS NULL", "status = 'EXPIRED'"]) {
    assert.ok(expire.includes(needle), needle);
  }
  assert.ok(!sql.includes("SET status = 'PENDING'"));
  assert.ok(!sql.includes("SET status = 'CLAIMED' WHERE status = 'CLAIMED'"));
});

test("does not record plaintext PII nor perform network dispatch in SQL", () => {
  assert.match(sql, /candidate ONLY/);
  assert.doesNotMatch(sql, /https?:\/\/\S+/);
  assert.doesNotMatch(sql, /\b(recipient_email|recipient_phone|invitation_url)\s*=/i);
});

test("mutation witness would detect removal of SKIP LOCKED or claim fence", () => {
  const shape = src => src.includes("FOR UPDATE OF m SKIP LOCKED") &&
    src.includes("claim_fence = o.claim_fence + 1");
  assert.equal(shape(claim), true);
  assert.equal(shape(claim.replace("FOR UPDATE OF m SKIP LOCKED", "FOR UPDATE OF m")), false);
  assert.equal(shape(claim.replace("claim_fence = o.claim_fence + 1", "claim_fence = 0")), false);
});

test("mutation witness would detect missing global email suppression", () => {
  const shape = src => src.includes("GLOBAL_EMAIL_SUPPRESSION_HASH_REQUIRED") &&
    src.includes("outbound_global_email_suppressions") &&
    src.includes("s.organization_id = v_row.organization_id");
  assert.equal(shape(presend), true);
  assert.equal(shape(presend.replace("outbound_global_email_suppressions", "ignored")), false);
});
