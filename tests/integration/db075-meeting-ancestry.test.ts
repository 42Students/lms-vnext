import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { Pool, type PoolClient } from "pg";
import { SEED_IDS } from "../../scripts/db-seed-data";
import { assertDb018DisposableTarget } from "../support/db018-test-target.mjs";

/** DB075 opt-in PostgreSQL only after registered schema and disposable replay.
 * Default is SKIP, and no fallback to DATABASE_URL or destructive commands.
 */
const enabled = process.env.DB075_MEETING_ANCESTRY_ENFORCED === "1";
if (enabled) {
  assertDb018DisposableTarget({ ...process.env, DB018_ISOLATED_TEST_DATABASE: "1" });
}
const pool = enabled
  ? new Pool({ connectionString: process.env.TEST_DATABASE_URL, max: 2 })
  : null;

type Fixture = {
  client: PoolClient;
  projectA: string; projectB: string;
  sprintA: string; sprintA2: string; sprintB: string;
  taskA: string; taskA2: string; taskB: string;
};

async function withFixture(run: (fixture: Fixture) => Promise<void>) {
  if (!pool) throw new Error("DB075 PostgreSQL suite not enabled");
  const client = await pool.connect();
  let began = false;
  try {
    await client.query("BEGIN");
    began = true;
    const templateId = randomUUID(), versionId = randomUUID();
    const projectA = randomUUID(), projectB = randomUUID();
    const releaseA = randomUUID(), releaseB = randomUUID();
    const sprintA = randomUUID(), sprintA2 = randomUUID(), sprintB = randomUUID();
    const taskA = randomUUID(), taskA2 = randomUUID(), taskB = randomUUID();
    await client.query(
      `INSERT INTO project_templates (id, slug, title, created_by_user_id)
       VALUES ($1, $2, 'DB075 template', $3)`,
      [templateId, `db075-${templateId}`, SEED_IDS.superAdminUser],
    );
    await client.query(
      `INSERT INTO project_template_versions
        (id, template_id, version, title, blueprint, created_by_user_id)
       VALUES ($1, $2, 1, 'DB075 version', '{}'::jsonb, $3)`,
      [versionId, templateId, SEED_IDS.superAdminUser],
    );
    await client.query(
      `INSERT INTO project_instances
        (id, college_id, template_id, template_version_id,
         slug, title, created_by_user_id)
       VALUES ($1, $3, $4, $5, $6, 'DB075 A', $8),
              ($2, $3, $4, $5, $7, 'DB075 B', $8)`,
      [projectA, projectB, SEED_IDS.collegeA, templateId, versionId,
        `db075-a-${projectA}`, `db075-b-${projectB}`,
        SEED_IDS.superAdminUser],
    );
    await client.query(
      `INSERT INTO project_releases
        (id, project_id, template_key, title, sequence)
       VALUES ($1, $3, 'release-a', 'A', 0),
              ($2, $4, 'release-b', 'B', 0)`,
      [releaseA, releaseB, projectA, projectB],
    );
    await client.query(
      `INSERT INTO project_sprints
        (id, project_id, release_id, template_key, title, sequence)
       VALUES ($1, $4, $6, 'sprint-a',  'A',  0),
              ($2, $4, $6, 'sprint-a2', 'A2', 1),
              ($3, $5, $7, 'sprint-b',  'B',  0)`,
      [sprintA, sprintA2, sprintB, projectA, projectB, releaseA, releaseB],
    );
    await client.query(
      `INSERT INTO project_tasks
        (id, project_id, sprint_id, template_key, title, sequence)
       VALUES ($1, $4, $6, 'task-a',  'Task A',  0),
              ($2, $4, $7, 'task-a2', 'Task A2', 0),
              ($3, $5, $8, 'task-b',  'Task B',  0)`,
      [taskA, taskA2, taskB, projectA, projectB, sprintA, sprintA2, sprintB],
    );
    await run({
      client, projectA, projectB, sprintA, sprintA2, sprintB,
      taskA, taskA2, taskB,
    });
  } finally {
    try {
      if (began) await client.query("ROLLBACK");
    } finally {
      client.release();
    }
  }
}

async function insertMeeting(
  f: Fixture,
  opts: { projectId: string; sprintId?: string | null; taskId?: string | null },
) {
  const id = randomUUID();
  await f.client.query(
    `INSERT INTO project_meetings
      (id, project_id, status, title, starts_at, ends_at, time_zone,
       linked_sprint_id, linked_task_id, created_by_user_id)
     VALUES ($1, $2, 'DRAFT', 'DB075 meeting', now()+interval '1 day',
             now()+interval '1 day 1 hour', 'Asia/Kolkata', $3, $4, $5)`,
    [id, opts.projectId, opts.sprintId ?? null, opts.taskId ?? null,
      SEED_IDS.superAdminUser],
  );
  return id;
}

