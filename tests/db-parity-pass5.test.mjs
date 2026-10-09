import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
const load = f => JSON.parse(fs.readFileSync(f, "utf8"));
const manifest = load("docs/planning/database-parity-pass5-probe-manifest.json");
const snapshot = load("drizzle/meta/0036_snapshot.json");
const sql = fs.readFileSync("scripts/sql/vnext-pass5-relational-witness.sql", "utf8");

test("21 Pass 5 witnesses have grounded SQL table and column references", () => {
  assert.equal(manifest.probes.length, 21);
  assert.equal(new Set(manifest.probes.map(p => p.id)).size, 21);
  for (const p of manifest.probes) {
    assert.equal(p.executionEvidence, "NOT_RUN");
    assert.equal(p.expectedViolations, 0);
    assert.match(sql, new RegExp("'check_id','" + p.id + "'"));
    assert.ok(sql.includes("FROM " + p.from + " WHERE " + p.where));
    for (const ref of p.references) {
      const [alias, col] = ref.split(".");
      const table = p.tableAliases[alias];
      assert.ok(snapshot.tables["public." + table]?.columns[col], p.id + ": " + ref);
    }
  }
});

test("witnesses cannot be mistaken for an executed release gate", () => {
  assert.equal(manifest.status, "SOURCE_REVIEW_READY_EXECUTION_NOT_RUN");
  assert.match(sql, /BEGIN TRANSACTION READ ONLY;/);
  assert.match(sql, /Zero counts do NOT prove protection/);
  assert.ok(manifest.probes.every(p => p.executionEvidence === "NOT_RUN"));
});
