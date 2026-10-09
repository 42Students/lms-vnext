import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import test from "node:test";
import { validateDB08Ledger } from "../scripts/db08-parity-status.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const source = JSON.parse(readFileSync(join(root, "docs/planning/db-pass4-columns-db08_placement_policy_and_outcomes.json"), "utf8"));
const ledger = JSON.parse(readFileSync(join(root, "docs/planning/database-parity-db08-field-ledger.json"), "utf8"));
const copy = value => structuredClone(value);

test("DB08 census cannot lose a table or any of 280 legacy fields", () => {
  const status = validateDB08Ledger(source, ledger);
  assert.equal(status.tables, 18);
  assert.equal(status.sourceFieldCandidates, 280);
  assert.equal(status.statusCounts.UNVERIFIED, 280);
  assert.equal(status.readyForParityCertification, false);
});

test("DB08 field deletions are a tracking failure", () => {
  const shortened = copy(ledger);
  shortened.tables[0].fields.pop();
  shortened.tables[0].fieldCount--;
  assert.throws(() => validateDB08Ledger(source, shortened),
    /unmapped legacy candidate disappeared/);
});

test("DB08 verified status cannot be claimed without mapping and evidence", () => {
  const falseCompletion = copy(ledger);
  falseCompletion.tables[0].fields[0].status = "DB_TESTED";
  falseCompletion.gate.fieldsUnverified--;
  assert.throws(() => validateDB08Ledger(source, falseCompletion),
    /cannot be DB_TESTED without verified mapping/);
});

test("DB08 field retirement requires explicit approval", () => {
  const unsafeRetirement = copy(ledger);
  unsafeRetirement.tables[0].fields[0].status = "RETIRED";
  unsafeRetirement.gate.fieldsUnverified--;
  unsafeRetirement.counts.verifiedFields++;
  assert.throws(() => validateDB08Ledger(source, unsafeRetirement),
    /cannot be RETIRED without explicit approved decision/);
});
