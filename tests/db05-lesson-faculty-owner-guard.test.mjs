import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const sql = readFileSync(
  new URL("../scripts/sql/db05-lesson-content-faculty-owner.draft.sql", import.meta.url),
  "utf8",
);
const contract = readFileSync(
  new URL("../docs/planning/db05-lesson-faculty-owner-contract.md", import.meta.url),
  "utf8",
);
const vnextSchema = readFileSync(
  new URL("../src/db/schema/courses.ts", import.meta.url),
  "utf8",
);
const permissions = readFileSync(
  new URL("../src/modules/courses/learning-access.ts", import.meta.url),
  "utf8",
);
const service = readFileSync(
  new URL("../src/modules/courses/lesson-content-service.ts", import.meta.url),
  "utf8",
);
const review = JSON.parse(
  readFileSync(
    new URL("../docs/planning/db05-chat06-source-semantic-review.json", import.meta.url),
    "utf8",
  ),
);

test("DB05 faculty owner stays separate from creator, nullable and unregistered", () => {
  assert.match(sql, /SOURCE-BACKED UNREGISTERED companion/);
  assert.match(sql, /ADD COLUMN faculty_owner_membership_id uuid/);
  assert.match(sql, /REFERENCES college_memberships\(id\) ON DELETE RESTRICT/);
  assert.match(sql, /WHERE faculty_owner_membership_id IS NOT NULL/);
  assert.match(sql, /IF NEW\.faculty_owner_membership_id IS NULL THEN[\s\S]*RETURN NEW/);
  assert.match(vnextSchema, /createdByUserId: uuid\("created_by_user_id"\)/);
  assert.match(contract, /Created-by and owner are different concepts/);
  assert.doesNotMatch(sql, /UPDATE lesson_contents\s+SET created_by_user_id/i);
});

test("direct SQL owner writes cannot pair faculty with wrong college, offering or section", () => {
  const required = [
    "course_lessons",
    "course_learning_paths",
    "course_offerings",
    "courses",
    "departments",
    "academic_periods",
    "course_section_deliveries",
    "sections",
    "college_memberships",
    "NEW.lesson_id",
    "NEW.delivery_id",
    "NEW.faculty_owner_membership_id",
    "course_college_id IS DISTINCT FROM period_college_id",
    "course_college_id IS DISTINCT FROM owner_college_id",
    "delivery_offering_id IS DISTINCT FROM content_offering_id",
    "section_period_college_id IS DISTINCT FROM course_college_id",
    "USING ERRCODE = '23514'",
  ];
  for (const token of required) assert.ok(sql.includes(token), token);
  assert.match(sql, /BEFORE INSERT OR UPDATE OF faculty_owner_membership_id, lesson_id, delivery_id/);
});

test("faculty assignment requires active FACULTY membership without wiping old ownership on role loss", () => {
  assert.match(sql, /owner_status IS DISTINCT FROM 'ACTIVE'/);
  assert.match(sql, /membership_roles membership_role/);
  assert.match(sql, /membership_role\.role::text = 'FACULTY'/);
  assert.match(sql, /faculty_role_row_id IS NULL/);
  assert.match(sql, /FROM college_memberships membership[\\s\\S]*?FOR SHARE/);
  assert.match(sql, /FROM membership_roles membership_role[\\s\\S]*?FOR SHARE/);
  assert.match(sql, /NEW\.faculty_owner_membership_id[\s\S]*IS DISTINCT FROM OLD\.faculty_owner_membership_id/);
  assert.match(sql, /IF newly_assigned AND/);
  assert.match(contract, /Historical owner/);
  assert.match(contract, /later loses role\/is suspended/);
});

test("later API must combine faculty owner with teaching assignment access", () => {
  assert.match(permissions, /courseTeachingAssignments/);
  assert.match(permissions, /hasFacultyDeliveryAccess/);
  assert.match(permissions, /requireDeliveryContentMutation/);
  assert.match(service, /normalizedContentValues\(\s*input,\s*context\.user\.id/);
  assert.match(service, /requireDeliveryContentMutation/);
  assert.match(contract, /active teaching assignment/);
  assert.match(contract, /admin reassignment/i);
});

test("DB05 faculty_id remains an open semantic decision, not a verified mapping", () => {
  const source = review.fields.find((row) => row.source === "lesson_contents.faculty_id");
  assert.ok(source);
  assert.equal(source.classification, "REMODELED_NEEDS_PROOF");
  assert.equal(source.semanticVerification, "NOT_VERIFIED");
  assert.equal(source.runtimeDatabaseVerification, "NOT_RUN");
  assert.match(contract, /NONE EXECUTED/);
  assert.match(contract, /W01 must integrate/);
});
