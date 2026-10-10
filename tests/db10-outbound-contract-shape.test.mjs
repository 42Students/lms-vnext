import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const read = (path) => readFileSync(new URL("../" + path, import.meta.url), "utf8");

test("W06 outbound queues cannot be called before DB10 migration verification", () => {
  const queue = read("src/modules/operations/outbound-delivery-queue.ts");
  assert.match(queue, /DB10_OUTBOUND_READY\s*===\s*"DB10_VERIFIED"/);
  assert.match(queue, /OUTBOUND_QUEUE_DISABLED/);
  assert.match(queue, /requirePermission\(context, "placements.manage"/);
  assert.match(queue, /from colleges c/);
  assert.match(queue, /on conflict \(idempotency_key\) do nothing/);
  assert.match(queue, /recipient_hash = \$\{envelope.recipientHash\}/);
});

test("W06 isolated draft is not registered or exposing recipient plaintext", () => {
  const draft = read("src/db/schema/db10-outbound-messages.draft.ts");
  const barrel = read("src/db/schema/index.ts");
  assert.doesNotMatch(barrel, /db10-outbound-messages/);
  assert.match(draft, /ciphertext_base64/);
  assert.match(draft, /recipient_hash/);
  assert.match(draft, /request_digest/);
  assert.match(draft, /outbound_suppressions/);
  assert.doesNotMatch(draft, /recipient_address|raw_token|invitation_url|email_address/);
});

test("provider receipt is not treated as recipient-delivered", () => {
  const policy = read("src/modules/operations/outbound-delivery-policy.ts");
  assert.match(policy, /PROVIDER_ACCEPTED/);
  assert.match(policy, /DELIVERED/);
  assert.match(policy, /HARD_BOUNCE/);
  assert.match(policy, /COMPLAINT/);
  const envelope = read("src/modules/operations/outbound-delivery-envelope.ts");
  assert.match(envelope, /aes-256-gcm/);
  assert.match(envelope, /setAAD/);
  assert.match(envelope, /hkdfSync/);
});
