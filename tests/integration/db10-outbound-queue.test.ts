import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { randomUUID } from "node:crypto";
import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import type { RequestContext } from "@/modules/identity/context";
import {
  queueOutboundDeliveryInTransaction,
  outboundQueueRuntimeEnabled,
} from "@/modules/operations/outbound-delivery-queue";
import {
  deriveGlobalEmailSuppressionHash,
  sealOutboundDelivery,
} from "@/modules/operations/outbound-delivery-envelope";
import { SEED_IDS } from "../../scripts/db-seed-data";

/**
 * Opt-in only; requires isolated DB seeded with W01-promoted outbound draft.
 * Do not run against production or mark as passing merely because it exists.
 */
if (process.env.DB10_ISOLATED_TEST_DATABASE !== "1") {
  throw new Error("DB10 outbound integration requires an isolated PostgreSQL database");
}
// These tests INSERT and DELETE rows. Never fall back to the application DB,
// including when the opt-in flag was enabled accidentally.
const url = process.env.TEST_DATABASE_URL;
if (!url) throw new Error("DB10 outbound integration requires explicit TEST_DATABASE_URL");
const target = new URL(url);
if (!["postgres:", "postgresql:"].includes(target.protocol) ||
    !decodeURIComponent(target.pathname.slice(1)).toLowerCase().endsWith("_test") ||
    !target.username || !target.hostname || target.search || target.hash) {
  throw new Error("DB10 integration refuses a non-disposable PostgreSQL target");
}
if (process.env.DATABASE_URL) {
  const app = new URL(process.env.DATABASE_URL);
  const canonical = (u: URL) =>
    `${u.hostname.toLowerCase()}:${u.port || "5432"}:${decodeURIComponent(u.pathname)}`;
  if (canonical(app) === canonical(target)) {
    throw new Error("DB10 integration refuses the application database target");
  }
}
const pool = new Pool({ connectionString: url, max: 2 });
// Use the *same validated disposable Pool* for both the queue writer and
// fixture cleanup: getDb() might otherwise use cached production DATABASE_URL.
const isolatedDb = drizzle(pool);
const queueInIsolatedDatabase = (context: RequestContext, raw: unknown) =>
  queueOutboundDeliveryInTransaction(isolatedDb, context, raw);
const key = Buffer.alloc(32, 77).toString("base64");
const globalKey = Buffer.alloc(32, 78).toString("base64");
const prevFlag = process.env.DB10_OUTBOUND_READY;
const prevKey = process.env.DB10_OUTBOUND_ENCRYPTION_KEY_BASE64;
const prevGlobalKey = process.env.DB10_GLOBAL_EMAIL_HMAC_KEY_BASE64;
const issuedEventIds: string[] = [];
const suppressionHashes: string[] = [];
const globalSuppressionHashes: string[] = [];

const adminA: RequestContext = {
  user: {
    id: SEED_IDS.collegeAdminUser,
    identityUid: "seed-college-admin",
    platformStatus: "ACTIVE", systemRoles: [],
  },
  membership: {
    id: SEED_IDS.collegeAdminMembership,
    organizationId: SEED_IDS.organization,
    collegeId: SEED_IDS.collegeA,
    status: "ACTIVE", roles: ["COLLEGE_ADMIN"],
  },
};

function intent(sourceEventId: string, overrides: Record<string, unknown> = {}) {
  return {
    organizationId: SEED_IDS.organization,
    collegeId: SEED_IDS.collegeA,
    sourceEventId,
    channel: "EMAIL",
    templateKey: "RECRUITER_INVITATION",
    recipient: "recruiting@private.example",
    variables: {
      companyName: "Private Employer",
      collegeName: "College A",
      invitationUrl: "https://invite.example.test/join?token=RAW_TOKEN_SHOULD_NEVER_PERSIST",
    },
    ...overrides,
  };
}
function issueId() {
  const id = randomUUID();
  issuedEventIds.push(id);
  return id;
}

