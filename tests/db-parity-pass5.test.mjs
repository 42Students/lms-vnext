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


test("DB15 race probes remain explicit and never masquerade as executed evidence", () => {
  assert.equal(manifest.raceProbes.length, 23);
  assert.equal(new Set(manifest.raceProbes.map(p => p.id)).size, 23);
  const allowed = new Set([
    "SOURCE_CONFIRMED_GAP",
    "SOURCE_PROTECTED_NEEDS_EXECUTION",
    "SOURCE_PROTECTED_DRAFT_UNMIGRATED",
    "PARTIAL_SOURCE_PROTECTION_DISPATCHER_GAP",
    "DRAFT_UNIMPLEMENTED",
    "SOURCE_POLICY_UNDECIDED",
  ]);
  for (const p of manifest.raceProbes) {
    assert.match(p.id, /^P5-R\\d{2}$/);
    assert.ok(allowed.has(p.state), p.id + ": unexpected state " + p.state);
    assert.equal(p.executionEvidence, "NOT_RUN");
    assert.ok(
      p.requiredWitness && p.requiredWitness.length > 40,
      p.id + ": witness is underspecified",
    );
    for (const source of p.source.split(";").map(s => s.trim()).filter(Boolean)) {
      assert.ok(
        fs.existsSync(source),
        p.id + ": source path does not exist: " + source,
      );
    }
  }

  const count = state =>
    manifest.raceProbes.filter(p => p.state === state).length;
  assert.equal(count("SOURCE_CONFIRMED_GAP"), 4);
  assert.equal(count("SOURCE_PROTECTED_NEEDS_EXECUTION"), 13);
  assert.equal(count("SOURCE_PROTECTED_DRAFT_UNMIGRATED"), 3);
  assert.equal(count("PARTIAL_SOURCE_PROTECTION_DISPATCHER_GAP"), 1);
  assert.equal(count("DRAFT_UNIMPLEMENTED"), 1);
  assert.equal(count("SOURCE_POLICY_UNDECIDED"), 1);
  assert.deepEqual(
    manifest.raceProbes
      .filter(p => p.state === "SOURCE_CONFIRMED_GAP")
      .map(p => p.id),
    ["P5-R01", "P5-R02", "P5-R11", "P5-R21"],
  );
  assert.equal(manifest.raceAudit.runtimeVerified, 0);
  assert.deepEqual(
    manifest.raceAudit.blockingGaps,
    ["P5-R01", "P5-R02", "P5-R09", "P5-R10", "P5-R11", "P5-R21", "P5-R22"],
  );
});
