import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const sql = fs.readFileSync(
  path.resolve(process.cwd(), "drizzle/0075_db09_tpo_collaboration.sql"),
  "utf8",
);

function functionBody(name) {
  const start = sql.indexOf(`CREATE FUNCTION ${name}(`);
  assert.notEqual(start, -1, `missing ${name}`);
  const endMarker = sql.indexOf("END $$;", start);
  assert.notEqual(endMarker, -1, `unterminated ${name}`);
  return sql.slice(start, endMarker + "END $$;".length);
}

test("recruiter notification read watermark remains grant scoped", () => {
  const body = functionBody("db09_assert_recruiter_read_scope");
  assert.match(body, /db09_has_active_recruiter_grant/);
});

test("recruiter notification read watermark rejects future state", () => {
  const body = functionBody("db09_assert_recruiter_read_scope");
  assert.match(body, /NEW\.read_through > statement_timestamp\(\)/);
  assert.match(body, /cannot be in the future/);
});

test("recruiter notification read watermark is monotonic", () => {
  const body = functionBody("db09_assert_recruiter_read_scope");
  assert.match(body, /NEW\.read_through < OLD\.read_through/);
  assert.match(body, /cannot move backward/);
});

test("recruiter notification read marker identity is immutable", () => {
  const body = functionBody("db09_assert_recruiter_read_scope");
  assert.match(body, /NEW\.recruiter_user_id IS DISTINCT FROM OLD\.recruiter_user_id/);
  assert.match(body, /NEW\.college_id IS DISTINCT FROM OLD\.college_id/);
  assert.match(body, /marker identity is immutable/);
  assert.match(
    sql,
    /CREATE TRIGGER db09_recruiter_read_scope_guard\s+BEFORE INSERT OR UPDATE\s+ON placement_recruiter_notification_reads/,
  );
});
