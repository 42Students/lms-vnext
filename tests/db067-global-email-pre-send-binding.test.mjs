// DB-067 peer hardening: source guards only, not a PostgreSQL or provider witness.
// Run: node --test tests/db067-global-email-pre-send-binding.test.mjs
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const read = (p) => readFileSync(new URL("../" + p, import.meta.url), "utf8");
const schema = read("src/db/schema/db10-outbound-messages.draft.ts");
const envelope = read("src/modules/operations/outbound-delivery-envelope.ts");
const queue = read("src/modules/operations/outbound-delivery-queue.ts");
const sql = read("docs/planning/sql/db10-outbound-dispatch-lease-candidate.sql");
const claim = sql.split("CREATE OR REPLACE FUNCTION db10_claim_outbound_messages(")[1]?.split("CREATE OR REPLACE FUNCTION db10_check_outbound_pre_send(")[0] ?? "";
const pre = sql.split("CREATE OR REPLACE FUNCTION db10_check_outbound_pre_send(")[1]?.split("CREATE OR REPLACE FUNCTION db10_complete_outbound_claim(")[0] ?? "";
const complete = sql.split("CREATE OR REPLACE FUNCTION db10_complete_outbound_claim(")[1]?.split("CREATE OR REPLACE FUNCTION db10_expire_unclaimed_outbound(")[0] ?? "";

const commitment = (messageId, globalHash) =>
  createHash("sha256")
    .update(`db10-global-email-binding-v1:${messageId}:${globalHash}`, "utf8")
    .digest("hex");

test("source derives message-scoped binding, never persists globally reusable email HMAC", () => {
  assert.match(envelope, /export function bindGlobalEmailSuppressionHashToOutbox\(/);
  assert.match(envelope, /createHash\("sha256"\)/);
  assert.match(envelope, /db10-global-email-binding-v1:/);
  assert.match(envelope, /if \(globalEmailHash === null\) return null/);
  assert.match(queue, /bindGlobalEmailSuppressionHashToOutbox\(\s*envelope\.id, globalEmailSuppressionHash/);
  assert.match(queue, /global_email_hash_commitment, idempotency_key/);
  assert.match(queue, /\$\{globalEmailHashCommitment\}, \$\{envelope\.idempotencyKey\}/);
  assert.doesNotMatch(queue, /\$\{globalEmailSuppressionHash\}, \$\{envelope\.idempotencyKey\}/);
});

test("commitments are different for same opted-out email across two message UUIDs", () => {
  const hash = "a".repeat(64);
  const msgA = "11111111-1111-4111-8111-111111111111";
  const msgB = "22222222-2222-4222-8222-222222222222";
  const a = commitment(msgA, hash);
  const b = commitment(msgB, hash);
  assert.match(a, /^[0-9a-f]{64}$/);
  assert.notEqual(a, b);
  assert.notEqual(a, hash);
  assert.notEqual(commitment(msgA, "b".repeat(64)), a);
  assert.equal(commitment(msgA, hash), a);
});

test("schema requires EMAIL-specific commitments and no non-EMAIL commitments", () => {
  assert.match(schema, /globalEmailHashCommitment: varchar\("global_email_hash_commitment", \{ length: 64 \}\)/);
  assert.match(schema, /db10_outbound_email_commitment_ck/);
  assert.match(schema, /\$\{t\.channel\} = 'EMAIL' and \$\{t\.globalEmailHashCommitment\} is not null and \$\{t\.globalEmailHashCommitment\} ~/);
  assert.match(schema, /\$\{t\.channel\} <> 'EMAIL' and \$\{t\.globalEmailHashCommitment\} is null/);
  assert.doesNotMatch(schema, /globalEmailSuppressionHash:\s*varchar/);
});

test("pre-send checks exact bound HMAC and rejects mismatched values", () => {
  assert.match(pre, /GLOBAL_EMAIL_HASH_MISMATCH/);
  assert.match(pre, /v_row\.global_email_hash_commitment IS DISTINCT FROM/);
  assert.match(pre, /encode\(sha256\(convert_to\(/);
  assert.match(pre, /v_row\.id::text \|\| ':' \|\| p_global_email_hash/);
  assert.match(pre, /GLOBAL_EMAIL_SUPPRESSION_HASH_REQUIRED/);
  assert.match(pre, /outbound_global_email_suppressions/);
  assert.match(pre, /outbound_suppressions/);
  assert.equal(pre.split("db10-global-email-binding-v1:").length - 1, 1);
});

test("pre-send authorizes exact claim fence only after both suppression checks", () => {
  const suppressionCheck = pre.indexOf("IF v_suppressed THEN");
  const authorization = pre.indexOf("SET pre_send_authorized_fence = p_fence");
  assert.ok(suppressionCheck >= 0 && authorization > suppressionCheck);
  assert.match(schema, /preSendAuthorizedFence: integer\("pre_send_authorized_fence"\)/);
  assert.match(schema, /db10_outbound_pre_send_fence_ck/);
  assert.match(schema, /\$\{t\.preSendAuthorizedFence\} = \$\{t\.claimFence\}/);
});

test("claim resets authorization and completion cannot bypass pre-send", () => {
  assert.match(claim, /claim_fence = o\.claim_fence \+ 1,\s+pre_send_authorized_fence = NULL/);
  assert.match(complete, /v_row\.pre_send_authorized_fence IS DISTINCT FROM p_fence/);
  for (const outcome of ["PROVIDER_ACCEPTED", "RETRY", "FAILED"]) {
    assert.ok(complete.includes(outcome), outcome);
  }
  assert.equal((complete.match(/pre_send_authorized_fence = NULL/g) ?? []).length, 2);
  assert.equal((pre.match(/pre_send_authorized_fence = NULL/g) ?? []).length, 2);
});

test("staging stays unregistered; deployment requires migration and real PostgreSQL race checks", () => {
  const barrel = read("src/db/schema/index.ts");
  assert.doesNotMatch(barrel, /db10-outbound-messages/);
  assert.match(sql, /candidate ONLY/);
  assert.match(queue, /DB10_OUTBOUND_READY === "DB10_VERIFIED"/);
  assert.doesNotMatch(sql, /GRANT\s+EXECUTE[^;]+TO\s+PUBLIC/i);
});

test("DB10 integration writer and cleanup share a validated isolated Pool", () => {
  const suite = read("tests/integration/db10-outbound-queue.test.ts");
  assert.match(suite, /const url = process\.env\.TEST_DATABASE_URL;/);
  assert.doesNotMatch(suite, /TEST_DATABASE_URL\s*\?\?\s*process\.env\.DATABASE_URL/);
  assert.match(suite, /\.endsWith\("_test"\)/);
  assert.match(suite, /if \(canonical\(app\) === canonical\(target\)\)/);
  assert.match(suite, /const isolatedDb = drizzle\(pool\)/);
  assert.match(suite, /queueOutboundDeliveryInTransaction\(isolatedDb, context, raw\)/);
  assert.doesNotMatch(suite, /queueOutboundDelivery\(adminA,/);
  assert.doesNotMatch(suite, /import\s+.*getDb/);
  assert.match(suite, /DB10_GLOBAL_EMAIL_HMAC_KEY_BASE64 = globalKey/);
});
