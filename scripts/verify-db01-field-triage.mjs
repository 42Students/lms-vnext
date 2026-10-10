#!/usr/bin/env node
/**
 * DB-004 source-census consistency check, not a PostgreSQL parity test.
 * Safe to run without DB/provider credentials:
 *   node scripts/verify-db01-field-triage.mjs
 */
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const projectRoot = resolve(import.meta.dirname, "..");
const inventoryPath = "docs/planning/db-pass4-columns-db01_identity_and_tenancy.json";
const ledgerPath = "docs/planning/db01-chat02-312-field-source-triage.json";
const readBuffer = (path) => readFileSync(resolve(projectRoot, path));
const parse = (path) => JSON.parse(readBuffer(path).toString("utf8"));
const inventory = parse(inventoryPath);
const ledger = parse(ledgerPath);

const rows = inventory.tables.flatMap((table) =>
  table.rows.map((row) => ({
    key: `${table.table}.${row.legacyColumn}`,
    row,
  })),
);
const keyOf = (entry) => `${entry.legacyTable}.${entry.legacyColumn}`;
const uniqueKeys = (array) => new Set(array);

assert.equal(ledger.globalPhase, "DATABASE");
assert.equal(ledger.taskId, "DB-004");
assert.equal(inventory.tables.length, ledger.summary.candidateTables);
assert.equal(rows.length, inventory.counts.fields);
assert.equal(ledger.rows.length, rows.length);
assert.equal(uniqueKeys(rows.map(({ key }) => key)).size, rows.length, "duplicate source field");
assert.equal(uniqueKeys(ledger.rows.map(keyOf)).size, ledger.rows.length, "duplicate triage field");

const originalBuffer = readBuffer(inventoryPath);
const sourceBlobHash = createHash("sha1")
  .update(`blob ${originalBuffer.length}\0`)
  .update(originalBuffer)
  .digest("hex");
assert.equal(
  ledger.sourceInventory.blobSha,
  sourceBlobHash,
  "DB01 source inventory moved: refresh ledger and re-audit changes",
);
assert.equal(ledger.sourceInventory.legacyBackendSha, inventory.sourceSha);
const lookup = new Map(ledger.rows.map((row) => [keyOf(row), row]));
const classes = {};
for (const { key, row } of rows) {
  const entry = lookup.get(key);
  assert.ok(entry, `missing source row: ${key}`);
  assert.equal(entry.sourceType, row.sourceType, `source type drift: ${key}`);
  assert.equal(entry.sourceNullable, row.nullable, `nullable drift: ${key}`);
  assert.deepEqual(entry.sourceRiskFlags, row.riskFlags ?? [], `risk drift: ${key}`);
  assert.ok(entry.category, `untriaged category: ${key}`);
  assert.ok(entry.rationaleOrBlocker, `empty rationale: ${key}`);
  assert.equal(entry.reviewStatus, "SOURCE_TRIAGE_ONLY_NOT_RUNTIME_VERIFIED");
  assert.equal(entry.verificationEvidence, null, "unearned runtime evidence");
  classes[entry.category] = (classes[entry.category] ?? 0) + 1;
}
assert.deepEqual(classes, ledger.summary.classifications);
assert.equal(ledger.summary.sourceTriageRows, rows.length);
assert.equal(ledger.summary.runtimeSemanticVerifiedFields, 0);
assert.equal(ledger.summary.dbTestsExecuted, 0);
for (const field of [
  "college_branding.login_background_url_mobile",
  "tenant_domain.last_found_values",
  "recruiter_college_access.valid_until",
  "recruiter_college_access_capability.capability",
  "user_session.jti",
]) {
  assert.ok(lookup.has(field), `missing high-risk source field: ${field}`);
}
for (const field of [
  "college_branding.login_background_url_mobile",
  "tenant_domain.last_found_values",
]) {
  assert.equal(lookup.get(field).category, "STAGED_CANDIDATE_UNVERIFIED");
}
assert.equal(
  lookup.get("user_session.jti").category,
  "IDENTITY_PROVIDER_OR_SESSION_DECISION",
);
const schemaIndex = readBuffer("src/db/schema/index.ts").toString("utf8");
assert.ok(
  !schemaIndex.includes("./db01-tenant-branding.staged"),
  "Staged table was exported without migration-gate review",
);
console.log(
  "DB01 SOURCE TRIAGE CONSISTENT: " +
  `${inventory.tables.length} source table candidates, ${rows.length} fields, ` +
  "0 runtime-verified. This does NOT pass PostgreSQL/semantic parity.",
);
