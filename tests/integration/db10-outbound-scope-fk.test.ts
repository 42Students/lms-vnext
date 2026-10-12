import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { Pool, type PoolClient } from "pg";
import { SEED_IDS } from "../../scripts/db-seed-data";

/**
 * DB067 outbox tenant-scope integration witnesses. Requires Chat 1's approved
 * composite parent index + child FK to be registered and migrated first.
 * Not an active migration and not automatically run before activation.
 */
const enabled = process.env.DB10_OUTBOUND_SCOPE_FK_ENFORCED === "1";
const databaseUrl = enabled ? process.env.TEST_DATABASE_URL : undefined;
if (enabled) {
  if (!databaseUrl) throw new Error("DB10 scope FK requires explicit TEST_DATABASE_URL");
  const name = decodeURIComponent(new URL(databaseUrl).pathname.slice(1));
  if (!name.toLowerCase().endsWith("_test")) {
    throw new Error("DB10 scope FK refuses non-_test PostgreSQL database");
  }
}
const pool = enabled ? new Pool({ connectionString: databaseUrl, max: 2 }) : null;

async function withRollback(fn: (client: PoolClient) => Promise<void>) {
  if (!pool) throw new Error("DB10 scope FK PostgreSQL acceptance not enabled");
  const client = await pool.connect();
  let began = false;
  try {
    await client.query("BEGIN");
    began = true;
    await fn(client);
  } finally {
    try {
      if (began) await client.query("ROLLBACK");
    } finally {
      client.release();
    }
  }
}

async function newOrganization(client: PoolClient) {
  const id = randomUUID();
  await client.query(
    "insert into organizations (id, name, status) values ($1, $2, 'ACTIVE')",
    [id, `DB10 independent org ${id}`],
  );
  return id;
}

async function newCollege(client: PoolClient, organizationId: string) {
  const id = randomUUID();
  await client.query(
    "insert into colleges (id, organization_id, name, code) values ($1, $2, 'DB10 isolation', $3)",
    [id, organizationId, `db10-${id}`],
  );
  return id;
}

async function insertOutbound(
  client: PoolClient,
  organizationId: string,
  collegeId: string,
) {
  const id = randomUUID();
  await client.query(
    `insert into outbound_messages (
       id, organization_id, college_id, source_event_id,
       channel, template_key, recipient_hash, global_email_hash_commitment,
       idempotency_key, request_digest,
       key_id, nonce_base64, tag_base64, ciphertext_base64
     ) values (
       $1, $2, $3, $4,
       'EMAIL', 'RECRUITER_INVITATION', $5, $8, $6, $7,
       'db10-test-key', 'test-nonce', 'test-tag', 'test-ciphertext'
     )`,
    [
      id, organizationId, collegeId, randomUUID(),
      "a".repeat(64), randomUUID().replaceAll("-", "").padEnd(64, "0"),
      "b".repeat(64),
      "c".repeat(64), // deterministic, non-PII EMAIL commitment required by canonical table CHECK
    ],
  );
  return id;
}

describe.skipIf(!enabled)("DB10 outbox immutable organization-college ownership (disposable PostgreSQL)", () => {
  beforeAll(async () => {
    if (!pool) throw new Error("DB10 scope FK pool unavailable");
    const { rows } = await pool.query<{
      conname: string; convalidated: boolean; contype: string; definition: string;
    }>(
      `select conname, contype, convalidated, pg_get_constraintdef(oid) as definition
         from pg_constraint
        where conrelid = 'outbound_messages'::regclass
          and conname = 'db10_outbound_college_organization_fk'`,
    );
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ contype: "f", convalidated: true });
    expect(rows[0].definition).toMatch(
      /FOREIGN KEY \(college_id, organization_id\) REFERENCES colleges\(id, organization_id\)/i,
    );
    const { rows: target } = await pool.query(
      `select indexname from pg_indexes
        where tablename = 'colleges'
          and indexname = 'colleges_id_organization_uq'`,
    );
    expect(target).toHaveLength(1);

    // Composite ownership must strengthen, never replace, the original
    // single-column organization and college existence constraints.
    const { rows: originalFks } = await pool.query<{ definition: string }>(
      `select pg_get_constraintdef(oid) as definition
         from pg_constraint
        where conrelid = 'outbound_messages'::regclass
          and contype = 'f'`,
    );
    expect(originalFks.some(({ definition }) =>
      /FOREIGN KEY \(organization_id\) REFERENCES organizations\(id\)/i.test(definition),
    )).toBe(true);
    expect(originalFks.some(({ definition }) =>
      /FOREIGN KEY \(college_id\) REFERENCES colleges\(id\)/i.test(definition),
    )).toBe(true);
  });

  afterAll(async () => {
    await pool?.end();
  });

  it("allows a matching college-and-organization outbox row", async () => {
    await withRollback(async (client) => {
      const id = await insertOutbound(client, SEED_IDS.organization, SEED_IDS.collegeA);
      const { rows } = await client.query(
        "select organization_id, college_id from outbound_messages where id=$1",
        [id],
      );
      expect(rows[0]).toMatchObject({
        organization_id: SEED_IDS.organization,
        college_id: SEED_IDS.collegeA,
      });
    });
  });

  it("rejects a valid but foreign organization on INSERT", async () => {
    await withRollback(async (client) => {
      const wrongOrganizationId = await newOrganization(client);
      await expect(
        insertOutbound(client, wrongOrganizationId, SEED_IDS.collegeA),
      ).rejects.toMatchObject({
        code: "23503", constraint: "db10_outbound_college_organization_fk",
      });
    });
  });

  it("rejects UPDATE that swaps the organization", async () => {
    await withRollback(async (client) => {
      const id = await insertOutbound(client, SEED_IDS.organization, SEED_IDS.collegeA);
      const wrongOrganizationId = await newOrganization(client);
      await expect(client.query(
        "update outbound_messages set organization_id=$1 where id=$2",
        [wrongOrganizationId, id],
      )).rejects.toMatchObject({
        code: "23503", constraint: "db10_outbound_college_organization_fk",
      });
    });
  });

  it("rejects UPDATE that swaps the college", async () => {
    await withRollback(async (client) => {
      const id = await insertOutbound(client, SEED_IDS.organization, SEED_IDS.collegeA);
      const wrongOrganizationId = await newOrganization(client);
      const wrongCollegeId = await newCollege(client, wrongOrganizationId);
      await expect(client.query(
        "update outbound_messages set college_id=$1 where id=$2",
        [wrongCollegeId, id],
      )).rejects.toMatchObject({
        code: "23503", constraint: "db10_outbound_college_organization_fk",
      });
    });
  });

  it("rejects college ownership transfer while outbound rows reference it", async () => {
    await withRollback(async (client) => {
      const collegeId = await newCollege(client, SEED_IDS.organization);
      await insertOutbound(client, SEED_IDS.organization, collegeId);
      const newOwnerId = await newOrganization(client);
      await expect(client.query(
        "update colleges set organization_id=$1 where id=$2",
        [newOwnerId, collegeId],
      )).rejects.toMatchObject({ code: "23503" });
    });
  });
});
