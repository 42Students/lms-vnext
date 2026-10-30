import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { Pool, type PoolClient } from "pg";
import { SEED_IDS } from "../../scripts/db-seed-data";

/**
 * DB-071: opt-in, rollback-only PostgreSQL evidence for deferred template
 * current_version / published_version composite parent keys.
 * Requires promoted constraints on a disposable seeded *_test database.
 */
const enabled = process.env.DB07_TEMPLATE_POINTER_FKS_ENFORCED === "1";
const databaseUrl = enabled ? process.env.TEST_DATABASE_URL : undefined;
if (enabled) {
  if (!databaseUrl) throw new Error("DB071 needs explicit TEST_DATABASE_URL");
  const dbName = decodeURIComponent(new URL(databaseUrl).pathname.slice(1));
  if (!dbName.toLowerCase().endsWith("_test")) {
    throw new Error("DB071 refuses non-_test PostgreSQL database");
  }
}

const pool = enabled ? new Pool({ connectionString: databaseUrl, max: 2 }) : null;

type TemplatePair = {
  client: PoolClient;
  templateA: string;
  templateB: string;
};

async function addVersion(client: PoolClient, templateId: string, version: number) {
  const id = randomUUID();
  await client.query(
    `insert into project_template_versions
       (id, template_id, version, title, blueprint, created_by_user_id)
     values ($1, $2, $3, $4, '{}'::jsonb, $5)`,
    [id, templateId, version, `DB071 version ${version}`, SEED_IDS.superAdminUser],
  );
  return id;
}

