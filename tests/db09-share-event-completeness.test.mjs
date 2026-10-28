import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const sql = fs.readFileSync(
  path.resolve(process.cwd(), "drizzle/0075_db09_tpo_collaboration.sql"),
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


test("share use/delivery events require a live unrevoked link", () => {
  assert.match(sql, /use\/delivery event cannot be appended after revocation/);
  assert.match(sql, /use\/delivery event cannot be appended after expiry/);
  assert.match(
    sql,
    /'OPENED','DOWNLOADED_LIST','DOWNLOADED_ZIP','LINK_EMAILED','CODE_EMAILED'/,
  );
});

test("all staged DB09 SQL functions use valid dollar quoting", () => {
  const functionStarts = [...sql.matchAll(/CREATE FUNCTION\s+([a-zA-Z0-9_]+)\(/g)];
  assert.ok(functionStarts.length > 0);
  for (const match of functionStarts) {
    const start = match.index;
    const next = sql.indexOf("\nCREATE ", start + 20);
    const block = sql.slice(start, next === -1 ? sql.length : next);
    assert.match(
      block,
      /LANGUAGE\s+(?:plpgsql|sql)(?:\s+STABLE)?\s+AS \$\$/,
      `${match[1]} must start with $$`,
    );
    assert.match(
      block,
      /\$\$;/,
      `${match[1]} must close with $$;`,
    );
    assert.doesNotMatch(
      block,
      /LANGUAGE\s+plpgsql\s+AS \$\n/,
      `${match[1]} must not use a single-dollar delimiter`,
    );
  }
});
