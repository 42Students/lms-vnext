import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { Pool, type PoolClient } from "pg";
import { SEED_IDS } from "../../scripts/db-seed-data";
import { assertDb018DisposableTarget } from "../support/db018-test-target.mjs";

/**
 * DB-073 opt-in PostgreSQL witness for UNREGISTERED candidate composite FKs.
 * Do not enable until Chat 1 promotes migration into a disposable PG instance.
 * No database reset, ALTER TABLE or irreversible operation occurs here.
 */
const enabled = process.env.DB073_PROJECT_LINEAGE_ENFORCED === "1";
if (enabled) {
  assertDb018DisposableTarget({ ...process.env, DB018_ISOLATED_TEST_DATABASE: "1" });
}
const pool = enabled
  ? new Pool({ connectionString: process.env.TEST_DATABASE_URL, max: 2 })
  : null;

type Fixture = {
  client: PoolClient;
  projectA: string;
  projectB: string;
  releaseA: string;
  releaseB: string;
  sprintA: string;
  sprintB: string;
  taskA: string;
  taskB: string;
};

async function withFixture(run: (f: Fixture) => Promise<void>) {
  if (!pool) throw new Error("DB073 PostgreSQL witness not enabled");
  const client = await pool.connect();
  let started = false;
  try {
    await client.query("BEGIN");
    started = true;
    const templateId = randomUUID();
    const versionId = randomUUID();
    const projectA = randomUUID();
    const projectB = randomUUID();
    const releaseA = randomUUID();
    const releaseB = randomUUID();
    const sprintA = randomUUID();
    const sprintB = randomUUID();
    const taskA = randomUUID();
    const taskB = randomUUID();
    await client.query(
      `INSERT INTO project_templates (id, slug, title, created_by_user_id)
       VALUES ($1, $2, 'DB073 template', $3)`,
      [templateId, `db073-template-${templateId}`, SEED_IDS.superAdminUser],
    );
    await client.query(
      `INSERT INTO project_template_versions
        (id, template_id, version, title, blueprint, created_by_user_id)
       VALUES ($1, $2, 1, 'DB073 version', '{}'::jsonb, $3)`,
      [versionId, templateId, SEED_IDS.superAdminUser],
    );
    await client.query(
      `INSERT INTO project_instances
        (id, college_id, template_id, template_version_id, slug, title, created_by_user_id)
       VALUES
        ($1, $3, $4, $5, $6, 'DB073 project A', $8),
        ($2, $3, $4, $5, $7, 'DB073 project B', $8)`,
      [projectA, projectB, SEED_IDS.collegeA, templateId, versionId,
        `db073-a-${projectA}`, `db073-b-${projectB}`, SEED_IDS.superAdminUser],
    );
    await client.query(
      `INSERT INTO project_releases
        (id, project_id, template_key, title, sequence)
       VALUES ($1, $3, 'release-a', 'Release A', 0),
              ($2, $4, 'release-b', 'Release B', 0)`,
      [releaseA, releaseB, projectA, projectB],
    );
    await client.query(
      `INSERT INTO project_sprints
        (id, project_id, release_id, template_key, title, sequence)
       VALUES ($1, $3, $5, 'sprint-a', 'Sprint A', 0),
              ($2, $4, $6, 'sprint-b', 'Sprint B', 0)`,
      [sprintA, sprintB, projectA, projectB, releaseA, releaseB],
    );
    await client.query(
      `INSERT INTO project_tasks
        (id, project_id, sprint_id, template_key, title, sequence)
       VALUES ($1, $3, $5, 'task-a', 'Task A', 0),
              ($2, $4, $6, 'task-b', 'Task B', 0)`,
      [taskA, taskB, projectA, projectB, sprintA, sprintB],
    );
    await run({ client, projectA, projectB, releaseA, releaseB,
      sprintA, sprintB, taskA, taskB });
  } finally {
    try {
      if (started) await client.query("ROLLBACK");
    } finally {
      client.release();
    }
  }
}

const constraints = [
  ["project_sprints_project_release_fk", "project_sprints",
    /FOREIGN KEY \(project_id, release_id\) REFERENCES project_releases\(project_id, id\)/i],
  ["project_tasks_project_sprint_fk", "project_tasks",
    /FOREIGN KEY \(project_id, sprint_id\) REFERENCES project_sprints\(project_id, id\)/i],
  ["project_task_submissions_project_task_fk", "project_task_submissions",
    /FOREIGN KEY \(project_id, task_id\) REFERENCES project_tasks\(project_id, id\)/i],
] as const;