beforeEach(async () => {
  process.env.DB10_OUTBOUND_READY = "DB10_VERIFIED";
  process.env.DB10_OUTBOUND_ENCRYPTION_KEY_BASE64 = key;
  process.env.DB10_GLOBAL_EMAIL_HMAC_KEY_BASE64 = globalKey;
  if (suppressionHashes.length) {
    await pool.query(
      "delete from outbound_suppressions where organization_id=$1 and recipient_hash=any($2::varchar[])",
      [SEED_IDS.organization, suppressionHashes.splice(0)],
    );
  }
  if (globalSuppressionHashes.length) {
    await pool.query(
      "delete from outbound_global_email_suppressions where recipient_hash=any($1::varchar[])",
      [globalSuppressionHashes.splice(0)],
    );
  }
  if (issuedEventIds.length) {
    await pool.query("delete from outbound_messages where source_event_id = any($1::uuid[])", [issuedEventIds.splice(0)]);
  }
});
afterAll(async () => {
  if (issuedEventIds.length) {
    await pool.query("delete from outbound_messages where source_event_id = any($1::uuid[])", [issuedEventIds]);
  }
  if (suppressionHashes.length) {
    await pool.query(
      "delete from outbound_suppressions where organization_id=$1 and recipient_hash=any($2::varchar[])",
      [SEED_IDS.organization, suppressionHashes],
    );
  }
  if (globalSuppressionHashes.length) {
    await pool.query(
      "delete from outbound_global_email_suppressions where recipient_hash=any($1::varchar[])",
      [globalSuppressionHashes],
    );
  }
  if (prevFlag === undefined) delete process.env.DB10_OUTBOUND_READY;
  else process.env.DB10_OUTBOUND_READY = prevFlag;
  if (prevKey === undefined) delete process.env.DB10_OUTBOUND_ENCRYPTION_KEY_BASE64;
  else process.env.DB10_OUTBOUND_ENCRYPTION_KEY_BASE64 = prevKey;
  if (prevGlobalKey === undefined) delete process.env.DB10_GLOBAL_EMAIL_HMAC_KEY_BASE64;
  else process.env.DB10_GLOBAL_EMAIL_HMAC_KEY_BASE64 = prevGlobalKey;
  await pool.end();
});

