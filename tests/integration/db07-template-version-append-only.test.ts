import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { Pool, type PoolClient } from "pg";
import { SEED_IDS } from "../../scripts/db-seed-data";

/**
 * DB-070 -- opt-in acceptance ONLY after append-only staging is promoted.
 * Running normal test:db on a registered schema without this migration must
 * NOT falsely count these cases as passing.
 */
const enabled = process.env.DB07_TEMPLATE_VERSION_APPEND_ONLY === "1";
const url = enabled ? process.env.TEST_DATABASE_URL : undefined;
if (enabled) {
  if (!url) throw new Error("DB070 requires explicit TEST_DATABASE_URL");
  const databaseName = decodeURIComponent(new URL(url).pathname.slice(1));
  if (!databaseName.toLowerCase().endsWith("_test")) {
    throw new Error("DB070 refuses to touch a non-_test PostgreSQL database");
  }
}
const pool = enabled ? new Pool({ connectionString: url, max: 2 }) : null;

type RevisionFixture = {
  client: PoolClient;
  templateId: string;
  versionId: string;
};

async function withVersion(run: (fixture: RevisionFixture) => Promise<void>) {
  if (!pool) throw new Error("DB070 must be explicitly enabled");
  const client = await pool.connect();
  let began = false;
  try {
    await client.query("BEGIN");
    began = true;
    const templateId = randomUUID();
    const versionId = randomUUID();
    await client.query(
      `insert into project_templates
         (id, slug, title, created_by_user_id)
       values ($1, $2, 'DB070 parent template', $3)`,
      [templateId, `db070-${templateId}`, SEED_IDS.superAdminUser],
    );
    await client.query(
      `insert into project_template_versions
         (id, template_id, version, title, blueprint, created_by_user_id)
       values ($1, $2, 1, 'DB070 first version', '{}'::jsonb, $3)`,
      [versionId, templateId, SEED_IDS.superAdminUser],
    );
    await run({ client, templateId, versionId });
  } finally {
    try {
      if (began) await client.query("ROLLBACK");
    } finally {
      client.release();
    }
  }
}

describe.skipIf(!enabled)("DB070 immutable project template versions (opt-in PostgreSQL)", () => {
  beforeAll(async () => {
    if (!pool) throw new Error("DB070 pool unavailable");
    const result = await pool.query<{
      tgname: string;
      tgenabled: string;
      proname: string;
      trigger_def: string;
    }>(
      `select tg.tgname, tg.tgenabled, proc.proname,
              pg_get_triggerdef(tg.oid) as trigger_def
         from pg_trigger tg
         join pg_proc proc on proc.oid = tg.tgfoid
        where tg.tgrelid = 'project_template_versions'::regclass
          and tg.tgname in (
            'db07_project_template_versions_append_only',
            'db07_project_template_versions_no_truncate'
          )
          and not tgisinternal`,
    );
    expect(result.rows).toHaveLength(2);
    const rowGuard = result.rows.find(row => row.tgname === "db07_project_template_versions_append_only");
    const truncateGuard = result.rows.find(row => row.tgname === "db07_project_template_versions_no_truncate");
    expect(rowGuard).toBeDefined();
    expect(truncateGuard).toBeDefined();
    for (const row of result.rows) {
      expect(row.tgenabled).toBe("O");
      expect(row.proname).toBe("db07_deny_template_version_mutation");
    }
    expect(rowGuard?.trigger_def).toMatch(/BEFORE (?:UPDATE OR DELETE|DELETE OR UPDATE)/);
    expect(truncateGuard?.trigger_def).toMatch(/BEFORE TRUNCATE/);
    expect(truncateGuard?.trigger_def).toMatch(/FOR EACH STATEMENT/);
  });

  afterAll(async () => {
    if (pool) await pool.end();
  });

  it("accepts append of version two while version one remains unchanged", async () => {
    await withVersion(async ({ client, templateId, versionId }) => {
      const second = randomUUID();
      await client.query(
        `insert into project_template_versions
           (id, template_id, version, title, blueprint, created_by_user_id)
         values ($1, $2, 2, 'DB070 v2', '{"new":true}'::jsonb, $3)`,
        [second, templateId, SEED_IDS.superAdminUser],
      );
      const rows = await client.query(
        "select id, version, title from project_template_versions where template_id = $1 order by version",
        [templateId],
      );
      expect(rows.rows).toMatchObject([
        { id: versionId, version: 1, title: "DB070 first version" },
        { id: second, version: 2, title: "DB070 v2" },
      ]);
    });
  });

  it("rejects direct title UPDATE on a historical version", async () => {
    await withVersion(async ({ client, versionId }) => {
      await expect(client.query(
        "update project_template_versions set title = 'tampered' where id = $1",
        [versionId],
      )).rejects.toMatchObject({ code: "23514" });
    });
  });

  it("rejects direct blueprint JSON rewrite", async () => {
    await withVersion(async ({ client, versionId }) => {
      await expect(client.query(
        `update project_template_versions set blueprint = '{"edited":true}'::jsonb where id = $1`,
        [versionId],
      )).rejects.toMatchObject({ code: "23514" });
    });
  });

  it("rejects changing a version's owner template identifier", async () => {
    await withVersion(async ({ client, versionId }) => {
      await expect(client.query(
        "update project_template_versions set template_id = $1 where id = $2",
        [randomUUID(), versionId],
      )).rejects.toMatchObject({ code: "23514" });
    });
  });

  it("rejects renumbering an existing historical version", async () => {
    await withVersion(async ({ client, versionId }) => {
      await expect(client.query(
        "update project_template_versions set version = 7 where id = $1",
        [versionId],
      )).rejects.toMatchObject({ code: "23514" });
    });
  });

  it("rejects deleting an unreferenced version even without child foreign keys", async () => {
    await withVersion(async ({ client, versionId }) => {
      await expect(client.query(
        "delete from project_template_versions where id = $1",
        [versionId],
      )).rejects.toMatchObject({ code: "23514" });
    });
  });

  it("rejects TRUNCATE CASCADE with the immutable statement trigger, not a pending FK event", async () => {
    if (!pool) throw new Error("DB070 PostgreSQL pool unavailable");
    // No fixture inserts before TRUNCATE: pending DEFERRABLE FK events
    // otherwise reject the statement before our immutable-history trigger runs.
    // This transaction is strictly rollback-only even if the trigger regresses.
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      await expect(client.query("TRUNCATE TABLE project_template_versions CASCADE"))
        .rejects.toMatchObject({ code: "23514", message: expect.stringContaining("immutable (TRUNCATE)") });
    } finally {
      try {
        await client.query("ROLLBACK");
      } finally {
        client.release();
      }
    }
  });

  it("leaves the mutable project template header writable", async () => {
    await withVersion(async ({ client, templateId }) => {
      const updated = await client.query(
        "update project_templates set title = 'New header' where id = $1 returning title",
        [templateId],
      );
      expect(updated.rows[0].title).toBe("New header");
    });
  });

  it("does not silently permit deleting a version referenced by a college assignment", async () => {
    await withVersion(async ({ client, templateId, versionId }) => {
      await client.query(
        `insert into project_template_college_assignments
           (id, template_id, template_version_id, college_id, assigned_by_user_id)
         values ($1, $2, $3, $4, $5)`,
        [randomUUID(), templateId, versionId, SEED_IDS.collegeA, SEED_IDS.superAdminUser],
      );
      await expect(client.query(
        "delete from project_template_versions where id = $1",
        [versionId],
      )).rejects.toMatchObject({ code: "23514" });
    });
  });
});
