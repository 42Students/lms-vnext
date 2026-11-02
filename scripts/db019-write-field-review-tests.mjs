#!/usr/bin/env node
/**
 * Writes tests/db019-pXX-field-review.test.mjs for each unpicked package
 * using a standard template. Run once; re-running is idempotent (overwrites).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const tracker = JSON.parse(fs.readFileSync(path.join(root, "docs/tracker.json"), "utf8"));
const db019 = tracker.tasks.find(t => t.id === "DB-019");
const packages = db019.workPlan.packages.filter(p => !p.done && !p.picked && p.kind !== "GATE");

for (const pkg of packages) {
  const pkgShort = pkg.id.toLowerCase().replace("db19-", "");
  const reviewFile = `docs/planning/db019-${pkgShort}-field-review.json`;
  if (!fs.existsSync(path.join(root, reviewFile))) {
    console.log(`SKIP ${pkg.id}: no review JSON at ${reviewFile}`);
    continue;
  }

  const review = JSON.parse(fs.readFileSync(path.join(root, reviewFile), "utf8"));
  const tableList = (pkg.sourceTables || []).map(t => `"${t}"`).join(", ");
  const fieldCount = review.fields.length;
  const outPath = path.join(root, "tests", `db019-${pkgShort}-field-review.test.mjs`);

  const testCode = `import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = relative => JSON.parse(fs.readFileSync(path.join(root, relative), "utf8"));
const plan = read("${reviewFile}");
const source = read("${pkg.sourceInventory}");

const sourceTableNames = [${tableList}];

test("${pkg.id} exact ${fieldCount} identity census is complete, unique and pinned to source", () => {
  assert.equal(plan.id, "${pkg.id}");
  assert.equal(plan.sourceSha, "21bad59d4dfaf2fa11fdeaf9353327ce105697d5");
  assert.equal(plan.sourceFieldCount, ${fieldCount});
  assert.deepEqual(plan.sourceTables, sourceTableNames);
  assert.equal(plan.fields.length, ${fieldCount});

  const sourceRows = source.tables
    .filter(table => sourceTableNames.includes(table.table))
    .flatMap(table => table.rows);
  assert.equal(sourceRows.length, ${fieldCount}, "Source inventory must match expected field count");

  const identity = row => \`\${row.sourceTable ?? row.legacyTable}.\${row.sourceColumn ?? row.legacyColumn}\`;
  const expected = new Set(sourceRows.map(identity));
  const actual = new Set(plan.fields.map(identity));
  assert.equal(actual.size, ${fieldCount}, "No duplicate source column identities in review");
  assert.deepEqual(actual, expected, "No omitted, invented or misassigned ${pkg.id} source fields");
});

test("${pkg.id} every field has a targetCandidate and disposition", () => {
  for (const field of plan.fields) {
    assert.ok(
      typeof field.targetCandidate === "string" && field.targetCandidate.length > 0,
      \`\${field.sourceTable}.\${field.sourceColumn} must have a targetCandidate\`
    );
    assert.ok(
      typeof field.disposition === "string" && field.disposition.length > 0,
      \`\${field.sourceTable}.\${field.sourceColumn} must have a disposition\`
    );
    assert.equal(
      typeof field.semanticRisk, "string",
      \`\${field.sourceTable}.\${field.sourceColumn} must have semanticRisk\`
    );
    assert.equal(field.sourceVerifiedAtSha, "21bad59d4dfaf2fa11fdeaf9353327ce105697d5");
  }
});

test("${pkg.id} does not claim runtime verification (source-only at this gate)", () => {
  for (const field of plan.fields) {
    assert.equal(field.runtimeVerified, false,
      \`\${field.sourceTable}.\${field.sourceColumn}: runtimeVerified must be false at source gate\`);
    assert.equal(plan.runtimeVerifiedCount, 0);
  }
  assert.equal(plan.testEvidenceStatus, "SOURCE_QUALITY_GATE_ONLY_NOT_RUNTIME_CERTIFIED");
});

test("${pkg.id} source SHA pinned to frozen legacy backend", () => {
  const FROZEN_LEGACY_SHA = "21bad59d4dfaf2fa11fdeaf9353327ce105697d5";
  assert.equal(plan.sourceSha, FROZEN_LEGACY_SHA, "${pkg.id} source oracle must be pinned");
  assert.equal(source.sourceSha, FROZEN_LEGACY_SHA, "Source inventory must reference same frozen SHA");
  for (const field of plan.fields) {
    assert.equal(field.sourceVerifiedAtSha, FROZEN_LEGACY_SHA,
      \`\${field.sourceTable}.\${field.sourceColumn} must be verified at frozen SHA\`);
  }
});
`;

  fs.writeFileSync(outPath, testCode);
  console.log(`Written: tests/db019-${pkgShort}-field-review.test.mjs (${fieldCount} fields)`);
}
