import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { after, test } from "node:test";
import pg from "pg";
import { assertSafeDb01TestTarget } from "../scripts/db01-test-database-guard.mjs";

// Registered DB-005 slice only: cannot certify the entire DB02 domain.
if (process.env.DB02_REGISTERED_PARENT_GUARDS !== "YES" || !process.env.TEST_DATABASE_URL) {
  throw new Error("DB02 registered guard acceptance needs explicit disposable test opt-in");
}
assertSafeDb01TestTarget({ ...process.env, DATABASE_URL: "" });
const pool = new pg.Pool({ connectionString: process.env.TEST_DATABASE_URL, max: 2 });
after(async () => { await pool.end(); });
const ids = {
  organization: "10000000-0000-4000-8000-000000000001",
  a: "20000000-0000-4000-8000-000000000001",
  b: "20000000-0000-4000-8000-000000000002",
  deptA: "21000000-0000-4000-8000-000000000001",
  deptB: "21000000-0000-4000-8000-000000000002",
};
async function rollbackOnly(fn) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    try { await fn(client); }
    finally { await client.query("ROLLBACK"); }
  } finally { client.release(); }
}
async function rejectWithMessage(client, query, values, message) {
  await client.query("SAVEPOINT expected_denial");
  await assert.rejects(client.query(query, values),
    error => error.code === "23514" && error.message === message,
    "must fail with registered SQL tenant guard");
  await client.query("ROLLBACK TO SAVEPOINT expected_denial");
  await client.query("RELEASE SAVEPOINT expected_denial");
}
test("DB02 parent ownership guards exist and each fires exactly once after registered replay", async () => {
  const result = await pool.query(`
    SELECT tgname, count(*)::integer AS installed FROM pg_trigger
    WHERE NOT tgisinternal AND tgname IN (
      'db02_department_college_immutable',
      'db02_program_department_move_guard',
      'db02_course_department_move_guard'
    ) GROUP BY tgname ORDER BY tgname
  `);
  assert.deepEqual(result.rows, [
    { tgname: "db02_course_department_move_guard", installed: 1 },
    { tgname: "db02_department_college_immutable", installed: 1 },
    { tgname: "db02_program_department_move_guard", installed: 1 },
  ]);
});
test("DB02 rejects direct SQL department reparenting across colleges", async () => {
  await rollbackOnly(async client => {
    await rejectWithMessage(client,
      "UPDATE departments SET college_id=$1 WHERE id=$2",
      [ids.b, ids.deptA], "Department cannot move to another college");
    const result=await client.query("SELECT college_id FROM departments WHERE id=$1",[ids.deptA]);
    assert.equal(result.rows[0].college_id,ids.a);
  });
});
test("DB02 program may move within college but not to another college", async () => {
  await rollbackOnly(async client => {
    const suffix=randomUUID().slice(0,8);
    const extra=await client.query("INSERT INTO departments(college_id,name) VALUES ($1,$2) RETURNING id",
      [ids.a,"DB02 same-college "+suffix]);
    const created=await client.query(
      "INSERT INTO programs(department_id,name,code,duration_terms) VALUES($1,$2,$3,8) RETURNING id",
      [ids.deptA,"DB02 program "+suffix,"DB02-P-"+suffix]);
    const programId=created.rows[0].id;
    await client.query("UPDATE programs SET department_id=$1 WHERE id=$2",
      [extra.rows[0].id,programId]);
    await rejectWithMessage(client,
      "UPDATE programs SET department_id=$1 WHERE id=$2",
      [ids.deptB,programId],
      "Program department move must stay within one college");
    assert.equal((await client.query("SELECT department_id FROM programs WHERE id=$1",[programId])).rows[0].department_id,
      extra.rows[0].id);
  });
});
test("DB02 course may move within college but never change its college via direct SQL", async () => {
  await rollbackOnly(async client => {
    const suffix=randomUUID().slice(0,8);
    const extra=await client.query("INSERT INTO departments(college_id,name) VALUES ($1,$2) RETURNING id",
      [ids.a,"DB02 course dept "+suffix]);
    const created=await client.query(
      "INSERT INTO courses(department_id,name,code) VALUES($1,$2,$3) RETURNING id",
      [ids.deptA,"DB02 course "+suffix,"DB02-C-"+suffix]);
    const courseId=created.rows[0].id;
    await client.query("UPDATE courses SET department_id=$1 WHERE id=$2",
      [extra.rows[0].id,courseId]);
    await rejectWithMessage(client,
      "UPDATE courses SET department_id=$1 WHERE id=$2",
      [ids.deptB,courseId],
      "Course department move must stay within one college");
    assert.equal((await client.query("SELECT department_id FROM courses WHERE id=$1",[courseId])).rows[0].department_id,
      extra.rows[0].id);
  });
});
