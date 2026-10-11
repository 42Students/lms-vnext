import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const source = p => readFileSync(resolve(root, p), "utf8");
const sql = source("scripts/sql/db05-offering-delivery-scope.draft.sql");
const offering = source("src/modules/courses/offering-service.ts");
const delivery = source("src/modules/courses/delivery-service.ts");
const schema = source("src/db/schema/courses.ts");

test("DB05 offering/delivery scope guards are isolated, unregistered and not duplicate tables", () => {
  assert.match(sql, /UNREGISTERED COMPANION ONLY/);
  assert.match(sql, /Chat 1 owns Drizzle journal/);
  assert.match(sql, /CREATE OR REPLACE FUNCTION db05_course_offering_scope_guard/);
  assert.match(sql, /CREATE OR REPLACE FUNCTION db05_course_delivery_scope_guard/);
  assert.match(sql, /BEFORE INSERT OR UPDATE OF course_id, cohort_id, academic_period_id/);
  assert.match(sql, /BEFORE INSERT OR UPDATE OF offering_id, section_id/);
  assert.doesNotMatch(sql, /CREATE TABLE|ALTER TABLE|DROP TABLE/i);
  assert.match(schema, /export const courseOfferings = pgTable/);
  assert.match(schema, /export const courseSectionDeliveries = pgTable/);
});

test("DB05 offering guard models independent course, program, period and cohort boundaries", () => {
  for (const table of ["courses", "departments", "cohorts", "programs", "academic_periods", "course_offerings"]) {
    assert.match(sql, new RegExp("\\b" + table + "\\b"), table);
  }
  for (const term of [
    "course_college_id", "cohort_program_college_id", "offering_period_college_id",
    "cohort_start_college_id", "cohort_end_college_id",
    "current_period_start < cohort_start_date",
    "current_period_end > cohort_end_date",
  ]) assert.ok(sql.includes(term), term);
  assert.match(offering, /course\.collegeId !== cohort\.collegeId/);
  assert.match(offering, /course\.collegeId !== period\.collegeId/);
  assert.match(offering, /period\.startDate < startPeriod\.startDate/);
  assert.match(offering, /period\.endDate > endPeriod\.endDate/);
});

test("DB05 delivery guard enforces section's exact cohort and period, not just same college", () => {
  for (const term of [
    "offering_cohort_id IS DISTINCT FROM section_cohort_id",
    "offering_period_id IS DISTINCT FROM section_period_id",
    "offering_course_college_id IS DISTINCT FROM section_period_college_id",
    "offering_course_college_id IS DISTINCT FROM section_program_college_id",
  ]) {
    assert.ok(sql.includes(term), term);
  }
  assert.match(delivery, /offering\.cohortId !== section\.cohortId/);
  assert.match(delivery, /offering\.academicPeriodId !==\s*section\.academicPeriodId/);
  assert.match(delivery, /offering\.collegeId !== section\.collegeId/);
});

test("DB05 scoped offering/delivery triggers share transaction race discipline and remain unexecuted", () => {
  assert.match(sql, /pg_advisory_xact_lock\(605008003::bigint\)/);
  assert.match(sql, /current_setting\('transaction_isolation'\)/);
  assert.match(sql, /READ COMMITTED/);
  assert.match(sql, /USING ERRCODE = '23514'/);
  assert.match(sql, /USING ERRCODE = '25001'/);
  assert.match(sql, /NONE EXECUTED/);
  assert.match(sql, /upstream/i);
  assert.match(sql, /Two-session offering\/delivery insert-vs-parent-move/);
});

const manifest = JSON.parse(readFileSync(resolve(root, "docs/planning/db05-migration-readiness-manifest.json"), "utf8"));
const verifier = source("scripts/db05-migration-readiness.mjs");

test("DB05 offering/delivery companion must block migration readiness until actual PG proof", () => {
  const companion = manifest.crossDomainCompanions.find(
    item => item.id === "DB05_OFFERING_DELIVERY_DIRECT_WRITE_SCOPE"
  );
  assert.ok(companion);
  assert.equal(companion.path, "scripts/sql/db05-offering-delivery-scope.draft.sql");
  assert.equal(companion.registered, false);
  assert.equal(companion.postgresExecuted, false);
  assert.equal(companion.readyForProduction, false);
  assert.ok(manifest.gates.some(g =>
    g.id === "DB05_OFFERING_DELIVERY_CROSS_COLLEGE_AND_COHORT_TERM_NEGATIVES" &&
    g.status === "NOT_RUN"
  ));
  assert.ok(manifest.gates.some(g =>
    g.id === "DB05_OFFERING_DELIVERY_UPSTREAM_GRAPH_RACE" && g.status === "NOT_RUN"
  ));
  assert.match(verifier, /manifest\.crossDomainCompanions/);
  assert.match(verifier, /Companion NOT acceptance-ready/);
  assert.equal(manifest.artifacts.length, 7);
});

test("DB05 executed pure offering reference cases never promote PostgreSQL gate", () => {
  const evidence = manifest.executedSourceReferenceSuites.find(
    row => row.id === "DB05_OFFERING_DELIVERY_SOURCE_REFERENCE"
  );
  assert.equal(evidence.testCount, 26);
  assert.equal(evidence.passed, 26);
  assert.equal(evidence.failed, 0);
  assert.equal(evidence.countsForPgGate, false);
  assert.equal(evidence.countsForApplicationIntegration, false);
  assert.equal(manifest.sourceReferenceTotals.countsForDatabasePromotion, false);
});

test("DB05 INSERT-only source lifecycle checks preserve history on later close/archive", () => {
  assert.match(sql, /IF TG_OP = 'INSERT' AND \(/);
  assert.match(sql, /course_status IS DISTINCT FROM 'ACTIVE'/);
  assert.match(sql, /cohort_status NOT IN \('PLANNED', 'ACTIVE'\)/);
  assert.match(sql, /period_status IS DISTINCT FROM 'PLANNED'/);
  assert.match(sql, /offering_status IS DISTINCT FROM 'ACTIVE'/);
  assert.match(sql, /section_status IS DISTINCT FROM 'ACTIVE'/);
  assert.match(sql, /historical|Historic/i);
  assert.match(offering, /cohort\.status !== "PLANNED"/);
  assert.match(offering, /period\.status === "CLOSED"/);
  assert.match(delivery, /section\.status !== "ACTIVE"/);
});
