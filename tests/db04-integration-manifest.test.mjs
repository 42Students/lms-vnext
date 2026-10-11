import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (p) => fs.readFileSync(path.join(root, p), "utf8");
const manifest = JSON.parse(
  read("docs/planning/db04-migration-integration-manifest.json"),
);
const barrel = read("src/db/schema/index.ts");
const verification = read("src/db/schema/profile-verification.ts");
const stagedSql = read("docs/planning/db04-proposed-migration.sql");

test("DB04 promotion graph is explicit and cycle-free", () => {
  assert.equal(manifest.task, "DB-007");
  assert.equal(manifest.globalPhase, "DATABASE");
  assert.equal(manifest.state, "STAGED_UNREGISTERED_NOT_EXECUTED");

  const all = [...manifest.parentKeys, ...manifest.candidates];
  const byId = new Map(all.map((x) => [x.id, x]));
  assert.equal(byId.size, all.length, "duplicate DB04 manifest id");

  const visiting = new Set();
  const visited = new Set();
  const visit = (id) => {
    if (visited.has(id)) return;
    assert.ok(!visiting.has(id), `cyclic DB04 dependency: ${id}`);
    const item = byId.get(id);
    assert.ok(item, `unknown DB04 dependency: ${id}`);
    visiting.add(id);
    for (const dep of item.dependencies ?? []) visit(dep);
    visiting.delete(id);
    visited.add(id);
  };
  for (const item of all) visit(item.id);
  assert.equal(visited.size, all.length);
});

test("DB04 staged declarations exist but are not silently promoted", () => {
  for (const item of manifest.candidates) {
    assert.ok(read(item.schema).length > 0, item.schema);
    assert.ok(read(item.stagingSql).length > 0, item.stagingSql);
    assert.ok(item.tests.length > 0, item.id);
  }
  assert.doesNotMatch(
    barrel,
    /db04-profile-education-images\.staged/,
    "W01 must explicitly promote DB04 staged education/image schema",
  );
});

test("DB04 receipt composite parents required by child FKs are staged", () => {
  for (const name of [
    "profile_private_doc_id_owner_uq",
    "profile_private_doc_id_owner_purpose_uq",
  ]) {
    assert.match(verification, new RegExp(name));
    assert.match(stagedSql, new RegExp(name));
  }
  assert.match(stagedSql, /learner_profile_education_documents_receipt_fk/);
  assert.match(stagedSql, /learner_profile_images_receipt_fk/);
});

test("DB04 manifest cannot convert staging into runtime verification", () => {
  assert.equal(manifest.inventory.sourceCandidates, 103);
  assert.equal(manifest.inventory.sourceDispositionReviewed, 103);
  assert.equal(manifest.inventory.historicalRetirementSourceEvidenceStrongFields, 33);
  assert.equal(manifest.inventory.approvedRetirements, 0);
  assert.equal(manifest.inventory.runtimeSemanticVerified, 0);

  const r = manifest.readiness;
  assert.equal(r.schemaBarrelExported, false);
  assert.equal(r.numberedMigrationRegistered, false);
  assert.equal(r.disposablePostgresCleanReplayPassed, false);
  assert.equal(r.postgresNegativeOrConcurrencyTestsPassing, false);
  assert.equal(r.runtimeProducerConsumerVerified, false);
  assert.equal(r.historicalRetirementsApproved, false);
  assert.equal(r.phaseGateReady, false);
});
