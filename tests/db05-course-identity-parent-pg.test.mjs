import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { after, test } from "node:test";
import pg from "pg";
import { assertSafeDb01TestTarget } from "../scripts/db01-test-database-guard.mjs";

// DB-008 / DB05 isolated acceptance of two UNREGISTERED source-backed drafts.
// This is NOT deployment, schema registration, or source/consumer signoff.
if (process.env.DB05_IDENTITY_DISPOSABLE !== "1" || !process.env.TEST_DATABASE_URL) {
  throw new Error("DB05 requires explicit DB05_IDENTITY_DISPOSABLE=1 and TEST_DATABASE_URL");
}
assertSafeDb01TestTarget({ ...process.env, DATABASE_URL: "" });
const pool = new pg.Pool({ connectionString: process.env.TEST_DATABASE_URL, max: 2 });
after(async () => pool.end());
const dept = "21000000-0000-4000-8000-000000000001";
const org = "10000000-0000-4000-8000-000000000001";

async function rollbackOnly(run) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    try { await run(client); } finally { await client.query("ROLLBACK"); }
  } finally {
    client.release();
  }
}

async function insertCourse(client, changes = {}) {
  const data = {
    name: "DB05 unique " + randomUUID(),
    shortTitle: null,
    slug: null,
    code: "DB05-" + randomUUID(),
    department: dept,
    ...changes,
  };
  const result = await client.query(
    `insert into courses (department_id,name,code,short_title,slug)
     values ($1,$2,$3,$4,$5) returning id`,
    [data.department, data.name, data.code, data.shortTitle, data.slug],
  );
  return result.rows[0].id;
}

async function rejected(client, query, params, code, constraint) {
  await client.query("SAVEPOINT db05_expected_rejection");
  await assert.rejects(client.query(query, params), error =>
    error.code === code &&
    (Array.isArray(constraint) ? constraint.includes(error.constraint) : error.constraint === constraint),
    "unexpected SQLSTATE/constraint: " + constraint);
  await client.query("ROLLBACK TO SAVEPOINT db05_expected_rejection");
  await client.query("RELEASE SAVEPOINT db05_expected_rejection");
}

test("DB05 case/whitespace folded active course names are unique inside a department", async () => {
  await rollbackOnly(async client => {
    const name = "DB05 " + randomUUID().slice(0, 8);
    await insertCourse(client, { name });
    await rejected(client,
      "insert into courses(department_id,name,code) values ($1,$2,$3)",
      [dept, "  " + name.toUpperCase() + "  ", "db05-" + randomUUID()],
      "23505", ["courses_active_department_name_trim_uq","db05_course_active_department_name_trim_uq"]);
  });
});

test("DB05 short title is independent of course code and uses trimmed uniqueness", async () => {
  await rollbackOnly(async client => {
    const shortTitle = "DB05 " + randomUUID().slice(0, 8);
    await insertCourse(client, { shortTitle });
    await rejected(client,
      "insert into courses(department_id,name,code,short_title) values ($1,$2,$3,$4)",
      [dept, "another " + randomUUID(), "db05-" + randomUUID(), "  " + shortTitle.toUpperCase() + " "],
      "23505", ["courses_active_department_short_title_trim_uq","db05_course_active_department_short_title_trim_uq"]);
  });
});

test("DB05 archived rows release a visible name, but NEVER release a slug", async () => {
  await rollbackOnly(async client => {
    const name = "DB05 archived " + randomUUID();
    const slug = "db05-" + randomUUID();
    const id = await insertCourse(client, { name, slug });
    await client.query("update courses set status='ARCHIVED' where id=$1", [id]);
    await insertCourse(client, { name: "  " + name.toUpperCase() + "  " });
    await rejected(client,
      "insert into courses(department_id,name,code,slug) values ($1,$2,$3,$4)",
      [dept, "new course " + randomUUID(), "db05-" + randomUUID(), slug],
      "23505", ["courses_slug_uq","db05_course_slug_reserved_uq"]);
  });
});

test("DB05 parent self-reference fails closed without relying on a service", async () => {
  await rollbackOnly(async client => {
    const id = await insertCourse(client);
    await rejected(client,
      "update courses set parent_course_id=$1 where id=$1",
      [id], "23514", "db05_course_parent_not_self_ck");
  });
});

test("DB05 independent nullable legacy flags and organization attribution survive SQL", async () => {
  await rollbackOnly(async client => {
    const id = await insertCourse(client);
    const result = await client.query(
      `update courses
         set legacy_active=false, legacy_enabled=true, allowed_for_display=0,
             created_by_organization_id=$2
       where id=$1
       returning legacy_active,legacy_enabled,allowed_for_display,status,created_by_organization_id`,
      [id, org],
    );
    assert.deepEqual(result.rows[0], {
      legacy_active: false, legacy_enabled: true,
      allowed_for_display: 0, status: "ACTIVE", created_by_organization_id: org,
    });
    await rejected(client,
      "update courses set created_by_organization_id=$1 where id=$2",
      [randomUUID(), id], "23503", "courses_created_by_organization_id_fkey");
  });
});
