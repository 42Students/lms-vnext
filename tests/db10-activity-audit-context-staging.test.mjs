import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const sql = readFileSync(
  "scripts/sql/db10-activity-audit-context-staging.sql",
  "utf8",
);
const contract = readFileSync(
  "docs/planning/database-parity-db10-activity-audit-context.md",
  "utf8",
);

test("DB39 remains staging-only and evidence-honest", () => {
  assert.match(sql, /STAGING ONLY, NOT A DRIZZLE MIGRATION/);
  assert.match(sql, /21bad59d4dfaf2fa11fdeaf9353327ce105697d5/);
  assert.match(contract, /STAGED_NOT_REGISTERED \/ POSTGRES_NOT_RUN/);
  assert.match(contract, /ALL NOT_RUN/);
});

test("DB39 adds exactly the three missing forensic concepts", () => {
  const added = [...sql.matchAll(/ADD COLUMN\s+([a-z_]+)/g)].map(m => m[1]);
  assert.deepEqual(added, [
    "actor_role_snapshot",
    "request_ip",
    "user_agent",
  ]);
  assert.doesNotMatch(sql, /ADD COLUMN\s+actor_contact_mobile\b/);
});

test("DB39 role snapshot is bounded and immutable-by-design metadata", () => {
  assert.match(sql, /actor_role_snapshot varchar\(40\)\[\] NULL/);
  assert.match(sql, /cardinality\(actor_role_snapshot\) BETWEEN 1 AND 16/);
  assert.match(sql, /array_position\(actor_role_snapshot, NULL\) IS NULL/);
  assert.match(contract, /write-time role snapshot/);
  assert.match(contract, /roles can change after/);
});

test("DB39 uses typed IP and bounded User-Agent columns", () => {
  assert.match(sql, /request_ip inet NULL/);
  assert.match(sql, /user_agent varchar\(512\) NULL/);
  assert.match(sql, /db39_activity_user_agent_ck/);
  assert.match(sql, /length\(btrim\(user_agent\)\) BETWEEN 1 AND 512/);
  assert.match(contract, /IPv4 and IPv6/);
});

test("DB39 keeps request context out of generic producer metadata", () => {
  assert.match(sql, /request IP\/User-Agent are explicit forensic columns, not arbitrary metadata/);
  assert.match(sql, /ordinary event metadata must stay free of request-header copies/);
  assert.match(contract, /callers cannot spoof forensic fields/);
});

test("DB39 preserves actor phone by normalization instead of PII duplication", () => {
  assert.match(sql, /actor_contact_mobile -> users\.phone_e164 through actor_user_id/);
  assert.doesNotMatch(sql, /ADD COLUMN\s+(?:actor_)?(?:contact_)?mobile\b/);
  assert.match(contract, /does not add an actor-mobile snapshot/);
});

test("DB39 leaves retention and trusted-proxy decisions explicit", () => {
  assert.match(contract, /does not invent a retention duration/);
  assert.match(contract, /trusted provenance/);
  assert.match(contract, /retention\/purge duration/);
  assert.match(contract, /Current `RequestContext`[\s\S]*does\s+not\s+carry network headers/);
});

test("DB39 enumerates all 18 acceptance requirements", () => {
  for (let i = 1; i <= 18; i += 1) {
    const id = "DB39-" + String(i).padStart(2, "0");
    assert.ok(contract.includes(id), "Missing acceptance requirement " + id);
  }
  assert.match(contract, /not DONE_VERIFIED until/);
});
