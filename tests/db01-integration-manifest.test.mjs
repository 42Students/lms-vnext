import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (p) => readFileSync(path.join(root, p), "utf8");
const manifest = JSON.parse(
  read("docs/planning/db01-chat02-migration-integration-manifest.json"),
);
const barrel = read("src/db/schema/index.ts");

test("DB01 promotion dependency graph is explicit and cycle-free", () => {
  assert.equal(manifest.globalPhase, "DATABASE");
  assert.equal(manifest.task, "DB-004");
  assert.equal(manifest.state, "STAGED_UNREGISTERED_NOT_EXECUTED");
  const all = [...manifest.parentKeys, ...manifest.candidates];
  const byId = new Map(all.map((item) => [item.id, item]));
  assert.equal(byId.size, all.length, "duplicate promotion candidate ID");
  const visited = new Set();
  const visiting = new Set();
  function visit(id) {
    if (visited.has(id)) return;
    assert.ok(!visiting.has(id), `cyclic DB01 staged dependency: ${id}`);
    const item = byId.get(id);
    assert.ok(item, `unknown DB01 staged dependency: ${id}`);
    visiting.add(id);
    for (const prerequisite of item.dependencies || []) visit(prerequisite);
    visiting.delete(id);
    visited.add(id);
  }
  for (const item of all) visit(item.id);
  assert.equal(visited.size, all.length);
});

test("DB01 staged schema declarations and migration inputs exist", () => {
  for (const item of manifest.candidates) {
    const ts = read(item.schema);
    const sql = read(item.stagingSql);
    assert.ok(ts.length > 0, item.schema);
    assert.ok(sql.length > 0, item.stagingSql);
    assert.ok(item.decision && item.tests.length > 0, item.id);
    if (item.schema.includes(".staged.ts")) {
      const specifier = "./" + path.basename(item.schema, ".ts");
      assert.ok(!barrel.includes(specifier), `promoted without gate: ${specifier}`);
    }
  }
});

test("DB01 scoped foreign keys require valid unique composite parents", () => {
  const fkSql = read("docs/planning/sql/db01-auth-tenant-composite-fks-staging.sql");
  const memberships = read("src/db/schema/memberships.ts");
  const domains = read("src/db/schema/tenant-domains.ts");
  assert.match(fkSql, /UNIQUE \(id, user_id, college_id\)/);
  assert.match(fkSql, /UNIQUE \(id, college_id\)/);
  assert.match(fkSql, /FOREIGN KEY \(membership_id, user_id, college_id\)/);
  assert.match(fkSql, /FOREIGN KEY \(target_domain_id, college_id\)/);
  assert.ok(!memberships.includes("college_memberships_id_user_college_uq"));
  assert.ok(!domains.includes("tenant_domains_id_college_uq"));
  for (const item of ["DB01-OTP-FK", "DB01-HANDOFF-FK"]) {
    const ref = manifest.candidates.find((r) => r.id === item);
    assert.ok(ref?.dependencies.includes("DB01-UK-MEMBERSHIP"));
  }
});

test("DB01 manifest cannot equate source staging with executed DB acceptance", () => {
  const r = manifest.readiness;
  assert.equal(manifest.inventory.sourceDispositioned, 312);
  assert.equal(manifest.inventory.vnextRuntimeSemanticVerified, 0);
  assert.equal(r.phaseGateReady, false);
  assert.equal(r.numberedMigrationRegistered, false);
  assert.equal(r.disposablePostgresCleanReplayPassed, false);
  assert.equal(r.postgresNegativeOrConcurrencyTestsPassing, false);
  assert.equal(r.providerEndToEndVerified, false);
  assert.ok(manifest.deprecatedAlternatives.every((a) =>
    a.state === "CLOSED_UNMERGED_SUPERSEDED",
  ));
});