async function insertSubmission(f: Fixture, projectId: string, taskId: string) {
  const id = randomUUID();
  await f.client.query(
    `INSERT INTO project_task_submissions
      (id, project_id, task_id, version, submitted_by_membership_id, submission_url)
     VALUES ($1, $2, $3, 1, $4, 'https://example.test/db073-submission')`,
    [id, projectId, taskId, SEED_IDS.learnerCollegeAMembership],
  );
  return id;
}

describe.skipIf(!enabled)("DB073 scoped project lineage PostgreSQL constraints", () => {
  beforeAll(async () => {
    if (!pool) throw new Error("DB073 database pool absent");
    const r = await pool.query<{
      conname: string;
      table_name: string;
      def: string;
      contype: string;
      convalidated: boolean;
    }>(
      `SELECT con.conname, rel.relname AS table_name,
              pg_get_constraintdef(con.oid) AS def, con.contype, con.convalidated
         FROM pg_constraint con JOIN pg_class rel ON rel.oid = con.conrelid
        WHERE con.conname = ANY($1::text[])`,
      [constraints.map(([name]) => name)],
    );
    expect(r.rows).toHaveLength(constraints.length);
    for (const [name, table, definition] of constraints) {
      const row = r.rows.find((item) => item.conname === name);
      expect(row).toMatchObject({
        table_name: table, contype: "f", convalidated: true,
      });
      expect(row?.def).toMatch(definition);
    }
    const seed = await pool.query("SELECT id FROM users WHERE id = $1", [
      SEED_IDS.superAdminUser,
    ]);
    expect(seed.rowCount).toBe(1);
  });

  afterAll(async () => {
    if (pool) await pool.end();
  });

  it("accepts same-project release → sprint → task → submission chain", async () => {
    await withFixture(async (f) => {
      const id = await insertSubmission(f, f.projectA, f.taskA);
      const result = await f.client.query(
        `SELECT sub.project_id, t.project_id AS task_project,
                s.project_id AS sprint_project, r.project_id AS release_project
           FROM project_task_submissions sub
           JOIN project_tasks t ON t.id = sub.task_id
           JOIN project_sprints s ON s.id = t.sprint_id
           JOIN project_releases r ON r.id = s.release_id
          WHERE sub.id = $1`,
        [id],
      );
      expect(result.rows[0]).toMatchObject({
        project_id: f.projectA, task_project: f.projectA,
        sprint_project: f.projectA, release_project: f.projectA,
      });
    });
  });

  it("rejects creating a sprint against another project's release", async () => {
    await withFixture(async (f) => {
      await expect(f.client.query(
        `INSERT INTO project_sprints
           (id, project_id, release_id, template_key, title, sequence)
         VALUES ($1, $2, $3, 'foreign-release', 'Foreign', 1)`,
        [randomUUID(), f.projectA, f.releaseB],
      )).rejects.toMatchObject({
        code: "23503", constraint: "project_sprints_project_release_fk",
      });
    });
  });

  it("rejects moving an existing sprint to another project's release", async () => {
    await withFixture(async (f) => {
      await expect(f.client.query(
        "UPDATE project_sprints SET release_id=$1, sequence=99 WHERE id=$2",
        [f.releaseB, f.sprintA],
      )).rejects.toMatchObject({
        code: "23503", constraint: "project_sprints_project_release_fk",
      });
    });
  });

  it("rejects creating a task against another project's sprint", async () => {
    await withFixture(async (f) => {
      await expect(f.client.query(
        `INSERT INTO project_tasks
           (id, project_id, sprint_id, template_key, title, sequence)
         VALUES ($1, $2, $3, 'foreign-sprint', 'Foreign', 1)`,
        [randomUUID(), f.projectA, f.sprintB],
      )).rejects.toMatchObject({
        code: "23503", constraint: "project_tasks_project_sprint_fk",
      });
    });
  });

  it("rejects moving an existing task to another project's sprint", async () => {
    await withFixture(async (f) => {
      await expect(f.client.query(
        "UPDATE project_tasks SET sprint_id=$1, sequence=99 WHERE id=$2",
        [f.sprintB, f.taskA],
      )).rejects.toMatchObject({
        code: "23503", constraint: "project_tasks_project_sprint_fk",
      });
    });
  });

  it("rejects creating a task submission against another project's task", async () => {
    await withFixture(async (f) => {
      await expect(insertSubmission(f, f.projectA, f.taskB)).rejects.toMatchObject({
        code: "23503", constraint: "project_task_submissions_project_task_fk",
      });
    });
  });

  it("rejects moving an existing submission to another project's task", async () => {
    await withFixture(async (f) => {
      const subId = await insertSubmission(f, f.projectA, f.taskA);
      await expect(f.client.query(
        "UPDATE project_task_submissions SET task_id=$1 WHERE id=$2",
        [f.taskB, subId],
      )).rejects.toMatchObject({
        code: "23503", constraint: "project_task_submissions_project_task_fk",
      });
    });
  });
});
