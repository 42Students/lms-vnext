import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { Pool, type PoolClient } from "pg";
import { SEED_IDS } from "../../scripts/db-seed-data";

/**
 * DB-068: opt-in direct PostgreSQL acceptance for candidate composite FKs.
 * Currently UNREGISTERED: the suite must SKIP until the migration integrator
 * applies and verifies the candidate on an isolated disposable database.
 *
 * This suite requires:
 *   DB07_TEMPLATE_SCOPE_ENFORCED=1
 *   TEST_DATABASE_URL=postgresql://.../<disposable>_test
 *
 * Never use DATABASE_URL as an implicit fallback.
 */
const enabled = process.env.DB07_TEMPLATE_SCOPE_ENFORCED === "1";
const url = enabled ? process.env.TEST_DATABASE_URL : undefined;
if (enabled) {
  if (!url) {
    throw new Error("DB068 PG acceptance requires explicit TEST_DATABASE_URL");
  }
  const databaseName = decodeURIComponent(new URL(url).pathname.slice(1));
  if (!databaseName.toLowerCase().endsWith("_test")) {
    throw new Error("DB068 PG acceptance refuses non-_test database target");
  }
}

const pool = enabled ? new Pool({ connectionString: url, max: 2 }) : null;

type Fixture = {
  client: PoolClient;
  templateA: string;
  templateB: string;
  versionA1: string;
  versionA2: string;
  versionB1: string;
};

async function withFixture(fn: (fixture: Fixture) => Promise<void>) {
  if (!pool) {
    throw new Error("DB068 PostgreSQL suite was not explicitly enabled");
  }
  const client = await pool.connect();
  let began = false;
  try {
    await client.query("BEGIN");
    began = true;
    const templateA = randomUUID();
    const templateB = randomUUID();
    const versionA1 = randomUUID();
    const versionA2 = randomUUID();
    const versionB1 = randomUUID();
    const slugA = `db068-a-${templateA}`;
    const slugB = `db068-b-${templateB}`;
    await client.query(
      `insert into project_templates (id, slug, title, created_by_user_id)
       values ($1, $3, 'Template A', $5), ($2, $4, 'Template B', $5)`,
      [templateA, templateB, slugA, slugB, SEED_IDS.superAdminUser],
    );
    await client.query(
      `insert into project_template_versions
         (id, template_id, version, title, blueprint, created_by_user_id)
       values
         ($1, $4, 1, 'A v1', '{}'::jsonb, $6),
         ($2, $4, 2, 'A v2', '{}'::jsonb, $6),
         ($3, $5, 1, 'B v1', '{}'::jsonb, $6)`,
      [versionA1, versionA2, versionB1, templateA, templateB, SEED_IDS.superAdminUser],
    );
    await fn({ client, templateA, templateB, versionA1, versionA2, versionB1 });
  } finally {
    try {
      if (began) await client.query("ROLLBACK");
    } finally {
      client.release();
    }
  }
}

async function createAssignment(
  fixture: Fixture,
  templateId: string,
  templateVersionId: string,
) {
  return fixture.client.query(
    `insert into project_template_college_assignments
       (id, template_id, template_version_id, college_id, assigned_by_user_id)
     values ($1, $2, $3, $4, $5)
     returning id`,
    [
      randomUUID(),
      templateId,
      templateVersionId,
      SEED_IDS.collegeA,
      SEED_IDS.superAdminUser,
    ],
  );
}

async function createInstance(
  fixture: Fixture,
  templateId: string,
  templateVersionId: string,
) {
  const id = randomUUID();
  return fixture.client.query(
    `insert into project_instances
       (id, college_id, template_id, template_version_id,
        slug, title, created_by_user_id)
     values ($1, $2, $3, $4, $5, 'DB068 fixture', $6)
     returning id`,
    [
      id,
      SEED_IDS.collegeA,
      templateId,
      templateVersionId,
      `db068-project-${id}`,
      SEED_IDS.superAdminUser,
    ],
  );
}

