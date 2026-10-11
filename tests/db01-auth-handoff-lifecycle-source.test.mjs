import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const read = p => readFileSync(resolve(root, p), "utf8");
const trigger = read("docs/planning/sql/db01-auth-handoff-lifecycle-guard-staging.sql");
const table = read("docs/planning/sql/db01-auth-handoffs-staging.sql");
const schema = read("src/db/schema/db01-auth-handoffs.staged.ts");
const pgWitness = read("tests/db01-auth-handoff-lifecycle-pg.test.mjs");
const active = read("src/db/schema/index.ts");

const stripComments = source => source.replace(/^\s*--[^\n]*$/gm, "");
const code = stripComments(trigger);
const scope = [
  "id", "user_id", "college_id", "target_membership_id",
  "target_domain_id", "target_host", "code_mac", "created_at",
];

function missing(source) {
  const out = [];
  for (const key of scope) {
    if (!source.includes(`NEW.${key} IS DISTINCT FROM OLD.${key}`)) out.push(key);
  }
  if (!source.includes("NEW.expires_at > OLD.expires_at")) out.push("expiry monotone");
  if (!source.includes("OLD.consumed_at IS NOT NULL")) out.push("consumption terminal");
  if (!/NEW\.consumed_at IS NOT NULL\s+AND clock_timestamp\(\) >= NEW\.expires_at/.test(source)) {
    out.push("wall clock recheck");
  }
  if (!/BEFORE UPDATE ON identity_auth_handoffs/.test(source)) out.push("installed trigger");
  return out;
}

test("unregistered source draft remains absent from active barrel", () => {
  assert.doesNotMatch(active, /db01-auth-handoffs\.staged/);
  assert.match(trigger, /STAGED ONLY/);
});
test("handoff source uses keyed code rather than persisted bearer tokens", () => {
  assert.match(table, /code_mac varchar\(64\) NOT NULL/);
  assert.match(table, /identity_auth_handoffs_code_mac_uq/);
  assert.match(table, /interval '2 minutes'/);
  assert.match(schema, /identity_auth_handoffs_lifetime_ck/);
  for (const bad of ["access_token", "refresh_token", "session_cookie"]) {
    assert.doesNotMatch(schema, new RegExp(`(?:varchar|text)\\("${bad}"`));
  }
});
test("all 8 immutable target/scope values protected", () => {
  assert.deepEqual(missing(code), []);
});
test("mutating a user ownership check fails contract", () => {
  assert.ok(missing(code.replace("NEW.user_id IS DISTINCT FROM OLD.user_id", "false")).includes("user_id"));
});
test("mutating a host binding check fails contract", () => {
  assert.ok(missing(code.replace("NEW.target_host IS DISTINCT FROM OLD.target_host", "false")).includes("target_host"));
});
test("mutating a target membership check fails contract", () => {
  assert.ok(missing(code.replace("NEW.target_membership_id IS DISTINCT FROM OLD.target_membership_id", "false")).includes("target_membership_id"));
});
test("mutating a proof MAC binding check fails contract", () => {
  assert.ok(missing(code.replace("NEW.code_mac IS DISTINCT FROM OLD.code_mac", "false")).includes("code_mac"));
});
test("mutating deadline extension check fails contract", () => {
  assert.ok(missing(code.replace("NEW.expires_at > OLD.expires_at", "false")).includes("expiry monotone"));
});
test("mutating consumed terminal check fails contract", () => {
  assert.ok(missing(code.replace("OLD.consumed_at IS NOT NULL", "false")).includes("consumption terminal"));
});
test("transaction-start expiry check is NOT accepted as a wall-clock check", () => {
  assert.ok(missing(code.replace("clock_timestamp() >= NEW.expires_at", "now() >= NEW.expires_at")).includes("wall clock recheck"));
});
test("no staged destructive table, row or schema operations", () => {
  assert.doesNotMatch(code, /\b(?:DROP TABLE|TRUNCATE|DELETE FROM|ALTER TABLE)\b/i);
});
test("disposable PostgreSQL witness requires separate URL, opt-in, lock wait and cleanup", () => {
  assert.match(pgWitness, /DB01_HANDOFF_DISPOSABLE === "I_ACCEPT_DESTRUCTIVE_TEMP_SCHEMA"/);
  assert.match(pgWitness, /process\.env\.DATABASE_URL !== process\.env\.TEST_DATABASE_URL/);
  assert.match(pgWitness, /CREATE SCHEMA/);
  assert.match(pgWitness, /DROP SCHEMA/);
  assert.match(pgWitness, /wait_event_type === "Lock"/);
  assert.match(pgWitness, /second\.rowCount, 0/);
});
