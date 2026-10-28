import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const sql = fs.readFileSync(
  path.resolve(process.cwd(), "drizzle/0075_db09_tpo_collaboration.sql"),
  "utf8",
);

function body(name) {
  const s = sql.indexOf(`CREATE FUNCTION ${name}(`);
  assert.notEqual(s, -1, `missing ${name}`);
  const e = sql.indexOf("END $$;", s);
  assert.notEqual(e, -1, `unterminated ${name}`);
  return sql.slice(s, e + 7);
}

const lifecycle = body("db09_restrict_recruiter_private_note_lifecycle");

test("private note identity is immutable after insert", () => {
  for (const field of [
    "id", "recruiter_user_id", "college_id", "job_id", "application_id", "created_at",
  ]) {
    assert.match(lifecycle, new RegExp(`NEW\\.${field} IS DISTINCT FROM OLD\\.${field}`));
  }
  assert.match(lifecycle, /recruiter private note identity is immutable/);
});

test("private note chronology fails closed", () => {
  assert.match(lifecycle, /NEW\.updated_at < NEW\.created_at/);
  assert.match(lifecycle, /NEW\.updated_at < OLD\.updated_at/);
  assert.match(lifecycle, /statement_timestamp\(\) \+ interval '5 minutes'/);
});

test("private note content mutation must advance updated_at", () => {
  assert.match(
    lifecycle,
    /NEW\.rating IS DISTINCT FROM OLD\.rating OR NEW\.note IS DISTINCT FROM OLD\.note/,
  );
  assert.match(lifecycle, /NEW\.updated_at <= OLD\.updated_at/);
  assert.match(lifecycle, /content change must advance updated_at/);
});

test("private note delete remains intentionally allowed", () => {
  assert.doesNotMatch(lifecycle, /TG_OP = 'DELETE'/);
  assert.match(
    sql,
    /CREATE TRIGGER db09_recruiter_private_note_lifecycle_guard\s+BEFORE INSERT OR UPDATE ON placement_recruiter_applicant_notes/,
  );
});
