import { randomUUID } from "node:crypto";
import { afterAll, describe, expect, it } from "vitest";
import { Pool, type PoolClient } from "pg";
import { SEED_IDS } from "../../scripts/db-seed-data";

/**
 * DB-004 / Chat 2. Negative relational identity witnesses for the registered
 * PostgreSQL schema, not certification of legacy field/behavior parity.
 *
 * TEST_DATABASE_URL must refer to a disposable database that has already
 * received db:test:prepare (including deterministic seed identities).
 * All writes are rolled back; each failing statement aborts its transaction.
 */
const connectionString = process.env.TEST_DATABASE_URL;
if (!connectionString) {
  throw new Error("DB01 FK witnesses require explicit TEST_DATABASE_URL");
}

const pool = new Pool({ connectionString, max: 1 });

async function inRollbackTransaction(
  run: (client: PoolClient) => Promise<void>,
): Promise<void> {
  const client = await pool.connect();
  let began = false;
  try {
    await client.query("BEGIN");
    began = true;
    await run(client);
  } finally {
    try {
      if (began) await client.query("ROLLBACK");
    } finally {
      client.release();
    }
  }
}

afterAll(async () => {
  await pool.end();
});

describe("DB01 PostgreSQL identity references and uniqueness", () => {
  it("rejects membership for an unknown canonical user", async () => {
    await inRollbackTransaction(async (client) => {
      await expect(client.query(
        "insert into college_memberships (user_id, college_id) values ($1, $2)",
        [randomUUID(), SEED_IDS.collegeA],
      )).rejects.toMatchObject({ code: "23503" });
    });
  });

  it("rejects membership for a non-existent tenant college", async () => {
    await inRollbackTransaction(async (client) => {
      await expect(client.query(
        "insert into college_memberships (user_id, college_id) values ($1, $2)",
        [SEED_IDS.learnerUser, randomUUID()],
      )).rejects.toMatchObject({ code: "23503" });
    });
  });

  it("rejects a role grant to a non-existent membership", async () => {
    await inRollbackTransaction(async (client) => {
      await expect(client.query(
        "insert into membership_roles (membership_id, role) values ($1, 'LEARNER')",
        [randomUUID()],
      )).rejects.toMatchObject({ code: "23503" });
    });
  });

  it("rejects a custom host bound to a non-existent college", async () => {
    await inRollbackTransaction(async (client) => {
      await expect(client.query(
        "insert into tenant_domains (college_id, host) values ($1, $2)",
        [randomUUID(), `db01-orphan-${randomUUID()}.example.test`],
      )).rejects.toMatchObject({ code: "23503" });
    });
  });

  it("rejects a duplicate Identity Platform UID even with a different user id", async () => {
    await inRollbackTransaction(async (client) => {
      await expect(client.query(
        "insert into users (id, identity_uid) values ($1, $2)",
        [randomUUID(), "seed-college-admin"],
      )).rejects.toMatchObject({ code: "23505" });
    });
  });

  it("enforces case-insensitive canonical email uniqueness", async () => {
    await inRollbackTransaction(async (client) => {
      await expect(client.query(
        "insert into users (id, identity_uid, email) values ($1, $2, $3)",
        [randomUUID(), `db01-email-${randomUUID()}`, "COLLEGEADMIN.SEED@EXAMPLE.COM"],
      )).rejects.toMatchObject({
        code: "23505",
        constraint: "users_email_ci_uq",
      });
    });
  });

  it("rejects a duplicate canonical E.164 phone", async () => {
    await inRollbackTransaction(async (client) => {
      await expect(client.query(
        "insert into users (id, identity_uid, phone_e164) values ($1, $2, $3)",
        [randomUUID(), `db01-phone-${randomUUID()}`, "+919000000002"],
      )).rejects.toMatchObject({ code: "23505" });
    });
  });

  it("rejects a duplicate system-wide role grant", async () => {
    await inRollbackTransaction(async (client) => {
      await expect(client.query(
        "insert into system_roles (user_id, role) values ($1, 'SUPER_ADMIN')",
        [SEED_IDS.superAdminUser],
      )).rejects.toMatchObject({
        code: "23505",
        constraint: "system_roles_user_role_uq",
      });
    });
  });

  it("preserves the valid positive case of one user belonging to two colleges", async () => {
    await inRollbackTransaction(async (client) => {
      const rows = await client.query<{ college_id: string }>(
        "select college_id from college_memberships where user_id = $1",
        [SEED_IDS.facultyUser],
      );
      expect(new Set(rows.rows.map((row) => row.college_id))).toEqual(
        new Set([SEED_IDS.collegeA, SEED_IDS.collegeB]),
      );
    });
  });
});
