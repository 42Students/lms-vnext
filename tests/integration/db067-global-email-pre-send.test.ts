import { createHash, randomBytes, randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { Pool, type PoolClient } from "pg";
import { SEED_IDS } from "../../scripts/db-seed-data";
import { executeClaimedOutbound } from "@/modules/operations/outbound-dispatch-orchestration";
import { parseOutboundIntent } from "@/modules/operations/outbound-delivery-contract";

/**
 * DB067 negative PostgreSQL acceptance. Opt-in only, on a seeded, disposable
 * *_test database after Chat 1 registers DB050 + DB067 schema and functions.
 * This is authored coverage, NOT evidence of an executed migration or send.
 * No network/provider calls. Every fixture operation rolls back.
 */
const enabled = process.env.DB067_DISPATCH_ACCEPTANCE === "1";
const targetUrl = enabled ? process.env.TEST_DATABASE_URL : undefined;
if (enabled) {
  if (!targetUrl) throw new Error("DB067 needs explicit TEST_DATABASE_URL");
  const u = new URL(targetUrl);
  if (!["postgres:", "postgresql:"].includes(u.protocol) ||
      !u.username || !u.hostname || u.search || u.hash ||
      !decodeURIComponent(u.pathname.slice(1)).toLowerCase().endsWith("_test")) {
    throw new Error("DB067 requires disposable PostgreSQL *_test target");
  }
  if (process.env.DATABASE_URL) {
    const app = new URL(process.env.DATABASE_URL);
    const canonical = (x: URL) => [
      x.hostname.toLowerCase(), x.port || "5432", decodeURIComponent(x.pathname),
    ].join(":");
    if (canonical(app) === canonical(u)) {
      throw new Error("DB067 refuses application DATABASE_URL target");
    }
  }
}
const pool = enabled ? new Pool({ connectionString: targetUrl, max: 3 }) : null;
const globalEmailHash = () => randomBytes(32).toString("hex");
const binding = (id: string, hash: string) => createHash("sha256")
  .update(`db10-global-email-binding-v1:${id}:${hash}`, "utf8")
  .digest("hex");

async function transaction(fn: (client: PoolClient) => Promise<void>) {
  if (!pool) throw new Error("DB067 PG acceptance not opted in");
  const client = await pool.connect();
  let started = false;
  try {
    await client.query("BEGIN");
    started = true;
    await fn(client);
  } finally {
    try {
      if (started) await client.query("ROLLBACK");
    } finally {
      client.release();
    }
  }
}

async function pending(
  client: PoolClient,
  opts: { channel?: "EMAIL" | "SMS"; hash?: string; commitment?: string | null } = {},
) {
  const id = randomUUID();
  const hash = opts.hash ?? globalEmailHash();
  const recipient = globalEmailHash();
  const committed = opts.commitment !== undefined
    ? opts.commitment
    : (opts.channel === "SMS" ? null : binding(id, hash));
  await client.query(
    `insert into outbound_messages
       (id, organization_id, college_id, source_event_id,
        channel, template_key, recipient_hash, global_email_hash_commitment,
        idempotency_key, request_digest, key_id, nonce_base64, tag_base64,
        ciphertext_base64, status, created_at)
     values ($1,$2,$3,$4,$5,'RECRUITER_INVITATION',$6,$7,
             $8,$9,'v1','AA==','AA==','AA==','PENDING','2000-01-01T00:00:00Z')`,
    [
      id, SEED_IDS.organization, SEED_IDS.collegeA, randomUUID(),
      opts.channel ?? "EMAIL", recipient, committed, globalEmailHash(), globalEmailHash(),
    ],
  );
  return { id, hash, recipient };
}

async function claim(client: PoolClient, id: string, worker = "db067-acceptance") {
  const result = await client.query<{ message_id: string; fence: number }>(
    "select * from db10_claim_outbound_messages($1, 100, 60)",
    [worker],
  );
  const row = result.rows.find((r) => r.message_id === id);
  expect(row).toBeDefined();
  return { worker, fence: row!.fence };
}

async function check(
  client: PoolClient, id: string, worker: string, fence: number, hash: string | null,
) {
  const result = await client.query<{ ok: boolean }>(
    "select db10_check_outbound_pre_send($1,$2,$3,$4) as ok",
    [id, worker, fence, hash],
  );
  return result.rows[0]?.ok;
}

async function complete(
  client: PoolClient, id: string, worker: string, fence: number,
) {
  const result = await client.query<{ ok: boolean }>(
    "select db10_complete_outbound_claim($1,$2,$3,'PROVIDER_ACCEPTED',$4,null,null) as ok",
    [id, worker, fence, "db067-acceptance-receipt"],
  );
  return result.rows[0]?.ok;
}

describe.skipIf(!enabled)("DB067 global EMAIL identity and pre-send fencing (disposable PostgreSQL)", () => {
  beforeAll(async () => {
    if (!pool) throw new Error("DB067 missing explicitly authorized test pool");
    // A skipped/missing migration must fail acceptance, not result in green.
    const columns = await pool.query<{ column_name: string }>(
      `select column_name from information_schema.columns
       where table_name='outbound_messages'
         and column_name in ('global_email_hash_commitment','pre_send_authorized_fence')`,
    );
    expect(new Set(columns.rows.map((r) => r.column_name))).toEqual(new Set([
      "global_email_hash_commitment", "pre_send_authorized_fence",
    ]));
    const functions = await pool.query<{ name: string | null }>(
      `select to_regprocedure('db10_claim_outbound_messages(text,integer,integer)')::text as name
       union all
       select to_regprocedure('db10_check_outbound_pre_send(uuid,text,integer,text)')::text
       union all
       select to_regprocedure('db10_complete_outbound_claim(uuid,text,integer,text,text,text,timestamptz)')::text`,
    );
    expect(functions.rows).toHaveLength(3);
    expect(functions.rows.every((r) => r.name !== null)).toBe(true);
  });
  afterAll(async () => { if (pool) await pool.end(); });

  it("rejects an EMAIL queued without its recipient commitment", async () => {
    await transaction(async (client) => {
      await expect(pending(client, { commitment: null })).rejects.toMatchObject({
        code: "23514", constraint: "db10_outbound_email_commitment_ck",
      });
    });
  });

  it("rejects a non-EMAIL queued with an EMAIL-only commitment", async () => {
    await transaction(async (client) => {
      await expect(pending(client, {
        channel: "SMS", commitment: globalEmailHash(),
      })).rejects.toMatchObject({
        code: "23514", constraint: "db10_outbound_email_commitment_ck",
      });
    });
  });

  it("does not let a worker complete a claim without pre-send authorization", async () => {
    await transaction(async (client) => {
      const row = await pending(client);
      const c = await claim(client, row.id);
      expect(await complete(client, row.id, c.worker, c.fence)).toBe(false);
      const state = await client.query(
        "select status,pre_send_authorized_fence from outbound_messages where id=$1",
        [row.id],
      );
      expect(state.rows[0]).toMatchObject({
        status: "CLAIMED", pre_send_authorized_fence: null,
      });
    });
  });

  it("rejects a plausible but wrong global EMAIL HMAC, not just malformed hashes", async () => {
    await transaction(async (client) => {
      const row = await pending(client);
      const c = await claim(client, row.id);
      await expect(check(client, row.id, c.worker, c.fence, globalEmailHash()))
        .rejects.toMatchObject({ code: "22023", message: "GLOBAL_EMAIL_HASH_MISMATCH" });
    });
  });

  it("rejects missing HMAC and preserves fail-closed behavior", async () => {
    await transaction(async (client) => {
      const row = await pending(client);
      const c = await claim(client, row.id);
      await expect(check(client, row.id, c.worker, c.fence, null))
        .rejects.toMatchObject({ code: "22023", message: "GLOBAL_EMAIL_SUPPRESSION_HASH_REQUIRED" });
    });
  });

  it("binds a successful check to its fence, then permits definitive acceptance", async () => {
    await transaction(async (client) => {
      const row = await pending(client);
      const c = await claim(client, row.id);
      expect(await check(client, row.id, c.worker, c.fence, row.hash)).toBe(true);
      const current = await client.query<{ pre_send_authorized_fence: number }>(
        "select pre_send_authorized_fence from outbound_messages where id=$1", [row.id],
      );
      expect(current.rows[0]?.pre_send_authorized_fence).toBe(c.fence);
      expect(await complete(client, row.id, c.worker, c.fence)).toBe(true);
      const end = await client.query<{ status: string; pre_send_authorized_fence: null }>(
        "select status,pre_send_authorized_fence from outbound_messages where id=$1", [row.id],
      );
      expect(end.rows[0]).toMatchObject({
        status: "PROVIDER_ACCEPTED", pre_send_authorized_fence: null,
      });
    });
  });

  it("denies stale fences and foreign worker identifiers", async () => {
    await transaction(async (client) => {
      const row = await pending(client);
      const c = await claim(client, row.id);
      expect(await check(client, row.id, c.worker, c.fence + 1, row.hash)).toBe(false);
      expect(await check(client, row.id, "foreign-worker", c.fence, row.hash)).toBe(false);
      expect(await complete(client, row.id, c.worker, c.fence)).toBe(false);
    });
  });


  it("P5-R09 grants only one live claim to competing PostgreSQL workers and quarantines expired CLAIMED", async () => {
    if (!pool) throw new Error("DB067 requires the disposable PG17 pool");
    const setup = await pool.connect();
    let id: string | null = null;
    try {
      const row = await pending(setup);
      id = row.id;
    } finally {
      setup.release();
    }
    const first = await pool.connect();
    const second = await pool.connect();
    try {
      await first.query("BEGIN");
      const winner = await claim(first, id!, "p5-r09-first");
      // The first sender owns an uncommitted row lock. SKIP LOCKED must
      // return promptly and never issue the same logical message to another.
      const competing = await second.query<{message_id: string}>(
        "select message_id from db10_claim_outbound_messages($1, 100, 60)",
        ["p5-r09-second"],
      );
      expect(competing.rows.filter((x) => x.message_id === id)).toHaveLength(0);
      await first.query("COMMIT");
      const persisted = await second.query<{
        status:string; claimed_by:string; claim_fence:number; attempts:number;
      }>(
        "select status, claimed_by, claim_fence, attempts from outbound_messages where id=$1",
        [id],
      );
      expect(persisted.rows[0]).toMatchObject({
        status:"CLAIMED", claimed_by:"p5-r09-first",
        claim_fence:winner.fence, attempts:1,
      });
      // Even an expired lease must not requeue an ambiguous provider outcome.
      await second.query(
        "update outbound_messages set claim_expires_at=clock_timestamp()-interval '1 second' where id=$1",
        [id],
      );
      const later = await second.query<{message_id:string}>(
        "select message_id from db10_claim_outbound_messages($1, 100, 60)",
        ["p5-r09-reclaimer"],
      );
      expect(later.rows.filter((x) => x.message_id === id)).toHaveLength(0);
      expect(await check(second, id!, "p5-r09-first", winner.fence, null)).toBe(false);
      const quarantined = await second.query<{status:string; claim_fence:number; attempts:number}>(
        "select status,claim_fence,attempts from outbound_messages where id=$1", [id],
      );
      expect(quarantined.rows[0]).toMatchObject({
        status:"CLAIMED",claim_fence:winner.fence,attempts:1,
      });
    } finally {
      await first.query("ROLLBACK");
      first.release();
      second.release();
      if (id) await pool.query("delete from outbound_messages where id=$1", [id]);
    }
  });

  it("applies a global unsubscribe inserted after enqueue but before pre-send", async () => {
    await transaction(async (client) => {
      const row = await pending(client);
      const c = await claim(client, row.id);
      await client.query(
        `insert into outbound_global_email_suppressions
          (recipient_hash,reason) values ($1,'UNSUBSCRIBED')`,
        [row.hash],
      );
      expect(await check(client, row.id, c.worker, c.fence, row.hash)).toBe(false);
      const state = await client.query(
        "select status,pre_send_authorized_fence from outbound_messages where id=$1",
        [row.id],
      );
      expect(state.rows[0]).toMatchObject({
        status: "SUPPRESSED", pre_send_authorized_fence: null,
      });
      const claimRecord = await client.query<{request_digest: string; attempts: number}>(
        "select request_digest,attempts from outbound_messages where id=$1", [row.id],
      );
      const send = vi.fn(async () => ({kind:"ACCEPTED" as const,providerMessageId:"not-sent"}));
      const intent = parseOutboundIntent({
        organizationId:SEED_IDS.organization, collegeId:SEED_IDS.collegeA,
        sourceEventId:randomUUID(),channel:"EMAIL",templateKey:"RECRUITER_INVITATION",
        recipient:"recipient@example.test",
        variables:{companyName:"Private Employer",collegeName:"College A",
          invitationUrl:"https://invite.example.test/join?token=TEST_DISPOSABLE"},
      });
      const outcome = await executeClaimedOutbound(
        {messageId:row.id,fence:c.fence,requestDigest:claimRecord.rows[0]!.request_digest},
        c.worker,{
          load:async()=>({intent,attempts:claimRecord.rows[0]!.attempts,globalEmailHash:row.hash}),
          authorize:async data => Boolean(await check(client,data.messageId,data.worker,data.fence,data.globalEmailHash)),
          send,
          complete:async()=>{throw new Error("A suppressed intent must never settle as sent");},
          now:()=>new Date(),
        },
      );
      expect(outcome).toBe("NOT_AUTHORIZED");
      expect(send).not.toHaveBeenCalled();
    });
  });

  it("applies a college/organization local block inserted after enqueue", async () => {
    await transaction(async (client) => {
      const row = await pending(client);
      const c = await claim(client, row.id);
      await client.query(
        `insert into outbound_suppressions
          (organization_id,channel,recipient_hash,reason)
         values ($1,'EMAIL',$2,'ADMIN_BLOCK')`,
        [SEED_IDS.organization, row.recipient],
      );
      expect(await check(client, row.id, c.worker, c.fence, row.hash)).toBe(false);
      expect(await complete(client, row.id, c.worker, c.fence)).toBe(false);
    });
  });
});
