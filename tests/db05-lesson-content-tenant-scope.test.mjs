import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8");
const guard = read("../scripts/sql/db05-lesson-content-delivery-scope.draft.sql");
const owner = read("../scripts/sql/db05-lesson-content-faculty-owner.draft.sql");
const order = read("../scripts/sql/db05-content-delivery-order-scope.draft.sql");
const orderUpstream = read("../scripts/sql/db05-content-order-upstream-reparent.draft.sql");
const model = read("../src/db/schema/courses.ts");
const service = read("../src/modules/courses/lesson-content-service.ts");

test("DB05 generic as well as owner-linked content has a scoped offering/section/college guard", () => {
  assert.match(guard, /BEFORE INSERT OR UPDATE OF lesson_id, delivery_id/);
  assert.match(guard, /ON lesson_contents/);
  assert.doesNotMatch(guard, /NEW\.faculty_owner_membership_id/);
  assert.match(owner, /ADD COLUMN faculty_owner_membership_id uuid/);
  assert.match(model, /lessonId: uuid\("lesson_id"\)/);
  assert.match(model, /deliveryId: uuid\("delivery_id"\)/);
  assert.match(service, /delivery\.offeringId\s*!==\s*lesson\.offeringId/);
});

test("DB05 lesson delivery scope validates complete offering/cohort/period/college graph", () => {
  const needed = [
    "course_lessons",
    "course_learning_paths",
    "course_offerings",
    "academic_periods",
    "courses",
    "departments",
    "course_section_deliveries",
    "sections",
    "owning_offering_id",
    "owning_cohort_id",
    "owning_period_id",
    "offering_college_id",
    "course_college_id",
    "scoped_delivery_offering_id",
    "scoped_section_cohort_id",
    "scoped_section_period_id",
    "scoped_section_college_id",
    "scoped_delivery_offering_id IS DISTINCT FROM owning_offering_id",
    "scoped_section_cohort_id IS DISTINCT FROM owning_cohort_id",
    "scoped_section_period_id IS DISTINCT FROM owning_period_id",
    "scoped_section_college_id IS DISTINCT FROM offering_college_id",
    "offering_college_id IS DISTINCT FROM course_college_id",
  ];
  for (const token of needed) assert.ok(guard.includes(token), token);
  assert.match(guard, /NEW\.delivery_id IS NOT NULL THEN/);
  assert.match(guard, /USING ERRCODE = '23514'/);
});

test("scope guard and order ancestor guards share concurrency lock", () => {
  for (const draft of [guard, order, orderUpstream]) {
    assert.match(draft, /pg_advisory_xact_lock\(605008003::bigint\)/);
    assert.match(draft, /current_setting\('transaction_isolation'\) <> 'read committed'/);
    assert.match(draft, /USING ERRCODE = '25001'/);
  }
});

test("DB05 lesson-content tenant guard remains an unregistered companion with upstream risk disclosed", () => {
  assert.match(guard, /UNREGISTERED SAME-SCOPE COMPANION/);
  assert.match(guard, /NOT a standalone numbered migration/);
  assert.match(guard, /Upstream department, period, offering or section reparent/);
  assert.match(guard, /two connections/);
  assert.match(guard, /ACCEPTANCE GATES NOT EXECUTED/);
  assert.doesNotMatch(guard, /ALTER TABLE lesson_contents/);
});
