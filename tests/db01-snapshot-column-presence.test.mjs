import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (file) => readFileSync(path.join(root, file));
const parsed = (file) => JSON.parse(read(file).toString("utf8"));
const proof = parsed("docs/planning/db01-chat02-snapshot-column-presence.json");
const source = parsed(proof.source.sourceLedger);
const snapshot = parsed(proof.source.drizzleSnapshot);
const allTables = new Map(Object.values(snapshot.tables).map((t) => [
  t.name,
  t.columns,
]));
const blob = (data) => createHash("sha1")
  .update(`blob ${data.length}\0`)
  .update(data)
  .digest("hex");
const key = (r) => `${r.legacyTable}.${r.legacyColumn}`;

test("DB01 snapshot presence evidence never survives changed oracles silently", () => {
  assert.equal(
    blob(read(proof.source.sourceLedger)),
    proof.source.sourceLedgerBlobSha,
  );
  assert.equal(
    blob(read(proof.source.drizzleSnapshot)),
    proof.source.snapshotBlobSha,
  );
  assert.equal(proof.source.legacyBackendSha, source.sourceInventory.legacyBackendSha);
  assert.equal(proof.counts.legacyCandidateRows, 312);
  assert.equal(proof.counts.runtimeSemanticVerified, 0);
  assert.equal(proof.counts.executedPostgresTests, 0);
});

test("DB01 all field candidates have explicit structural presence status", () => {
  assert.equal(proof.rows.length, source.rows.length);
  const byKey = new Map(proof.rows.map((r) => [r.legacyField, r]));
  assert.equal(byKey.size, proof.rows.length);
  let total = {};
  let active = {};
  for (const r of source.rows) {
    const item = byKey.get(key(r));
    assert.ok(item, `missing structural proof: ${key(r)}`);
    assert.equal(item.sourceCandidateTarget, r.candidateTarget);
    assert.equal(item.sourceActiveStatus, r.postV150Active);
    const target = r.candidateTarget;
    let expected = "NO_TARGET_PROPOSED";
    if (target) {
      if (target.includes("(STAGED")) {
        expected = "STAGED_NOT_IN_REGISTERED_SNAPSHOT";
      } else {
        const match = target.match(/^([a-z_][a-z0-9_]*)\.([a-z_][a-z0-9_]*)$/);
        if (match) {
          expected = allTables.get(match[1])?.[match[2]]
            ? "SINGLE_COLUMN_DECLARED_IN_SNAPSHOT"
            : "SINGLE_COLUMN_ABSENT_FROM_SNAPSHOT";
        } else {
          expected = "NORMALIZED_EXPRESSION_REQUIRES_SEMANTIC_PROOF";
        }
      }
    }
    assert.equal(item.structuralStatus, expected, key(r));
    if (expected === "SINGLE_COLUMN_DECLARED_IN_SNAPSHOT") {
      assert.ok(item.presence?.table);
      assert.ok(item.presence?.pgType);
    } else {
      assert.equal(item.presence, null);
    }
    total[expected] = (total[expected] || 0) + 1;
    if (["ACTIVE_WORKFLOW_CONFIRMED", "ACTIVE_PERSISTENCE_LIFECYCLE_CONFIRMED"].includes(r.postV150Active)) {
      active[expected] = (active[expected] || 0) + 1;
    }
  }
  assert.deepEqual(total, proof.counts.byStatus);
  assert.deepEqual(active, proof.counts.activeOrLifecycleByStatus);
  assert.equal(Object.values(total).reduce((a, b) => a+b, 0), 312);
});

test("DB01 physical snapshot presence is not runtime semantic acceptance", () => {
  assert.equal(proof.counts.runtimeSemanticVerified, 0);
  assert.equal(proof.counts.executedPostgresTests, 0);
  assert.equal(
    proof.counts.byStatus.SINGLE_COLUMN_ABSENT_FROM_SNAPSHOT || 0,
    0,
  );
  assert.ok(proof.rules.some((r) => r.includes("Single-column presence is not")));
});