async function withTransaction(fn: (client: PoolClient) => Promise<void>) {
  if (!pool) throw new Error("DB071 explicit PostgreSQL acceptance is disabled");
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

async function withPair(fn: (fixture: TemplatePair) => Promise<void>) {
  await withTransaction(async (client) => {
    const templateA = randomUUID();
    const templateB = randomUUID();
    await client.query(
      `insert into project_templates (id, slug, title, created_by_user_id)
       values ($1, $3, 'DB071 A', $5), ($2, $4, 'DB071 B', $5)`,
      [
        templateA,
        templateB,
        `db071-a-${templateA}`,
        `db071-b-${templateB}`,
        SEED_IDS.superAdminUser,
      ],
    );
    await addVersion(client, templateA, 1);
    await addVersion(client, templateB, 1);
    await fn({ client, templateA, templateB });
  });
}

describe.skipIf(!enabled)("DB071 deferrable template version pointers (disposable PostgreSQL)", () => {
  beforeAll(async () => {
    if (!pool) throw new Error("DB071 pool missing");
    const result = await pool.query<{
      conname: string;
      contype: string;
      condeferrable: boolean;
      condeferred: boolean;
      convalidated: boolean;
      definition: string;
    }>(
      `select conname, contype, condeferrable, condeferred, convalidated,
              pg_get_constraintdef(oid) as definition
         from pg_constraint
        where conrelid = 'project_templates'::regclass
          and conname = any($1::text[])`,
      [[
        "project_templates_current_version_snapshot_fk",
        "project_templates_published_version_snapshot_fk",
      ]],
    );
    expect(result.rows).toHaveLength(2);
    expect(new Set(result.rows.map((row) => row.conname))).toEqual(
      new Set([
        "project_templates_current_version_snapshot_fk",
        "project_templates_published_version_snapshot_fk",
      ]),
    );
    for (const row of result.rows) {
      expect(row.contype).toBe("f");
      expect(row.condeferrable).toBe(true);
      expect(row.condeferred).toBe(true);
      expect(row.convalidated).toBe(true);
      expect(row.definition).toMatch(/REFERENCES project_template_versions\(template_id, version\)/);
    }
  });

  afterAll(async () => {
    if (pool) await pool.end();
  });

  it("allows parent-first creation when revision one arrives before deferred check", async () => {
    await withTransaction(async (client) => {
      const id = randomUUID();
      await client.query(
        `insert into project_templates (id, slug, title, created_by_user_id)
         values ($1, $2, 'Parent first', $3)`,
        [id, `db071-parent-${id}`, SEED_IDS.superAdminUser],
      );
      await addVersion(client, id, 1);
      await expect(client.query("SET CONSTRAINTS ALL IMMEDIATE")).resolves.toBeDefined();
    });
  });

  it("rejects parent creation with no corresponding current version at deferred boundary", async () => {
    await withTransaction(async (client) => {
      const id = randomUUID();
      await client.query(
        `insert into project_templates (id, slug, title, created_by_user_id)
         values ($1, $2, 'Missing version', $3)`,
        [id, `db071-missing-${id}`, SEED_IDS.superAdminUser],
      );
      await expect(client.query("SET CONSTRAINTS ALL IMMEDIATE")).rejects.toMatchObject({
        code: "23503",
        constraint: "project_templates_current_version_snapshot_fk",
      });
    });
  });

  it("allows revise-header-first then append snapshot version two", async () => {
    await withPair(async ({ client, templateA }) => {
      await client.query(
        "update project_templates set current_version = 2 where id = $1",
        [templateA],
      );
      await addVersion(client, templateA, 2);
      await expect(client.query("SET CONSTRAINTS ALL IMMEDIATE")).resolves.toBeDefined();
    });
  });

  it("allows header-first publication when the owned snapshot arrives before commit", async () => {
    await withPair(async ({ client, templateA }) => {
      await client.query(
        "update project_templates set current_version = 2, published_version = 2 where id = $1",
        [templateA],
      );
      await addVersion(client, templateA, 2);
      await expect(client.query("SET CONSTRAINTS ALL IMMEDIATE")).resolves.toBeDefined();
      const result = await client.query(
        "select current_version, published_version from project_templates where id = $1",
        [templateA],
      );
      expect(result.rows[0]).toMatchObject({ current_version: 2, published_version: 2 });
    });
  });

  it("rejects incrementing current_version without appending owned revision", async () => {
    await withPair(async ({ client, templateA }) => {
      await client.query(
        "update project_templates set current_version = 2 where id = $1",
        [templateA],
      );
      await expect(client.query("SET CONSTRAINTS ALL IMMEDIATE")).rejects.toMatchObject({
        code: "23503",
        constraint: "project_templates_current_version_snapshot_fk",
      });
    });
  });

  it("rejects a current revision existing under a different template only", async () => {
    await withPair(async ({ client, templateA, templateB }) => {
      await addVersion(client, templateB, 2);
      await client.query(
        "update project_templates set current_version = 2 where id = $1",
        [templateA],
      );
      await expect(client.query("SET CONSTRAINTS ALL IMMEDIATE")).rejects.toMatchObject({
        code: "23503",
        constraint: "project_templates_current_version_snapshot_fk",
      });
    });
  });

  it("rejects published revision two when only the other template owns it", async () => {
    await withPair(async ({ client, templateA, templateB }) => {
      await addVersion(client, templateA, 3);
      await addVersion(client, templateB, 2);
      await client.query(
        "update project_templates set current_version = 3, published_version = 2 where id = $1",
        [templateA],
      );
      await expect(client.query("SET CONSTRAINTS ALL IMMEDIATE")).rejects.toMatchObject({
        code: "23503",
        constraint: "project_templates_published_version_snapshot_fk",
      });
    });
  });

  it("permits publishing an owned revision and subsequently clearing it", async () => {
    await withPair(async ({ client, templateA }) => {
      await client.query(
        "update project_templates set published_version = 1 where id = $1",
        [templateA],
      );
      await client.query("SET CONSTRAINTS ALL IMMEDIATE");
      await client.query(
        "update project_templates set published_version = null where id = $1",
        [templateA],
      );
      const result = await client.query(
        "select published_version from project_templates where id = $1",
        [templateA],
      );
      expect(result.rows[0].published_version).toBeNull();
    });
  });
});
