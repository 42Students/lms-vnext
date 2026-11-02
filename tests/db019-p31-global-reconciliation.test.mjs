// DB19-P31: Global 2,829-field semantic disposition reconciliation gate.
// Verifies all 31 domain packages are done, source field counts total 2,829,
// source SHA is pinned to the frozen legacy backend, and no package claims
// runtime verification at this gate.
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const tracker = JSON.parse(fs.readFileSync(path.join(root, "docs/tracker.json"), "utf8"));
const db019 = tracker.tasks.find(t => t.id === "DB-019");
const FROZEN_SHA = "21bad59d4dfaf2fa11fdeaf9353327ce105697d5";
const EXPECTED_TOTAL = 2829;

const domainPackages = db019.workPlan.packages.filter(p => p.kind !== "GATE");
const gatePackages = db019.workPlan.packages.filter(p => p.kind === "GATE");

test("DB19-P31 all 31 domain packages are marked done=true with acceptance evidence", () => {
  const notDone = domainPackages.filter(p => !p.done);
  assert.equal(notDone.length, 0,
    `Packages not done: ${notDone.map(p => p.id).join(", ")}`);
  assert.equal(domainPackages.length, 31, "Expected exactly 31 domain packages");

  for (const pkg of domainPackages) {
    assert.ok(pkg.acceptanceEvidence && pkg.acceptanceEvidence.length > 0,
      `${pkg.id} has no acceptanceEvidence`);
    assert.ok(pkg.acceptedAt, `${pkg.id} missing acceptedAt`);
  }
});

test("DB19-P31 domain packages total exactly 2,829 source fields", () => {
  const total = domainPackages.reduce((sum, p) => sum + (p.sourceFieldCount || 0), 0);
  assert.equal(total, EXPECTED_TOTAL,
    `Expected ${EXPECTED_TOTAL} total source fields, got ${total}`);
});

test("DB19-P31 frozen legacy backend SHA is consistent across all packages", () => {
  assert.equal(db019.workPlan.frozenLegacyBackendSha, FROZEN_SHA,
    "Tracker frozenLegacyBackendSha must match canonical value");
});

test("DB19-P31 no domain package claims full runtime verification at this gate", () => {
  // Source-only evidence is acceptable; packages must not claim runtimeVerified
  // at the global gate before P32 runs.
  for (const pkg of domainPackages) {
    for (const ev of (pkg.acceptanceEvidence || [])) {
      assert.ok(
        !ev.kind?.includes("RUNTIME_CERTIFIED") || ev.kind?.includes("SCOPED"),
        `${pkg.id} evidence ${ev.kind} claims global runtime certification before P32`
      );
    }
  }
});

test("DB19-P31 gate dependencies are satisfied (P01-P30 done)", () => {
  const p31 = gatePackages.find(p => p.id === "DB19-P31");
  assert.ok(p31, "P31 gate entry must exist");
  const deps = p31.dependsOn || [];
  const notDone = deps.filter(depId => {
    const dep = db019.workPlan.packages.find(p => p.id === depId);
    return !dep || !dep.done;
  });
  assert.equal(notDone.length, 0,
    `P31 dependencies not done: ${notDone.join(", ")}`);
});

test("DB19-P31 each domain package has a source inventory and title", () => {
  for (const pkg of domainPackages) {
    assert.ok(pkg.title && pkg.title.length > 0, `${pkg.id} missing title`);
    assert.ok(pkg.acceptanceEvidence && pkg.acceptanceEvidence.length > 0,
      `${pkg.id} missing acceptanceEvidence`);
    for (const ev of pkg.acceptanceEvidence) {
      assert.ok(ev.runUrl?.startsWith("https://github.com/"),
        `${pkg.id} evidence runUrl must be a GitHub Actions URL`);
      assert.ok(ev.commitSha?.length === 40, `${pkg.id} evidence commitSha must be 40 hex chars`);
    }
  }
});
