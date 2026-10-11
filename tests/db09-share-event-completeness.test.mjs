import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const sql = fs.readFileSync(
  path.resolve(process.cwd(), "docs/planning/sql/db09-collaboration-scoped-fk-candidate.sql"),
  "utf8",
);

test("share lifecycle has one CREATED and one REVOKED terminal event", () => {
  assert.match(
    sql,
    /CREATE UNIQUE INDEX db09_share_events_created_uq[\s\S]*WHERE action = 'CREATED'/,
  );
  assert.match(
    sql,
    /CREATE UNIQUE INDEX db09_share_events_revoked_uq[\s\S]*WHERE action = 'REVOKED'/,
  );
});

test("share lifecycle event completeness is deferred to transaction end", () => {
  assert.match(
    sql,
    /CREATE CONSTRAINT TRIGGER db09_share_link_event_completeness_guard[\s\S]*DEFERRABLE INITIALLY DEFERRED/,
  );
  assert.match(sql, /secure share is missing CREATED lifecycle event/);
  assert.match(sql, /revoked secure share is missing REVOKED lifecycle event/);
});

test("REVOKED event cannot exist for active or pre-revocation state", () => {
  assert.match(
    sql,
    /CREATE CONSTRAINT TRIGGER db09_share_event_state_guard[\s\S]*DEFERRABLE INITIALLY DEFERRED/,
  );
  assert.match(sql, /REVOKED event requires revoked share state/);
  assert.match(sql, /REVOKED event predates revocation/);
});

test("CREATED event cannot predate its share", () => {
  assert.match(sql, /CREATED event predates share creation/);
  assert.match(sql, /NEW\.created_at < v_created_at/);
});
