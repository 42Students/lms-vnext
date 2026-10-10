import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

function read(relative) {
  return readFileSync(new URL(relative, import.meta.url), "utf8");
}

const review = JSON.parse(read("../docs/planning/db05-chat06-source-semantic-review.json"));
const assessmentSchema = read("../src/db/schema/assessments.ts");
const lessonSchema = read("../src/db/schema/courses.ts");
const assessmentService = read("../src/modules/courses/assignment-service.ts");
const contract = read("../docs/planning/db05-deadline-points-identity-contract.md");

const find = (source) => review.fields.find((field) => field.source === source);

test("DB05 points and deadline mapping stays explicitly unverified", () => {
  for (const key of ["lesson_contents.points", "lesson_contents.deadline"]) {
    const field = find(key);
    assert.ok(field, key);
    assert.ok(["REMODELED_NEEDS_PROOF", "MISSING_OR_UNPROVEN"].includes(field.classification));
    assert.equal(field.semanticVerification, "NOT_VERIFIED");
    assert.equal(field.runtimeDatabaseVerification, "NOT_RUN");
    assert.match(contract, /LessonContentsServiceImpl/);
    assert.match(contract, /max_points/);
  }
});

test("candidate assignment model is not silently treated as identical to lesson content", () => {
  assert.match(assessmentSchema, /maxPoints: integer\("max_points"\)\.notNull\(\)/);
  assert.match(assessmentSchema, /between 1 and 10000/);
  assert.match(assessmentSchema, /dueAt: timestamp\("due_at",/);
  assert.match(assessmentSchema, /withTimezone: true/);
  assert.match(lessonSchema, /startsAt: timestamp\("starts_at"/);
  assert.match(lessonSchema, /endsAt: timestamp\("ends_at"/);
  assert.match(contract, /LocalDateTime/);
  assert.match(contract, /zero valid/);
});

test("vNext assignment update has explicit null clear semantics", () => {
  assert.match(assessmentService, /input\.dueAt !== undefined/);
  assert.match(assessmentService, /dueAt: input\.dueAt/);
  assert.match(assessmentService, /new Date\(input\.dueAt\)/);
  assert.match(contract, /clearDeadline/);
});

test("historical-only and denormalized DB05 fields are not retired by assumption", () => {
  for (const key of [
    "lesson_contents.course_name",
    "course.default_subscription_days",
    "course.formal_title",
  ]) {
    const field = find(key);
    assert.ok(field, key);
    assert.ok(["REMODELED_NEEDS_PROOF", "MISSING_OR_UNPROVEN"].includes(field.classification));
    assert.equal(field.semanticVerification, "NOT_VERIFIED");
  }
  assert.match(contract, /NOT REGISTERED/);
});
