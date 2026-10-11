import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const read = (path) => readFileSync(resolve(root, path), "utf8");
const sql = read("scripts/sql/db05-offering-delivery-preflight.readonly.sql");
const manifest = JSON.parse(read("docs/planning/db05-migration-readiness-manifest.json"));

test("DB05 existing-row preflight is read-only and does not disclose row identities", () => {
  assert.match(sql, /READ-ONLY PRE-INTEGRATION POSTGRES PREFLIGHT/);
  assert.match(sql, /BEGIN TRANSACTION READ ONLY/);
  assert.match(sql, /WITH offering_scope AS/);
  assert.match(sql, /WITH delivery_scope AS/);
  assert.doesNotMatch(sql.replace(/--[^\n]*/g, ""), /\b(?:INSERT|UPDATE|DELETE|ALTER|DROP|TRUNCATE|CREATE|COPY)\s+/i);
  assert.doesNotMatch(sql, /SELECT\s+\*/i);
});

test("DB05 preflight detects both same-college term and cross-college mismatches", () => {
  for (const word of [
    "cohort_program_college",
    "cohort_start_college",
    "cohort_end_college",
    "cohort_date_bounds_mismatches",
    "wrong_section_cohort_mismatches",
    "wrong_section_term_mismatches",
    "cross_college_mismatches",
  ]) assert.ok(sql.includes(word), word);
  assert.match(sql, /cohort\.expected_end_period_id IS NOT NULL/);
  assert.match(sql, /count\(\*\) FILTER/);
});

test("DB05 preflight never substitutes for executed PostgreSQL gate", () => {
  const companion = manifest.crossDomainCompanions.find(
    x => x.id === "DB05_OFFERING_DELIVERY_DIRECT_WRITE_SCOPE"
  );
  assert.ok(companion);
  assert.equal(companion.registered, false);
  assert.equal(companion.postgresExecuted, false);
  assert.equal(companion.readyForProduction, false);
});
