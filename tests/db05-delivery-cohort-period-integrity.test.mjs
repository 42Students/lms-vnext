import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const sql = (name) =>
  readFileSync(new URL(`../scripts/sql/${name}.draft.sql`, import.meta.url), "utf8");
const schema = readFileSync(new URL("../src/db/schema/courses.ts", import.meta.url), "utf8");
const academics = readFileSync(new URL("../src/db/schema/academics.ts", import.meta.url), "utf8");

test("delivery belongs to an offering AND a section with matching cohort/period columns", () => {
  assert.match(schema, /export const courseOfferings = pgTable/);
  assert.match(schema, /cohortId: uuid\("cohort_id"\)/);
  assert.match(schema, /academicPeriodId: uuid\("academic_period_id"\)/);
  assert.match(schema, /export const courseSectionDeliveries = pgTable/);
  assert.match(schema, /sectionId: uuid\("section_id"\)/);
  assert.match(academics, /export const sections = pgTable/);
  assert.match(academics, /cohortId: uuid\("cohort_id"\)/);
  assert.match(academics, /academicPeriodId: uuid\("academic_period_id"\)/);
});

for (const scenario of [
  {
    name: "classroom-chat-parity",
    cohort: "offering_cohort_id IS DISTINCT FROM section_cohort_id",
    period: "offering_period_id IS DISTINCT FROM section_period_id",
    count: 1,
  },
  {
    name: "lesson-discussions-same-college",
    cohort: "section_cohort_id IS DISTINCT FROM offering_cohort_id",
    period: "section_period_id IS DISTINCT FROM offering_period_id",
    count: 1,
  },
  {
    name: "progress-same-college",
    cohort: "section_cohort_id IS DISTINCT FROM offering_cohort_id",
    period: "section_period_id IS DISTINCT FROM offering_period_id",
    count: 1,
  },
  {
    name: "course-receipt-college-scope",
    cohort: "delivery_section_cohort_id IS DISTINCT FROM target_cohort_id",
    period: "delivery_section_period_id IS DISTINCT FROM target_academic_period_id",
    count: 2,
  },
]) {
  test(`DB05 ${scenario.name}: reject same-college wrong cohort/academic period`, () => {
    const draft = sql(`db05-${scenario.name}`);
    assert.match(draft, /UNREGISTERED/);
    assert.match(draft, /course_section_deliveries/);
    assert.match(draft, /course_offerings/);
    assert.match(draft, /sections/);
    assert.equal(draft.split(scenario.cohort).length - 1, scenario.count,
      `${scenario.name}: cohort mismatch must be checked on every delivery path`);
    assert.equal(draft.split(scenario.period).length - 1, scenario.count,
      `${scenario.name}: academic-period mismatch must be checked on every delivery path`);
    assert.equal((draft.match(/^[ \t]*COMMIT;[ \t]*$/gm) ?? []).length, 1);
  });
}

test("receipt guard checks both target and submission delivery after their lookups", () => {
  const draft = sql("db05-course-receipt-college-scope");
  assert.equal((draft.match(/offering\.id, offering\.cohort_id, offering\.academic_period_id/g) ?? []).length, 2);
  assert.equal((draft.match(/section_row\.cohort_id, section_row\.academic_period_id/g) ?? []).length, 2);
  assert.match(draft, /NEW\.consumed_by_submission_id IS NOT NULL/);
  assert.match(draft, /submission_delivery_id IS DISTINCT FROM content_delivery_id/);
  assert.match(draft, /required_key_prefix := 'private\/'/);
});

test("readiness manifest explicitly blocks cohort-period PostgreSQL acceptance", () => {
  const readiness = JSON.parse(readFileSync(
    new URL("../docs/planning/db05-migration-readiness-manifest.json", import.meta.url), "utf8"));
  const matrix = readFileSync(
    new URL("../docs/planning/db05-delivery-cohort-period-negative-matrix.md", import.meta.url), "utf8");
  const gate = readiness.gates.find(item => item.id === "DB05_DELIVERY_COHORT_PERIOD_MATCH_PG_NEGATIVE");
  assert.ok(gate);
  assert.equal(gate.status, "NOT_RUN");
  assert.equal(gate.owner, 1);
  assert.match(gate.evidence, /22-case acceptance matrix/);
  assert.match(matrix, /ALL UNEXECUTED/);
  for (const caseId of ["CP-01", "CP-02", "CP-03", "CP-15", "CP-20", "CP-22"]) {
    assert.ok(matrix.includes(caseId), caseId);
  }
});
