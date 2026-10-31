import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { randomUUID } from "node:crypto";
import { Pool } from "pg";
import { assertDb018DisposableTarget } from "../support/db018-test-target.mjs";
import { drizzle } from "drizzle-orm/node-postgres";
import { SEED_IDS } from "../../scripts/db-seed-data";
import {
  deriveGlobalEmailSuppressionHash,
  bindGlobalEmailSuppressionHashToOutbox,
  sealOutboundDelivery,
} from "@/modules/operations/outbound-delivery-envelope";
import { persistVerifiedGlobalEmailSuppression } from
  "@/modules/operations/global-email-suppression-service";

/**
 * DB-050 destructive disposable PostgreSQL acceptance.
 * Explicit injection of this isolated pool is mandatory: never use getDb()
 * or fall back to an app database. A live provider is never invoked.
 */
// This destructive witness runs only in its dedicated, opt-in disposable PG17 job.
// Generic integration CI must never connect it to the application database.
const db050Enabled = process.env.DB10_ISOLATED_TEST_DATABASE === "1";
const rawUrl = process.env.TEST_DATABASE_URL;
if (db050Enabled && !rawUrl) throw new Error("DB050 requires explicit TEST_DATABASE_URL");
const target = db050Enabled ? new URL(rawUrl!) : null;
if (db050Enabled && (!["postgres:", "postgresql:"].includes(target!.protocol) ||
    !decodeURIComponent(target!.pathname.slice(1)).toLowerCase().endsWith("_test") ||
    !target!.username || !target!.hostname || target!.search || target!.hash))
  throw new Error("DB050 refuses non-disposable PostgreSQL URL");
if (db050Enabled && process.env.DATABASE_URL) {
  const production = new URL(process.env.DATABASE_URL);
  const identity = (u: URL) =>
    `${u.hostname.toLowerCase()}:${u.port || "5432"}:${decodeURIComponent(u.pathname).toLowerCase()}`;
  if (identity(production) === identity(target!)) {
    // DB001 aliases its already replayed disposable PostgreSQL for service
    // tests. An application database remains forbidden outside this exact
    // independent-verifier isolation contract.
    if (process.env.DB03_ISOLATED_TEST_DATABASE !== "1" ||
        process.env.DATABASE_URL !== rawUrl)
      throw new Error("DB050 refuses the application database");
    assertDb018DisposableTarget(process.env, { serviceBound: true });
  }
}

const pool = new Pool({ connectionString: rawUrl, max: 2 });
const isolated = drizzle(pool);
const encryptionKey = Buffer.alloc(32, 71).toString("base64");
const globalKey = Buffer.alloc(32, 72).toString("base64");
const insertedIds: string[] = [];
const globalHashes: string[] = [];

function intent(recipient: string, collegeId = SEED_IDS.collegeA) {
  return {
    organizationId: SEED_IDS.organization,
    collegeId,
    sourceEventId: randomUUID(),
    channel: "EMAIL" as const,
    templateKey: "RECRUITER_INVITATION" as const,
    recipient,
    variables: {
      companyName: "Private Company", collegeName: "College",
      invitationUrl: "https://invites.example.test/join?token=private",
    },
  };
}

async function insertMessage(
  input: ReturnType<typeof intent>,
  status: "PENDING" | "RETRY" | "CLAIMED",
) {
  const sealed = sealOutboundDelivery(input, encryptionKey);
  const hash = deriveGlobalEmailSuppressionHash(input, globalKey);
  const commitment = bindGlobalEmailSuppressionHashToOutbox(sealed.id, hash);
  insertedIds.push(sealed.id);
  await pool.query(`
    insert into outbound_messages (
      id, organization_id, college_id, source_event_id, channel, template_key,
      recipient_hash, global_email_hash_commitment, idempotency_key,
      request_digest, key_id, nonce_base64, ciphertext_base64, tag_base64,
      status, attempts, claimed_by, claim_expires_at, claim_fence, next_attempt_at
    ) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,
      $17,$18,$19,$20)
  `, [
    sealed.id, input.organizationId, input.collegeId, input.sourceEventId,
    sealed.channel, sealed.templateKey, sealed.recipientHash, commitment,
    sealed.idempotencyKey, sealed.requestDigest, sealed.keyId,
    sealed.nonceBase64, sealed.ciphertextBase64, sealed.tagBase64,
    status, status === "CLAIMED" ? 1 : 0,
    status === "CLAIMED" ? "db050-disposable-worker" : null,
    status === "CLAIMED" ? new Date(Date.now() + 60_000) : null,
    status === "CLAIMED" ? 1 : 0,
    status === "RETRY" ? new Date(Date.now() + 30_000) : null,
  ]);
  return { id: sealed.id, hash };
}

