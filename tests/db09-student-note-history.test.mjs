import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const sql = fs.readFileSync(
  path.resolve(process.cwd(), "drizzle/0075_db09_tpo_collaboration.sql"),
  "utf8",
);

const start = sql.indexOf("CREATE FUNCTION db09_restrict_student_note_history(");
assert.notEqual(start, -1);
const end = sql.indexOf("END $$;", start);
assert.notEqual(end, -1);
const body = sql.slice(start, end + 7);

test("TPO student notes reject rewrite and delete", () => {
  assert.match(body, /TG_OP = 'INSERT'/);
  assert.match(body, /TPO student note history is append-only/);
  assert.match(
    sql,
    /CREATE TRIGGER db09_student_note_history_guard\s+BEFORE INSERT OR UPDATE OR DELETE ON placement_tpo_student_notes/,
  );
});

test("TPO student notes reject materially future creation", () => {
  assert.match(
    body,
    /NEW\.created_at > statement_timestamp\(\) \+ interval '5 minutes'/,
  );
});

test("TPO student-note principal guard remains present", () => {
  assert.match(sql, /db09_student_note_principal_scope_guard/);
  assert.match(sql, /student note learner is not active in note college/);
  assert.match(sql, /student note author lacks active TPO scope in note college/);
});
