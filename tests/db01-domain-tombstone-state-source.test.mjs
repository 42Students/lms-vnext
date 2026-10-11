import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const read = relative => readFileSync(resolve(root, relative), "utf8");
const proposal = read("docs/planning/sql/db01-tenant-domain-tombstone-staging.sql");
const guard = read("docs/planning/sql/db01-domain-tombstone-state-guard-staging.sql");
const active = read("src/db/schema/tenant-domains.ts");
const repo = read("src/modules/tenant-domains/repository.ts");
const pg = read("tests/db01-domain-tombstone-state-pg.test.mjs");
const stripComments = source => source.replace(/^\s*--[^\n]*$/gm, "");

const checks = [
  ["terminal tombstone", /OLD\.deleted_at IS NOT NULL/],
  ["terminal exception", /db01_domain_tombstone_terminal_ck/],
  ["tenant immutable", /NEW\.college_id IS DISTINCT FROM OLD\.college_id/],
  ["tenant exception", /db01_domain_college_immutable_ck/],
  ["tombstone primary reset", /NEW\.is_primary IS DISTINCT FROM false/],
  ["tombstone history", /db01_domain_tombstone_history_ck/],
  ["old host preserved at deletion", /NEW\.host IS DISTINCT FROM OLD\.host/],
  ["proof timestamp preserved at deletion", /NEW\.verified_at IS DISTINCT FROM OLD\.verified_at/],
  ["tombstone secret erased", /NEW\.verification_token IS NOT NULL/],
  ["host change requires different token", /NEW\.verification_token IS NOT DISTINCT FROM OLD\.verification_token/],
  ["host change clears verified state", /NEW\.is_verified IS DISTINCT FROM false/],
  ["host change clears check timestamp", /NEW\.last_checked_at IS NOT NULL/],
  ["hostname proof exception", /db01_domain_host_change_proof_reset_ck/],
  ["installed update trigger", /BEFORE UPDATE ON tenant_domains/],
  ["installed hard delete trigger", /BEFORE DELETE ON tenant_domains/],
  ["hard delete forbidden", /db01_domain_hard_delete_forbidden_ck/],
];
function missing(source) {
  const code = stripComments(source);
  return checks.filter(([, regex]) => !regex.test(code)).map(([label]) => label);
}

test("staged tombstone state guard contains every required SQL transition invariant", () => {
  assert.deepEqual(missing(guard), []);
});
test("tombstone history fields exist in companion candidate SQL", () => {
  assert.match(proposal, /ADD COLUMN deleted_at timestamptz/);
  assert.match(proposal, /ADD COLUMN deleted_by_user_id uuid/);
  assert.match(proposal, /tenant_domains_deleted_nonprimary_ck/);
  assert.match(proposal, /tenant_domains_deletion_metadata_ck/);
});
test("existing global hostname uniqueness must not be relaxed", () => {
  assert.match(active, /uniqueIndex\("tenant_domains_host_uq"\)/);
  assert.doesNotMatch(stripComments(guard), /\bDROP INDEX\b/i);
});
test("staged contract not silently activated while hard-delete repository exists", () => {
  assert.doesNotMatch(active, /deletedAt: timestamp\("deleted_at"/);
  assert.match(repo, /\.delete\(tenantDomains\)/);
  assert.match(guard, /STAGED ONLY/);
});
test("delete-vs-verify stale writer is blocked at SQL row lock", () => {
  assert.match(guard, /OLD\.deleted_at IS NOT NULL/);
  assert.match(guard, /BEFORE UPDATE ON tenant_domains/);
  assert.match(pg, /wait_event_type === "Lock"/);
});
test("mutating terminal tombstone check fails source invariant", () => {
  assert.ok(missing(guard.replace("OLD.deleted_at IS NOT NULL", "FALSE")).includes("terminal tombstone"));
});
test("mutating tenant ownership guard fails source invariant", () => {
  assert.ok(missing(guard.replace("NEW.college_id IS DISTINCT FROM OLD.college_id", "FALSE")).includes("tenant immutable"));
});
test("mutating primary reset guard fails source invariant", () => {
  assert.ok(missing(guard.replace("NEW.is_primary IS DISTINCT FROM false", "FALSE")).includes("tombstone primary reset"));
});
test("mutating historical proof preservation fails source invariant", () => {
  assert.ok(missing(guard.replace("NEW.verified_at IS DISTINCT FROM OLD.verified_at", "FALSE")).includes("proof timestamp preserved at deletion"));
});
test("mutating tombstone secret erasure fails source invariant", () => {
  assert.ok(missing(guard.replace("NEW.verification_token IS NOT NULL", "FALSE")).includes("tombstone secret erased"));
});
test("mutating host new-token check fails source invariant", () => {
  assert.ok(missing(guard.replace("NEW.verification_token IS NOT DISTINCT FROM OLD.verification_token", "FALSE")).includes("host change requires different token"));
});
test("mutating verification reset fails source invariant", () => {
  assert.ok(missing(guard.replace("NEW.is_verified IS DISTINCT FROM false", "FALSE")).includes("host change clears verified state"));
});
test("mutating hard-delete prevention fails source invariant", () => {
  assert.ok(missing(guard.replace("BEFORE DELETE ON tenant_domains", "BEFORE INSERT ON tenant_domains")).includes("installed hard delete trigger"));
});
test("source guard SQL never changes existing rows or migration schema", () => {
  assert.doesNotMatch(stripComments(guard), /\b(?:DELETE FROM|TRUNCATE|DROP TABLE|UPDATE tenant_domains SET)\b/i);
});
test("Postgres witness is strictly separate, opt-in, isolated, and cleans up", () => {
  assert.match(pg, /DB01_DOMAIN_DISPOSABLE === "I_ACCEPT_DESTRUCTIVE_TEMP_SCHEMA"/);
  assert.match(pg, /process\.env\.DATABASE_URL !== process\.env\.TEST_DATABASE_URL/);
  assert.match(pg, /CREATE SCHEMA/);
  assert.match(pg, /DROP SCHEMA/);
});
