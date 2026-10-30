import { readFileSync } from "node:fs";
import assert from "node:assert/strict";
import test from "node:test";

const read = (path) => readFileSync(path, "utf8");
const draft = read("src/db/schema/db10-outbound-messages.draft.ts");
const envelope = read("src/modules/operations/outbound-delivery-envelope.ts");
const queue = read("src/modules/operations/outbound-delivery-queue.ts");
const barrel = read("src/db/schema/index.ts");

test("staged global EMAIL suppression is distinct from organization-local suppression", () => {
  assert.match(draft, /db10GlobalEmailSuppressions\s*=\s*pgTable\(/);
  assert.match(draft, /"outbound_global_email_suppressions"/);
  assert.match(draft, /db10OutboundSuppressions\s*=\s*pgTable\(/);
  const global = draft.split("export const db10GlobalEmailSuppressions")[1];
  assert.ok(global, "No global suppression draft");
  assert.match(global, /uniqueIndex\("db10_global_email_suppressions_active_uq"\)/);
  assert.match(global, /\.on\(t\.recipientHash\)\.where\(sql`\$\{t\.clearedAt\} is null`\)/);
  assert.doesNotMatch(global, /organizationId:\s*uuid\(/,
    "A global suppression key must not have a tenant discriminator");
});

test("global suppression stores keyed opaque identity and limits reasons to EMAIL opt-outs", () => {
  const global = draft.split("export const db10GlobalEmailSuppressions")[1];
  assert.match(global, /recipientHash:\s*varchar\("recipient_hash",\s*\{ length: 64 \}\)\.notNull\(\)/);
  assert.match(global, /db10_global_email_suppressions_hash_ck/);
  assert.match(global, /\^\[0-9a-f\]\{64\}\$/);
  assert.match(global, /db10_global_email_suppressions_reason_ck/);
  assert.match(global, /UNSUBSCRIBED.*BOUNCE.*COMPLAINT/);
  assert.doesNotMatch(global, /ADMIN_BLOCK/);
  assert.doesNotMatch(global, /emailNorm|emailAddress|email_plain|email_norm/,
    "Never persist unencrypted global email addresses");
});

test("global email HMAC is domain-separated from organization-scoped outbox recipient", () => {
  assert.match(envelope, /export function deriveGlobalEmailSuppressionHash\(/);
  assert.match(envelope, /intent\.channel !== "EMAIL"\) return null/);
  assert.match(envelope, /"global-email-suppression-v1", intent\.recipient/);
  assert.match(envelope, /const \{ digestKey \} = keyMaterial\(globalEmailHmacKeyBase64\)/);
  assert.match(envelope, /"recipient", JSON\.stringify\(\[\s*intent\.organizationId, intent\.channel, intent\.recipient,/);
  const sealedType = envelope.split("export type SealedOutboundDelivery")[1].split("};")[0];
  assert.doesNotMatch(sealedType, /globalEmailSuppressionHash/,
    "Cross-tenant linkability must not be added to generic persisted envelopes");
});

test("queue atomically suppresses on either active local or global email opt-out", () => {
  assert.match(queue, /DB10_GLOBAL_EMAIL_HMAC_KEY_BASE64/);
  assert.equal((queue.match(/outbound_global_email_suppressions g/g) ?? []).length, 2);
  const attempts = queue.match(/g\.recipient_hash = \$\{globalEmailSuppressionHash\}/g) ?? [];
  assert.equal(attempts.length, 2);
  assert.equal((queue.match(/\$\{envelope\.channel\} = 'EMAIL'/g) ?? []).length, 2);
  assert.equal((queue.match(/g\.cleared_at is null/g) ?? []).length, 2);
  assert.match(queue, /and not exists \([\s\S]*outbound_global_email_suppressions/);
  assert.match(queue, /\) or exists \([\s\S]*outbound_global_email_suppressions/);
  assert.match(queue, /OUTBOUND_QUEUE_DISABLED/);
  assert.match(queue, /process\.env\["DB10_OUTBOUND_READY"\]\s*===\s*"DB10_VERIFIED"/);
});

test("registered suppression is persisted while runtime sender remains separately fail-closed", () => {
  const journal = JSON.parse(read("drizzle/meta/_journal.json"));
  assert.equal(journal.entries.filter(e => e.tag === "0164_lane15_db10_outbound_suppression_storage").length, 1);
  const sql = read("drizzle/0164_lane15_db10_outbound_suppression_storage.sql");
  assert.match(sql, /CREATE TABLE IF NOT EXISTS outbound_global_email_suppressions/);
  assert.match(sql, /db10_global_email_suppressions_active_uq/);
  assert.match(barrel, /db10-outbound-messages\.draft/);
  assert.match(draft, /migration 0164 is registered/);
  assert.match(queue, /DB10_OUTBOUND_DISPATCH_READY/);
  assert.match(queue, /DB10_VERIFIED/);
  assert.doesNotMatch(queue, /\b(?:sendMail|sendSms|sendWhatsapp|provider\.send)\s*\(/i);
});
