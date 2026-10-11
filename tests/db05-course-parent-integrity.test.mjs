import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";

const url = (path) => new URL(path, import.meta.url);
const read = (path) => readFileSync(url(path), "utf8");

const parentDraft = read("../scripts/sql/db05-course-parent-graph-guard.draft.sql");
const departmentDraft = read("../scripts/sql/db05-department-college-move.draft.sql");
const facets = read("../scripts/sql/db05-course-parent-facets.draft.sql");
const courses = read("../src/db/schema/courses.ts");
const departments = read("../src/db/schema/departments.ts");
const contract = read("../docs/planning/db05-course-parent-integrity-contract.md");
const review = JSON.parse(
  read("../docs/planning/db05-chat06-source-semantic-review.json"),
);

test("only one canonical parent graph guard exists in staging", () => {
  assert.match(parentDraft, /UNREGISTERED SOURCE-REVIEW COMPANION SQL/);
  assert.match(facets, /parent_course_id uuid/);
  assert.match(facets, /parent_course_id <> id/);
  assert.equal(
    existsSync(url("../scripts/sql/db05-course-parent-integrity.draft.sql")),
    false,
    "Overlapping parent trigger must not be reintroduced",
  );
  assert.doesNotMatch(departmentDraft, /CREATE TRIGGER [^\n]+\s*\nBEFORE INSERT OR UPDATE OF parent_course_id/);
  assert.match(contract, /Do not register both variants/);
});

test("canonical parent graph checks same-college links and indirect cycles", () => {
  assert.match(courses, /departmentId: uuid\("department_id"\)/);
  assert.match(departments, /collegeId: uuid\("college_id"\)/);
  assert.match(parentDraft, /parent_college_id IS DISTINCT FROM child_college_id/);
  assert.match(parentDraft, /WITH RECURSIVE ancestors/);
  assert.match(parentDraft, /candidate\.id = ANY\(ancestors\.visited\)/);
  assert.match(parentDraft, /WHERE id = NEW\.id OR cycle/);
  assert.match(parentDraft, /parent_course_id = NEW\.id/);
  assert.match(parentDraft, /JOIN academic_periods period/);
});

test("upstream department move uses SAME lock and isolation as canonical guard", () => {
  for (const source of [parentDraft, departmentDraft]) {
    assert.match(source, /current_setting\('transaction_isolation'\) <> 'read committed'/);
    assert.match(source, /pg_advisory_xact_lock\(605008001::bigint\)/);
  }
  assert.match(departmentDraft, /BEFORE UPDATE OF college_id ON departments/);
  assert.match(departmentDraft, /NEW\.college_id IS NOT DISTINCT FROM OLD\.college_id/);
  assert.match(departmentDraft, /FROM courses course_row/);
  assert.match(departmentDraft, /course_row\.department_id = OLD\.id/);
  assert.match(departmentDraft, /USING ERRCODE = '23514'/);
  assert.match(departmentDraft, /USING ERRCODE = '25001'/);
});

test("narrow companion adds no duplicate column, index, FK or courses trigger", () => {
  assert.doesNotMatch(departmentDraft, /ALTER TABLE courses/i);
  assert.doesNotMatch(departmentDraft, /CREATE INDEX/i);
  assert.doesNotMatch(departmentDraft, /REFERENCES courses/i);
  assert.doesNotMatch(departmentDraft, /ON courses\s+FOR EACH ROW/i);
  assert.match(departmentDraft, /UNREGISTERED/);
  assert.match(contract, /NOT RUN/);
});

test("remaining upstream dependencies are explicit and source decision is open", () => {
  assert.match(contract, /academic_periods\.college_id/);
  assert.match(contract, /offering\/section\/membership/);
  assert.match(contract, /Concurrent transactions/);
  const parent = review.fields.find(
    (row) => row.source === "course.parent_course_id",
  );
  assert.ok(parent);
  assert.equal(parent.semanticVerification, "NOT_VERIFIED");
  assert.equal(parent.runtimeDatabaseVerification, "NOT_RUN");
});
