import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) =>
  readFileSync(new URL(path, import.meta.url), "utf8");

const draft = read("../scripts/sql/db05-course-parent-integrity.draft.sql");
const parentFacets = read("../scripts/sql/db05-course-parent-facets.draft.sql");
const courses = read("../src/db/schema/courses.ts");
const departments = read("../src/db/schema/departments.ts");
const contract = read("../docs/planning/db05-course-parent-integrity-contract.md");
const review = JSON.parse(
  read("../docs/planning/db05-chat06-source-semantic-review.json"),
);

test("course parent guard is isolated from registered migrations", () => {
  assert.match(draft, /UNREGISTERED DRAFT/);
  assert.match(draft, /db05-course-parent-facets\.draft\.sql/);
  assert.match(parentFacets, /parent_course_id uuid/);
  assert.match(parentFacets, /parent_course_id <> id/);
  assert.doesNotMatch(draft, /ADD COLUMN [\s\S]*parent_course_id/i);
  assert.match(contract, /Chat 1 exclusively registers Drizzle migrations/);
});

test("same-college scope comes through departments, not department equality", () => {
  assert.match(courses, /departmentId: uuid\("department_id"\)/);
  assert.match(departments, /collegeId: uuid\("college_id"\)/);
  assert.match(draft, /FROM departments department/);
  assert.match(draft, /parent_college_id IS DISTINCT FROM proposed_college_id/);
  assert.match(draft, /college_id IS DISTINCT FROM proposed_college_id/);
  assert.match(contract, /cross-department within the \*same\* college/);
});

test("recursive ancestor traversal detects self, multi-hop cycles and prior bad ancestry", () => {
  assert.match(draft, /NEW\.parent_course_id = NEW\.id/);
  assert.match(draft, /WITH RECURSIVE ancestry/);
  assert.match(draft, /ARRAY\[parent\.id\]::uuid\[\]/);
  assert.match(draft, /ancestor\.id = ANY\(ancestry\.visited\)/);
  assert.match(draft, /WHERE NOT ancestry\.cycle/);
  assert.match(draft, /WHERE id = NEW\.id/);
  assert.match(draft, /OR cycle/);
  assert.match(draft, /USING ERRCODE = '23514'/);
});

test("concurrent parent edits acquire same-college advisory keys before traversal", () => {
  assert.match(draft, /hashtextextended\(/);
  assert.match(draft, /pg_advisory_xact_lock\(proposed_lock_key\)/);
  assert.match(draft, /LEAST\(previous_lock_key, proposed_lock_key\)/);
  assert.match(draft, /GREATEST\(previous_lock_key, proposed_lock_key\)/);
  assert.ok(
    draft.indexOf("pg_advisory_xact_lock(proposed_lock_key)") <
      draft.indexOf("WITH RECURSIVE ancestry"),
  );
  assert.match(contract, /READ COMMITTED and SERIALIZABLE/);
});

test("parent course and department college moves cannot bypass the guard", () => {
  assert.match(draft, /OR EXISTS \(\s*SELECT 1 FROM courses child/);
  assert.match(draft, /BEFORE INSERT OR UPDATE OF parent_course_id, department_id/);
  assert.match(draft, /CREATE OR REPLACE FUNCTION db05_department_course_college_move_guard/);
  assert.match(draft, /BEFORE UPDATE OF college_id ON departments/);
  assert.match(draft, /WHERE department_id = OLD\.id/);
  assert.match(draft, /LEAST\(old_lock_key, new_lock_key\)/);
  assert.match(draft, /GREATEST\(old_lock_key, new_lock_key\)/);
});

test("source decision remains unverified and required PostgreSQL race gates stay open", () => {
  const parent = review.fields.find(
    (row) => row.source === "course.parent_course_id",
  );
  assert.ok(parent);
  assert.equal(parent.semanticVerification, "NOT_VERIFIED");
  assert.equal(parent.runtimeDatabaseVerification, "NOT_RUN");
  assert.match(contract, /No PostgreSQL\/Node suite has been executed/);
  assert.match(contract, /two sessions set A\.parent=B and B\.parent=A/);
});
