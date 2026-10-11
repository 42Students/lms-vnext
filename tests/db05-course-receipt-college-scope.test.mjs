import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) =>
  readFileSync(new URL(path, import.meta.url), "utf8");

const sql = read("../scripts/sql/db05-course-receipt-college-scope.draft.sql");
const contract = read("../docs/planning/db05-private-course-receipt-tenant-contract.md");
const receipts = read("../src/db/schema/course-upload-receipts-staged.ts");
const privateStorage = read("../src/modules/storage/private-object-storage.ts");
const assignments = read("../src/db/schema/assessments.ts");
const courses = read("../src/db/schema/courses.ts");

test("receipt scope draft does not duplicate DB06 registered persistence", () => {
  assert.match(sql, /UNREGISTERED SOURCE-ONLY COMPANION/);
  assert.match(sql, /CREATE OR REPLACE FUNCTION db05_course_receipt_tenant_guard/);
  assert.match(sql, /BEFORE INSERT OR UPDATE OF college_id, owner_membership_id/);
  assert.doesNotMatch(sql, /CREATE TABLE|ALTER TABLE|CREATE INDEX/i);
  assert.match(receipts, /courseUploadReceipts = pgTable/);
  assert.match(receipts, /ownerMembershipId: uuid\("owner_membership_id"\)/);
});

test("receipt college checks owner plus both academic and course department paths", () => {
  for (const text of [
    "FROM college_memberships membership",
    "owner_college_id IS DISTINCT FROM NEW.college_id",
    "FROM course_assignments assignment",
    "FROM lesson_contents content",
    "INNER JOIN course_lessons lesson",
    "INNER JOIN course_learning_paths path",
    "INNER JOIN course_offerings offering",
    "INNER JOIN academic_periods period",
    "INNER JOIN courses course_row",
    "INNER JOIN departments department",
    "target_period_college_id IS DISTINCT FROM NEW.college_id",
    "target_department_college_id IS DISTINCT FROM NEW.college_id",
  ]) {
    assert.ok(sql.includes(text), text);
  }
  assert.match(assignments, /export const courseAssignments = pgTable/);
  assert.match(courses, /export const lessonContents = pgTable/);
});

test("delivery-scoped receipts and consumed submissions cannot cross owners", () => {
  for (const text of [
    "delivery_offering_id IS DISTINCT FROM target_offering_id",
    "delivery_section_college_id IS DISTINCT FROM NEW.college_id",
    "submission_assignment_id IS DISTINCT FROM NEW.assignment_id",
    "submission_membership_id IS DISTINCT FROM NEW.owner_membership_id",
    "submission_delivery_id IS DISTINCT FROM content_delivery_id",
  ]) {
    assert.ok(sql.includes(text), text);
  }
  assert.match(receipts, /consumedBySubmissionId: uuid\("consumed_by_submission_id"\)/);
});

test("private path is bound to college/member/purpose, not raw public URL", () => {
  assert.match(privateStorage, /"assignment-submission"/);
  assert.match(privateStorage, /"course-resource"/);
  assert.match(sql, /required_key_prefix := 'private\/'/);
  assert.match(sql, /NEW\.college_id::text/);
  assert.match(sql, /NEW\.owner_membership_id::text/);
  assert.match(sql, /required_namespace := 'assignment-submission'/);
  assert.match(sql, /required_namespace := 'course-resource'/);
  assert.match(sql, /NEW\.upload_token_hash !~ '\^\[0-9a-f\]\{64\}\$'/);
  assert.match(contract, /does not grant access/);
});

test("gates retain upstream-reparent, identity, receipt/attestation race blockers", () => {
  assert.match(contract, /Upstream drift/);
  assert.match(contract, /File-to-submission linking/);
  assert.match(contract, /Course resource binding/);
  assert.match(contract, /NOT RUN/);
});
