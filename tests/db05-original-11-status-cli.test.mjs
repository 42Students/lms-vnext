import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const script = resolve(root, "scripts/db05-original-11-status.mjs");

test("original eleven CLI emits source reconciled but database-unverified counts", () => {
  const result = spawnSync(process.execPath, [script, "--json"], {
    cwd: root,
    encoding: "utf8",
  });
  assert.equal(result.status, 0, result.stderr || result.stdout);
  const report = JSON.parse(result.stdout);
  assert.equal(report.scope, "ORIGINAL_11_MISSING_FIELDS_ONLY");
  assert.equal(report.presentInLedger, 11);
  assert.equal(report.reconciledOriginal, 11);
  assert.equal(report.databaseVerified, 0);
  assert.equal(report.remainingDatabaseVerification, 11);
  assert.equal(report.acceptanceScenariosAuthored, 46);
  assert.equal(report.readyForDbGate, false);
  assert.deepEqual(report.ledgerErrors, []);
  assert.equal(report.items.length, 11);
  assert.ok(report.items.every((item) => !item.verified));
});

test("strict original-eleven gate fails closed while SQL remains unregistered", () => {
  const result = spawnSync(process.execPath, [script, "--strict", "--json"], {
    cwd: root,
    encoding: "utf8",
  });
  assert.equal(result.status, 2, result.stderr || result.stdout);
  const report = JSON.parse(result.stdout);
  assert.equal(report.readyForDbGate, false);
  assert.equal(report.remainingDatabaseVerification, 11);
  assert.ok(report.disclaimer.includes("not PostgreSQL"));
});

test("normal human-readable status does not mistake 11 source rows for database completion", () => {
  const result = spawnSync(process.execPath, [script], {
    cwd: root,
    encoding: "utf8",
  });
  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.match(result.stdout, /11\/11 reconciled, 0\/11 database verified/);
  assert.match(result.stdout, /NOT a replacement/);
});
