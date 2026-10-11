import { randomUUID } from "node:crypto";
import { afterAll, describe, expect, it } from "vitest";
import { Pool, type PoolClient } from "pg";
import { SEED_IDS } from "../../scripts/db-seed-data";

/**
 * Chat 2 / DB-004. Schema-level identity and tenant lifecycle witnesses
 * against the *registered* vNext migration, not legacy behavioral parity.
 *
 * Run after an explicit disposable TEST_DATABASE_URL has been migrated/seeded.
 * Each test uses a separate transaction and always ROLLBACKs. PostgreSQL
 * constraints are asserted by SQLSTATE, never by localized error messages.
 */
const databaseUrl = process.env.TEST_DATABASE_URL;
if (!databaseUrl) {
  throw new Error("DB01 core-structure tests require explicit TEST_DATABASE_URL");
}
const pool = new Pool({ connectionString: databaseUrl, max: 1 });

async function rollbackOnly(run: (client: PoolClient) => Promise<void>) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    try {
      await run(client);
    } finally {
      await client.query("ROLLBACK");
    }
  } finally {
    client.release();
  }
}

afterAll(async () => {
  await pool.end();
});

describe("DB01 organization, college and identity lifecycle constraints", () => {
  it("rejects case-insensitive collisions between ACTIVE organization names", async () => {
    await rollbackOnly(async (client) => {
      const name = `DB01 Org ${randomUUID()}`;
      await client.query("insert into organizations (name, status) values ($1, 'ACTIVE')", [name]);
      await expect(client.query(
        "insert into organizations (name, status) values ($1, 'ACTIVE')",
        [name.toUpperCase()],
      )).rejects.toMatchObject({
        code: "23505",
        constraint: "organizations_active_name_uq",
      });
    });
  });

  it("allows an ARCHIVED organization name to coexist with an ACTIVE one", async () => {
    await rollbackOnly(async (client) => {
      const name = `DB01 archived ${randomUUID()}`;
      await client.query("insert into organizations (name, status) values ($1, 'ACTIVE')", [name]);
      const archived = await client.query(
        "insert into organizations (name, status) values ($1, 'ARCHIVED') returning id",
        [name.toUpperCase()],
      );
      expect(archived.rowCount).toBe(1);
    });
  });

  it("rejects reactivation of an ARCHIVED organization whose name is now taken", async () => {
    await rollbackOnly(async (client) => {
      const name = `DB01 Org Reactivation ${randomUUID()}`;
      const archived = await client.query<{ id: string }>(
        "insert into organizations (name, status) values ($1, 'ARCHIVED') returning id",
        [name],
      );
      await client.query("insert into organizations (name, status) values ($1, 'ACTIVE')", [name]);
      await expect(client.query(
        "update organizations set status = 'ACTIVE' where id = $1",
        [archived.rows[0]!.id],
      )).rejects.toMatchObject({
        code: "23505",
        constraint: "organizations_active_name_uq",
      });
    });
  });

  it("rejects a college attached to an unknown organization", async () => {
    await rollbackOnly(async (client) => {
      await expect(client.query(
        "insert into colleges (organization_id, name, code) values ($1, $2, $3)",
        [randomUUID(), "Orphaned College", `ORPHAN-${randomUUID()}`],
      )).rejects.toMatchObject({ code: "23503" });
    });
  });

  it("enforces college code uniqueness ignoring case across the whole platform", async () => {
    await rollbackOnly(async (client) => {
      await expect(client.query(
        "insert into colleges (organization_id, name, code) values ($1, $2, $3)",
        [SEED_IDS.organization, "Duplicate Code College", "seed-a"],
      )).rejects.toMatchObject({ code: "23505", constraint: "colleges_code_uq" });
    });
  });

  it("does not silently release a college code merely because it is ARCHIVED", async () => {
    await rollbackOnly(async (client) => {
      await expect(client.query(
        "insert into colleges (organization_id, name, code, status) values ($1, $2, $3, 'ARCHIVED')",
        [SEED_IDS.organization, "Archived Code College", "SEED-A"],
      )).rejects.toMatchObject({ code: "23505", constraint: "colleges_code_uq" });
    });
  });

  it("allows a distinct college to share a display name when its code is different", async () => {
    await rollbackOnly(async (client) => {
      const added = await client.query(
        "insert into colleges (organization_id, name, code) values ($1, $2, $3) returning id",
        [SEED_IDS.organization, "Seed College A", `DB01-${randomUUID()}`],
      );
      expect(added.rowCount).toBe(1);
    });
  });

  it("cannot delete an organization while colleges still reference it", async () => {
    await rollbackOnly(async (client) => {
      await expect(client.query(
        "delete from organizations where id = $1",
        [SEED_IDS.organization],
      )).rejects.toMatchObject({ code: "23503" });
    });
  });

  it("cannot delete a college with existing canonical memberships", async () => {
    await rollbackOnly(async (client) => {
      await expect(client.query(
        "delete from colleges where id = $1",
        [SEED_IDS.collegeA],
      )).rejects.toMatchObject({ code: "23503" });
    });
  });

  it("requires a non-null Identity Platform UID for every canonical user", async () => {
    await rollbackOnly(async (client) => {
      await expect(client.query(
        "insert into users (id, identity_uid) values ($1, NULL)",
        [randomUUID()],
      )).rejects.toMatchObject({ code: "23502" });
    });
  });

  it("permits two new canonical identities to have no email", async () => {
    await rollbackOnly(async (client) => {
      const one = randomUUID(), two = randomUUID();
      const inserted = await client.query(
        "insert into users (identity_uid, email) values ($1, NULL), ($2, NULL) returning id",
        [`db01-noemail-${one}`, `db01-noemail-${two}`],
      );
      expect(inserted.rowCount).toBe(2);
    });
  });

  it("does not promote an unverified domain to primary through UPDATE", async () => {
    await rollbackOnly(async (client) => {
      const host = `db01-unverified-${randomUUID()}.example.test`;
      const created = await client.query<{ id: string }>(
        "insert into tenant_domains (college_id, host, is_verified, is_primary) values ($1, $2, false, false) returning id",
        [SEED_IDS.collegeA, host],
      );
      await expect(client.query(
        "update tenant_domains set is_primary = true where id = $1",
        [created.rows[0]!.id],
      )).rejects.toMatchObject({
        code: "23514",
        constraint: "tenant_domains_primary_verified_ck",
      });
    });
  });
});