describe("W06 transactional outbound queue security", () => {
  it("rejects unapproved SMS and WhatsApp invitation commands before SQL", async () => {
    for (const channel of ["SMS", "WHATSAPP"]) {
      const sourceEventId = issueId();
      await expect(queueInIsolatedDatabase(adminA, intent(sourceEventId, {
        channel, recipient: "+919876543210",
      }))).rejects.toMatchObject({ code: "INVALID_OUTBOUND_INTENT" });
      const rows = await pool.query(
        "select id from outbound_messages where source_event_id=$1",
        [sourceEventId],
      );
      expect(rows.rowCount).toBe(0);
    }
  });

  it("enqueues ciphertext, returns QUEUED not sent, deduplicates retries", async () => {
    const sourceEventId = issueId();
    const result = await queueInIsolatedDatabase(adminA, intent(sourceEventId));
    expect(result.status).toBe("QUEUED");
    const repeat = await queueInIsolatedDatabase(adminA, intent(sourceEventId));
    expect(repeat).toEqual({ status: "ALREADY_QUEUED", id: result.id });
    const rows = await pool.query<{
      ciphertext_base64: string; idempotency_key: string; status: string;
    }>("select ciphertext_base64,idempotency_key,status from outbound_messages where source_event_id=$1", [sourceEventId]);
    expect(rows.rows).toHaveLength(1);
    expect(rows.rows[0]?.status).toBe("PENDING");
    expect(rows.rows[0]?.idempotency_key).toMatch(/^[0-9a-f]{64}$/);
    expect(rows.rows[0]?.ciphertext_base64).not.toContain("RAW_TOKEN");
    expect(JSON.stringify(rows.rows)).not.toContain("recruiting@private.example");
  });

  it("rejects reissued token on same source-event idempotency key", async () => {
    const sourceEventId = issueId();
    await queueInIsolatedDatabase(adminA, intent(sourceEventId));
    await expect(queueInIsolatedDatabase(adminA, intent(sourceEventId, {
      variables: {
        companyName: "Private Employer", collegeName: "College A",
        invitationUrl: "https://invite.example.test/join?token=CHANGED",
      },
    }))).rejects.toMatchObject({ code: "OUTBOUND_IDEMPOTENCY_CONFLICT" });
  });

  it("blocks cross-college send and persists no entry", async () => {
    const sourceEventId = issueId();
    await expect(queueInIsolatedDatabase(adminA, intent(sourceEventId, {
      collegeId: SEED_IDS.collegeB,
    }))).rejects.toBeTruthy();
    const rows = await pool.query(
      "select id from outbound_messages where source_event_id=$1", [sourceEventId],
    );
    expect(rows.rows).toHaveLength(0);
  });

  it("honors durable unsubscribe suppression for a new source event", async () => {
    const sourceEventId = issueId();
    const sealed = sealOutboundDelivery(intent(sourceEventId), key);
    suppressionHashes.push(sealed.recipientHash);
    await pool.query(
      "insert into outbound_suppressions (organization_id,channel,recipient_hash,reason) values ($1,'EMAIL',$2,'UNSUBSCRIBED')",
      [SEED_IDS.organization, sealed.recipientHash],
    );
    const queued = await queueInIsolatedDatabase(adminA, intent(sourceEventId));
    expect(queued).toEqual({ status: "SUPPRESSED", id: null });
  });

  it("globally suppresses an opted-out email without storing the raw address", async () => {
    const suppressedEvent = issueId();
    const recipientHash = deriveGlobalEmailSuppressionHash(intent(suppressedEvent), globalKey);
    expect(recipientHash).toMatch(/^[0-9a-f]{64}$/);
    globalSuppressionHashes.push(recipientHash!);
    await pool.query(
      "insert into outbound_global_email_suppressions (recipient_hash,reason) values ($1,'UNSUBSCRIBED')",
      [recipientHash],
    );
    const suppressed = await queueInIsolatedDatabase(adminA, intent(suppressedEvent));
    expect(suppressed).toEqual({ status: "SUPPRESSED", id: null });
    const nothingQueued = await pool.query(
      "select id from outbound_messages where source_event_id=$1",
      [suppressedEvent],
    );
    expect(nothingQueued.rowCount).toBe(0);

    // The privileged opt-out clear is deliberately a SQL test fixture action,
    // never an application API and never a provider send.
    await pool.query(
      "update outbound_global_email_suppressions set cleared_at=clock_timestamp() where recipient_hash=$1",
      [recipientHash],
    );
    const newEvent = issueId();
    expect((await queueInIsolatedDatabase(adminA, intent(newEvent))).status).toBe("QUEUED");
    const rows = await pool.query(
      "select global_email_hash_commitment,ciphertext_base64 from outbound_messages where source_event_id=$1",
      [newEvent],
    );
    expect(rows.rows).toHaveLength(1);
    expect(rows.rows[0]?.global_email_hash_commitment).toMatch(/^[0-9a-f]{64}$/);
    expect(rows.rows[0]?.global_email_hash_commitment).not.toBe(recipientHash);
    expect(JSON.stringify(rows.rows)).not.toContain("recruiting@private.example");
  });

  it("deduplicates concurrent same-event attempts through PostgreSQL uniqueness", async () => {
    const eventId = issueId();
    const results = await Promise.all(
      Array.from({ length: 10 }, () => queueInIsolatedDatabase(adminA, intent(eventId))),
    );
    expect(results.filter(x => x.status === "QUEUED")).toHaveLength(1);
    expect(results.filter(x => x.status === "ALREADY_QUEUED")).toHaveLength(9);
    expect(new Set(results.map(x => x.id)).size).toBe(1);
    const { rows } = await pool.query(
      "select count(*)::int as count from outbound_messages where source_event_id=$1",
      [eventId],
    );
    expect(rows[0]?.count).toBe(1);
  });

  it("commits distinct non-linkable EMAIL suppression bindings for distinct events", async () => {
    const firstEvent = issueId();
    const secondEvent = issueId();
    await queueInIsolatedDatabase(adminA, intent(firstEvent));
    await queueInIsolatedDatabase(adminA, intent(secondEvent));
    const { rows } = await pool.query<{ global_email_hash_commitment: string }>(
      "select global_email_hash_commitment from outbound_messages where source_event_id = any($1::uuid[])",
      [[firstEvent, secondEvent]],
    );
    expect(rows).toHaveLength(2);
    expect(rows[0]?.global_email_hash_commitment).not.toBe(rows[1]?.global_email_hash_commitment);
    expect(rows.every(row => /^[0-9a-f]{64}$/.test(row.global_email_hash_commitment))).toBe(true);
  });

  it("fails closed when queue flag is not verified", async () => {
    const sourceEventId = issueId();
    delete process.env.DB10_OUTBOUND_READY;
    expect(outboundQueueRuntimeEnabled()).toBe(false);
    await expect(queueInIsolatedDatabase(adminA, intent(sourceEventId)))
      .rejects.toMatchObject({ code: "OUTBOUND_QUEUE_DISABLED" });
  });
});
