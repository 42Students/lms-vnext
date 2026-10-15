import { afterAll, describe, expect, it } from "vitest";
import { Pool } from "pg";

/** Read-only acceptance against a migrated disposable Postgres, never production. */
if (!process.env.TEST_DATABASE_URL) {
  throw new Error("A migrated disposable TEST_DATABASE_URL is required");
}
const pool = new Pool({ connectionString: process.env.TEST_DATABASE_URL, max: 1 });
afterAll(async () => { await pool.end(); });

async function columns(table: string) {
  const result = await pool.query<{ column_name: string }>(
    `select column_name from information_schema.columns
     where table_schema='public' and table_name=$1 order by ordinal_position`,
    [table],
  );
  return result.rows.map(row => row.column_name);
}

async function constraints(table: string) {
  const result = await pool.query<{ conname: string; definition: string }>(
    `select conname, pg_get_constraintdef(oid) as definition
     from pg_constraint where conrelid=to_regclass($1)`,
    ["public." + table],
  );
  return result.rows;
}

describe("registered PR-S2-04 migration 0090 on real PostgreSQL", () => {
  it("has the task fields, bounded comments and same-project composite task FK", async () => {
    expect(await columns("project_tasks")).toEqual(expect.arrayContaining([
      "blocker_reason", "due_date", "estimate_points", "task_type",
    ]));
    expect(await columns("project_task_comments")).toEqual(expect.arrayContaining([
      "project_id", "task_id", "author_membership_id", "body", "created_at",
    ]));
    const checks=await constraints("project_task_comments");
    expect(checks.some(row => row.definition.includes("FOREIGN KEY (project_id, task_id)") &&
      row.definition.includes("REFERENCES project_tasks(project_id, id)"))).toBe(true);
    expect(checks.some(row => row.conname === "project_task_comments_body_ck")).toBe(true);
    const taskChecks=await constraints("project_tasks");
    expect(taskChecks.some(row => row.conname === "project_tasks_task_type_ck")).toBe(true);
    expect(taskChecks.some(row => row.conname === "project_tasks_estimate_points_ck")).toBe(true);
  });
});

describe("registered PR-S2-07 migration 0091 on real PostgreSQL", () => {
  it("has durable lock/reopen and array attachments plus append-only typed events", async () => {
    expect(await columns("project_submissions")).toEqual(expect.arrayContaining([
      "locked_at", "reopened_at", "attachments",
    ]));
    expect(await columns("project_delivery_events")).toEqual(expect.arrayContaining([
      "project_id", "submission_id", "event_type", "actor_membership_id", "reason", "occurred_at",
    ]));
    const eventChecks=await constraints("project_delivery_events");
    expect(eventChecks.some(row => row.definition.includes("FOREIGN KEY (project_id, submission_id)") &&
      row.definition.includes("REFERENCES project_submissions(project_id, id)"))).toBe(true);
    expect(eventChecks.some(row => row.conname === "project_delivery_events_event_type_ck")).toBe(true);
    expect(eventChecks.some(row => row.conname === "project_delivery_events_reason_ck")).toBe(true);
    expect((await constraints("project_submissions")).some(row =>
      row.conname === "project_submissions_attachments_array_ck")).toBe(true);
  });
});
