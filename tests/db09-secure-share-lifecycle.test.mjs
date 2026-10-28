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
  const end = sql.indexOf("END $$;", start);
  assert.notEqual(end, -1, `unterminated ${name}`);
  return sql.slice(start, end + "END $$;".length);
}

const body = functionBody("db09_restrict_share_link_update");

test("secure share immutable disclosure fields are frozen after create", () => {
  for (const field of [
    "id", "college_id", "job_id", "token_hash", "recipient_email",
    "code_hash", "columns", "max_stage", "shortlist_by", "expires_at",
    "created_by_user_id", "created_at",
  ]) {
    assert.match(body, new RegExp(`NEW\\.${field} IS DISTINCT FROM OLD\\.${field}`));
  }
  assert.match(body, /secure share disclosure contract is immutable after creation/);
});

test("secure share email code rotates only while usable", () => {
  assert.match(body, /v_code_rotated/);
  assert.match(body, /OLD\.revoked_at IS NOT NULL/);
  assert.match(body, /OLD\.expires_at <= statement_timestamp\(\)/);
  assert.match(body, /NEW\.email_code_expires_at <= statement_timestamp\(\)/);
  assert.match(body, /code cannot rotate after revoke or expiry/);
});

test("secure share revocation is one way and not future dated", () => {
  assert.match(body, /OLD\.revoked_at IS NOT NULL[\s\S]*NEW\.revoked_at IS DISTINCT FROM OLD\.revoked_at/);
  assert.match(body, /revocation cannot be cleared or rewritten/);
  assert.match(body, /NEW\.revoked_at > statement_timestamp\(\)/);
  assert.match(body, /revocation cannot be future dated/);
});

test("secure share cannot rotate code while revoking", () => {
  assert.match(body, /IF v_revoked_now/);
  assert.match(body, /code rotation and revocation must be separate transitions/);
  assert.match(
    sql,
    /CREATE TRIGGER db09_share_link_update_guard\s+BEFORE UPDATE ON placement_tpo_share_links/,
  );
});