beforeAll(async () => {
  if (!db050Enabled) return;
  const { rows } = await pool.query<{ ready: boolean }>(`
    select to_regclass('public.outbound_messages') is not null
      and to_regclass('public.outbound_global_email_suppressions') is not null
      as ready
  `);
  if (rows[0]?.ready !== true)
    throw new Error("DB050 migration not replayed on disposable PostgreSQL");
});
afterAll(async () => {
  if (!db050Enabled) { await pool.end(); return; }
  try {
    if (insertedIds.length)
      await pool.query("delete from outbound_messages where id=any($1::uuid[])", [insertedIds]);
    if (globalHashes.length)
      await pool.query(
        "delete from outbound_global_email_suppressions where recipient_hash=any($1::varchar[])",
        [globalHashes],
      );
  } finally {
    await pool.end();
  }
});

describe.skipIf(!db050Enabled)("DB-050 verified global EMAIL suppression persists atomically", () => {
  it("suppresses matching pending/retry across colleges but never overwrites claimed or another recipient", async () => {
    // Per-run addresses prevent collision with other disposable suites and
    // ensure afterAll cannot erase another test's global suppression record.
    const address = `cancel-${randomUUID()}@example.test`;
    const first = intent(address, SEED_IDS.collegeA);
    const second = intent(address, SEED_IDS.collegeB);
    const wrong = intent(`other-${randomUUID()}@example.test`, SEED_IDS.collegeB);
    const pending = await insertMessage(first, "PENDING");
    const retry = await insertMessage(second, "RETRY");
    const claimed = await insertMessage(intent(address), "CLAIMED");
    const untouched = await insertMessage(wrong, "PENDING");
    expect(pending.hash).toBe(retry.hash);
    expect(pending.hash).toBe(claimed.hash);
    expect(pending.hash).not.toBe(untouched.hash);
    globalHashes.push(pending.hash!);

    await persistVerifiedGlobalEmailSuppression({
      recipientHash: pending.hash!, reason: "UNSUBSCRIBED",
    }, isolated);

    const { rows } = await pool.query<{ id: string; status: string; next_attempt_at: Date | null;
      last_safe_failure_code: string | null }>(`
      select id,status,next_attempt_at,last_safe_failure_code
        from outbound_messages where id = any($1::uuid[])
    `, [insertedIds]);
    const state = new Map(rows.map(row => [row.id, row]));
    for (const id of [pending.id, retry.id]) {
      expect(state.get(id)?.status).toBe("SUPPRESSED");
      expect(state.get(id)?.next_attempt_at).toBeNull();
      expect(state.get(id)?.last_safe_failure_code).toBe("GLOBAL_EMAIL_SUPPRESSION");
    }
    expect(state.get(claimed.id)?.status).toBe("CLAIMED");
    expect(state.get(untouched.id)?.status).toBe("PENDING");

    await persistVerifiedGlobalEmailSuppression({
      recipientHash: pending.hash!, reason: "UNSUBSCRIBED",
    }, isolated);
    const duplicate = await pool.query<{ count: number }>(`
      select count(*)::int as count from outbound_global_email_suppressions
      where recipient_hash=$1 and cleared_at is null
    `, [pending.hash]);
    expect(duplicate.rows[0]?.count).toBe(1);
  });
});