const required = [
  ["project_meetings_project_sprint_fk",
    /FOREIGN KEY \(project_id, linked_sprint_id\) REFERENCES project_sprints\(project_id, id\)/i],
  ["project_meetings_project_task_fk",
    /FOREIGN KEY \(project_id, linked_task_id\) REFERENCES project_tasks\(project_id, id\)/i],
  ["project_meetings_linked_sprint_task_fk",
    /FOREIGN KEY \(linked_sprint_id, linked_task_id\) REFERENCES project_tasks\(sprint_id, id\)/i],
] as const;

describe.skipIf(!enabled)("DB075 optional meeting link ancestry on PostgreSQL", () => {
  beforeAll(async () => {
    if (!pool) throw new Error("DB075 pool absent");
    const r = await pool.query<{
      conname: string; def: string; contype: string;
      convalidated: boolean; table_name: string;
    }>(
      `SELECT con.conname, pg_get_constraintdef(con.oid) AS def,
              con.contype, con.convalidated, cls.relname AS table_name
         FROM pg_constraint con JOIN pg_class cls ON cls.oid=con.conrelid
        WHERE con.conname=ANY($1::text[])`,
      [required.map(([name]) => name)],
    );
    expect(r.rows).toHaveLength(3);
    for (const [name, pattern] of required) {
      const row = r.rows.find((candidate) => candidate.conname === name);
      expect(row).toMatchObject({
        contype: "f", convalidated: true, table_name: "project_meetings",
      });
      expect(row?.def).toMatch(pattern);
    }
  });
  afterAll(async () => { if (pool) await pool.end(); });

  it("allows general project meeting with neither optional link", async () => {
    await withFixture(async (f) => {
      const id = await insertMeeting(f, { projectId: f.projectA });
      const r = await f.client.query(
        "SELECT linked_sprint_id, linked_task_id FROM project_meetings WHERE id=$1",
        [id],
      );
      expect(r.rows[0]).toMatchObject({
        linked_sprint_id: null, linked_task_id: null,
      });
    });
  });

  it("allows sprint-only same-project meeting", async () => {
    await withFixture(async (f) => {
      const id = await insertMeeting(f, {
        projectId: f.projectA, sprintId: f.sprintA,
      });
      const r = await f.client.query(
        "SELECT linked_sprint_id FROM project_meetings WHERE id=$1", [id],
      );
      expect(r.rows[0].linked_sprint_id).toBe(f.sprintA);
    });
  });

  it("allows task-only same-project meeting", async () => {
    await withFixture(async (f) => {
      const id = await insertMeeting(f, { projectId: f.projectA, taskId: f.taskA });
      const r = await f.client.query(
        "SELECT linked_task_id FROM project_meetings WHERE id=$1", [id],
      );
      expect(r.rows[0].linked_task_id).toBe(f.taskA);
    });
  });

  it("allows sprint and task when the task belongs to the linked sprint", async () => {
    await withFixture(async (f) => {
      const id = await insertMeeting(f, {
        projectId: f.projectA, sprintId: f.sprintA, taskId: f.taskA,
      });
      const r = await f.client.query(
        "SELECT linked_sprint_id, linked_task_id FROM project_meetings WHERE id=$1",
        [id],
      );
      expect(r.rows[0]).toMatchObject({
        linked_sprint_id: f.sprintA, linked_task_id: f.taskA,
      });
    });
  });

  it("rejects link to a sprint belonging to a foreign project", async () => {
    await withFixture(async (f) => {
      await expect(insertMeeting(f, {
        projectId: f.projectA, sprintId: f.sprintB,
      })).rejects.toMatchObject({
        code: "23503", constraint: "project_meetings_project_sprint_fk",
      });
    });
  });

  it("rejects link to a task belonging to a foreign project", async () => {
    await withFixture(async (f) => {
      await expect(insertMeeting(f, {
        projectId: f.projectA, taskId: f.taskB,
      })).rejects.toMatchObject({
        code: "23503", constraint: "project_meetings_project_task_fk",
      });
    });
  });

  it("rejects links to distinct sprints within the SAME project", async () => {
    await withFixture(async (f) => {
      await expect(insertMeeting(f, {
        projectId: f.projectA, sprintId: f.sprintA2, taskId: f.taskA,
      })).rejects.toMatchObject({
        code: "23503", constraint: "project_meetings_linked_sprint_task_fk",
      });
    });
  });

  it("rejects moving a linked meeting to a task in another same-project sprint", async () => {
    await withFixture(async (f) => {
      const id = await insertMeeting(f, {
        projectId: f.projectA, sprintId: f.sprintA, taskId: f.taskA,
      });
      await expect(f.client.query(
        "UPDATE project_meetings SET linked_task_id=$1 WHERE id=$2",
        [f.taskA2, id],
      )).rejects.toMatchObject({
        code: "23503", constraint: "project_meetings_linked_sprint_task_fk",
      });
    });
  });

  it("rejects moving a linked meeting project while retaining old links", async () => {
    await withFixture(async (f) => {
      const id = await insertMeeting(f, {
        projectId: f.projectA, sprintId: f.sprintA, taskId: f.taskA,
      });
      await expect(f.client.query(
        "UPDATE project_meetings SET project_id=$1 WHERE id=$2",
        [f.projectB, id],
      )).rejects.toMatchObject({ code: "23503" });
    });
  });
});
