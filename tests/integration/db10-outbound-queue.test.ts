import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { randomUUID } from "node:crypto";
import { Pool } from "pg";
import { closeDatabaseConnection } from "@/db/client";
import type { RequestContext } from "@/modules/identity/context";
import {
  queueOutboundDelivery,
  outboundQueueRuntimeEnabled,
} from "@/modules/operations/outbound-delivery-queue";
import { sealOutboundDelivery } from "@/modules/operations/outbound-delivery-envelope";
import { SEED_IDS } from "../../scripts/db-seed-data";

/**
 * Opt-in only; requires isolated DB seeded with W01-promoted outbound draft.
 * Do not run against production or mark as passing merely because it exists.
 */
if (process.env.DB10_ISOLATED_TEST_DATABASE !== "1") {
  throw new Error("DB10 outbound integration requires an isolated PostgreSQL database");
}
const url = process.env.TEST_DATABASE_URL ?? process.env.DATABASE_URL;
if (!url) throw new Error("DB10 outbound integration requires TEST_DATABASE_URL");
const pool = new Pool({ connectionString: url, max: 2 });
const key = Buffer.alloc(32, 77).toString("base64");
const prevFlag = process.env.DB10_OUTBOUND_READY;
const prevKey = process.env.DB10_OUTBOUND_ENCRYPTION_KEY_BASE64;
const issuedEventIds: string[] = [];
const suppressionHashes: string[] = [];

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
  if (suppressionHashes.length) {
    await pool.query(
      "delete from outbound_suppressions where organization_id=$1 and recipient_hash=any($2::varchar[])",
      [SEED_IDS.organization, suppressionHashes.splice(0)],
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
  if (prevFlag === undefined) delete process.env.DB10_OUTBOUND_READY;
  else process.env.DB10_OUTBOUND_READY = prevFlag;
  if (prevKey === undefined) delete process.env.DB10_OUTBOUND_ENCRYPTION_KEY_BASE64;
  else process.env.DB10_OUTBOUND_ENCRYPTION_KEY_BASE64 = prevKey;
  await pool.end();
  await closeDatabaseConnection();
});

describe("W06 transactional outbound queue security", () => {
  it("enqueues ciphertext, returns QUEUED not sent, deduplicates retries", async () => {
    const sourceEventId = issueId();
    const result = await queueOutboundDelivery(adminA, intent(sourceEventId));
    expect(result.status).toBe("QUEUED");
    const repeat = await queueOutboundDelivery(adminA, intent(sourceEventId));
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
    await queueOutboundDelivery(adminA, intent(sourceEventId));
    await expect(queueOutboundDelivery(adminA, intent(sourceEventId, {
      variables: {
        companyName: "Private Employer", collegeName: "College A",
        invitationUrl: "https://invite.example.test/join?token=CHANGED",
      },
    }))).rejects.toMatchObject({ code: "OUTBOUND_IDEMPOTENCY_CONFLICT" });
  });

  it("blocks cross-college send and persists no entry", async () => {
    const sourceEventId = issueId();
    await expect(queueOutboundDelivery(adminA, intent(sourceEventId, {
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
    const queued = await queueOutboundDelivery(adminA, intent(sourceEventId));
    expect(queued).toEqual({ status: "SUPPRESSED", id: null });
  });

  it("fails closed when queue flag is not verified", async () => {
    const sourceEventId = issueId();
    delete process.env.DB10_OUTBOUND_READY;
    expect(outboundQueueRuntimeEnabled()).toBe(false);
    await expect(queueOutboundDelivery(adminA, intent(sourceEventId)))
      .rejects.toMatchObject({ code: "OUTBOUND_QUEUE_DISABLED" });
  });
});