describe.skipIf(!enabled)("DB068 template-version parent composite FKs (disposable PostgreSQL)", () => {
  beforeAll(async () => {
    if (!pool) throw new Error("DB068 PostgreSQL pool not configured");
    const result = await pool.query<{ conname: string }>(
      `select conname from pg_constraint
       where conname = any($1::text[])`,
      [[
        "project_template_assignments_template_version_owner_fk",
        "project_instances_template_version_owner_fk",
      ]],
    );
    expect(new Set(result.rows.map((row) => row.conname))).toEqual(
      new Set([
        "project_template_assignments_template_version_owner_fk",
        "project_instances_template_version_owner_fk",
      ]),
    );
    const seed = await pool.query(
      "select id from users where id = $1",
      [SEED_IDS.superAdminUser],
    );
    expect(seed.rowCount).toBe(1);
  });

  afterAll(async () => {
    if (pool) await pool.end();
  });

  it("accepts a college assignment using a version of the same template", async () => {
    await withFixture(async (fixture) => {
      const result = await createAssignment(fixture, fixture.templateA, fixture.versionA1);
      expect(result.rowCount).toBe(1);
    });
  });

  it("rejects a college assignment using a different template's version", async () => {
    await withFixture(async (fixture) => {
      await expect(createAssignment(
        fixture, fixture.templateA, fixture.versionB1,
      )).rejects.toMatchObject({
        code: "23503",
        constraint: "project_template_assignments_template_version_owner_fk",
      });
    });
  });

  it("rejects an update moving an assignment to another template's version", async () => {
    await withFixture(async (fixture) => {
      const assignment = await createAssignment(fixture, fixture.templateA, fixture.versionA1);
      await expect(fixture.client.query(
        `update project_template_college_assignments
         set template_version_id = $1 where id = $2`,
        [fixture.versionB1, assignment.rows[0].id],
      )).rejects.toMatchObject({
        code: "23503",
        constraint: "project_template_assignments_template_version_owner_fk",
      });
    });
  });

  it("allows reassigning the same college/template to a newer same-template version", async () => {
    await withFixture(async (fixture) => {
      const assignment = await createAssignment(fixture, fixture.templateA, fixture.versionA1);
      const result = await fixture.client.query(
        `update project_template_college_assignments
         set template_version_id = $1 where id = $2 returning template_version_id`,
        [fixture.versionA2, assignment.rows[0].id],
      );
      expect(result.rows[0].template_version_id).toBe(fixture.versionA2);
    });
  });

  it("accepts a materialized project instance using its own template's version", async () => {
    await withFixture(async (fixture) => {
      const result = await createInstance(fixture, fixture.templateA, fixture.versionA1);
      expect(result.rowCount).toBe(1);
    });
  });

  it("rejects a project instance using a different template's version", async () => {
    await withFixture(async (fixture) => {
      await expect(createInstance(
        fixture, fixture.templateA, fixture.versionB1,
      )).rejects.toMatchObject({
        code: "23503",
        constraint: "project_instances_template_version_owner_fk",
      });
    });
  });

  it("rejects mutating a project instance to a cross-template version", async () => {
    await withFixture(async (fixture) => {
      const instance = await createInstance(fixture, fixture.templateA, fixture.versionA1);
      await expect(fixture.client.query(
        "update project_instances set template_version_id = $1 where id = $2",
        [fixture.versionB1, instance.rows[0].id],
      )).rejects.toMatchObject({
        code: "23503",
        constraint: "project_instances_template_version_owner_fk",
      });
    });
  });

  it("does not require an assignment to remain active after materialization", async () => {
    await withFixture(async (fixture) => {
      const assignment = await createAssignment(fixture, fixture.templateA, fixture.versionA1);
      const instance = await createInstance(fixture, fixture.templateA, fixture.versionA1);
      await fixture.client.query(
        "update project_template_college_assignments set revoked_at = now() where id = $1",
        [assignment.rows[0].id],
      );
      const result = await fixture.client.query(
        "select template_version_id from project_instances where id = $1",
        [instance.rows[0].id],
      );
      expect(result.rows[0]?.template_version_id).toBe(fixture.versionA1);
    });
  });
});
