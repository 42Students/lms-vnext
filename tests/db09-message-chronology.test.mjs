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

test("messages are born unread and not materially future dated", () => {
  const b = body("db09_assert_message_sender_scope");
  assert.match(b, /NEW\.read_at IS NOT NULL/);
  assert.match(b, /new message must start unread/);
  assert.match(b, /NEW\.created_at > statement_timestamp\(\) \+ interval '5 minutes'/);
});

test("message history is append only and read state is one way", () => {
  const b = body("db09_restrict_message_update");
  assert.match(b, /TG_OP = 'DELETE'/);
  assert.match(b, /message history is append-only/);
  assert.match(b, /message identity\/content is immutable/);
  assert.match(b, /message read state cannot be rewound or rewritten/);
  assert.match(b, /NEW\.read_at < OLD\.created_at/);
  assert.match(b, /NEW\.read_at > statement_timestamp\(\) \+ interval '5 minutes'/);
});

test("thread last_message_at equals max persisted message chronology", () => {
  const b = body("db09_assert_thread_last_message_projection");
  assert.match(b, /SELECT max\(m\.created_at\)/);
  assert.match(b, /v_last_message_at IS DISTINCT FROM v_max_message_at/);
  assert.match(b, /last_message_at does not match persisted chronology/);
});

test("chronology projection checks are deferred from both sides", () => {
  assert.match(
    sql,
    /db09_message_thread_projection_from_message_guard[\s\S]*AFTER INSERT ON placement_tpo_messages[\s\S]*DEFERRABLE INITIALLY DEFERRED/,
  );
  assert.match(
    sql,
    /db09_message_thread_projection_from_thread_guard[\s\S]*AFTER INSERT OR UPDATE ON placement_tpo_message_threads[\s\S]*DEFERRABLE INITIALLY DEFERRED/,
  );
});


test("message thread identity is immutable and history is append only", () => {
  const b = body("db09_restrict_message_thread_update");
  assert.match(b, /TG_OP = 'DELETE'/);
  assert.match(b, /message thread history is append-only/);
  for (const field of ["id", "college_id", "recruiter_user_id", "job_id", "created_at"]) {
    assert.match(b, new RegExp(`NEW\\.${field} IS DISTINCT FROM OLD\\.${field}`));
  }
  assert.match(b, /message thread identity is immutable/);
  assert.match(
    sql,
    /CREATE TRIGGER db09_message_thread_update_guard\s+BEFORE UPDATE OR DELETE ON placement_tpo_message_threads/,
  );
});
