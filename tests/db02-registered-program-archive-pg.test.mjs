import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { after, test } from "node:test";
import pg from "pg";
import { assertSafeDb01TestTarget } from "../scripts/db01-test-database-guard.mjs";

if (process.env.DB02_REGISTERED_PROGRAM_ARCHIVE !== "YES" || !process.env.TEST_DATABASE_URL) {
  throw new Error("DB-005 archive acceptance requires an explicitly disposable PostgreSQL target");
}
assertSafeDb01TestTarget({ ...process.env, DATABASE_URL: "" });
const pool = new pg.Pool({ connectionString: process.env.TEST_DATABASE_URL, max: 4 });
after(async () => pool.end());
const deptA = "21000000-0000-4000-8000-000000000001";

async function fixture(client) {
  const suffix = randomUUID().slice(0, 8);
  const college = (await client.query(
    "SELECT college_id FROM departments WHERE id=$1", [deptA],
  )).rows[0].college_id;
  const period = (await client.query(
    "INSERT INTO academic_periods(college_id,name,code,start_date,end_date) VALUES($1,$2,$3,'2025-07-01','2026-06-30') RETURNING id",
    [college, "DB005 archive period " + suffix, "D055-AP-" + suffix],
  )).rows[0].id;
  const program = (await client.query(
    "INSERT INTO programs(department_id,name,code,duration_terms) VALUES($1,$2,$3,4) RETURNING id",
    [deptA, "DB005 archive program " + suffix, "D055-P-" + suffix],
  )).rows[0].id;
  return {
    period, program, suffix,
    insert: (status = "PLANNED") => client.query(
      "INSERT INTO cohorts(program_id,start_period_id,name,code,status) VALUES($1,$2,$3,$4,$5) RETURNING id",
      [program, period, "DB005 cohort " + suffix, "D055-C-" + suffix, status],
    ),
  };
}

async function rollbackOnly(run) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    try { await run(client); }
    finally { await client.query("ROLLBACK"); }
  } finally { client.release(); }
}
async function deny(client, sql, values, message) {
  await client.query("SAVEPOINT reject_archive");
  await assert.rejects(client.query(sql, values), error =>
    error.code === "23514" && error.message.includes(message));
  await client.query("ROLLBACK TO SAVEPOINT reject_archive");
  await client.query("RELEASE SAVEPOINT reject_archive");
}

test("DB005 cohort/program archive triggers are physically registered", async () => {
  const names = ["db02_cohort_status_lifecycle_guard", "db02_program_archive_cohort_dependency_guard"];
  const result = await pool.query(
    "SELECT tgname,count(*)::integer AS count FROM pg_trigger WHERE NOT tgisinternal AND tgname=ANY($1) GROUP BY tgname",
    [names],
  );
  assert.deepEqual(result.rows.map(row => [row.tgname, row.count]).sort(),
    names.map(name => [name, 1]).sort());
});

for (const state of ["PLANNED", "ACTIVE", "COMPLETED"]) {
  test("a " + state + " cohort blocks direct program archive", async () => {
    await rollbackOnly(async client => {
      const f = await fixture(client);
      await f.insert(state);
      await deny(client, "UPDATE programs SET status='ARCHIVED' WHERE id=$1",
        [f.program], "Cannot archive program with nonarchived cohorts");
    });
  });
}

test("archived cohorts are terminal and allow program archive", async () => {
  await rollbackOnly(async client => {
    const f = await fixture(client);
    await deny(client,
      "INSERT INTO cohorts(program_id,start_period_id,name,code,status) VALUES($1,$2,'bad','bad','ARCHIVED')",
      [f.program, f.period], "Cohort cannot be created already archived");
    const cohort = (await f.insert()).rows[0].id;
    assert.equal((await client.query(
      "UPDATE cohorts SET status='ARCHIVED' WHERE id=$1", [cohort],
    )).rowCount, 1);
    assert.equal((await client.query(
      "UPDATE programs SET status='ARCHIVED' WHERE id=$1", [f.program],
    )).rowCount, 1);
    await deny(client, "UPDATE cohorts SET status='ACTIVE' WHERE id=$1",
      [cohort], "Cannot activate or create a cohort under archived program");
    await deny(client, "INSERT INTO cohorts(program_id,start_period_id,name,code) VALUES($1,$2,'late','late')",
      [f.program, f.period], "Cannot activate or create a cohort under archived program");
  });
});

test("archive-first writer rejects a concurrent cohort after commit", async () => {
  const writer = await pool.connect();
  const child = await pool.connect();
  let archiveTx = false, childTx = false;
  try {
    const f = await fixture(writer);
    await writer.query("BEGIN"); archiveTx = true;
    await writer.query("UPDATE programs SET status='ARCHIVED' WHERE id=$1", [f.program]);
    await child.query("BEGIN"); childTx = true;
    await child.query("SET LOCAL lock_timeout='5s'");
    const pending = child.query(
      "INSERT INTO cohorts(program_id,start_period_id,name,code) VALUES($1,$2,$3,$4)",
      [f.program, f.period, "race " + f.suffix, "D055-R-" + f.suffix],
    );
    await new Promise(resolve => setTimeout(resolve, 75));
    await writer.query("COMMIT"); archiveTx = false;
    await assert.rejects(pending, error =>
      error.code === "23514" && error.message.includes("Cannot activate or create a cohort"));
  } finally {
    if (childTx) await child.query("ROLLBACK").catch(() => {});
    if (archiveTx) await writer.query("ROLLBACK").catch(() => {});
    child.release(); writer.release();
  }
});
