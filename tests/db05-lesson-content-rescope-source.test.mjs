import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (p) => readFileSync(new URL(p, import.meta.url), "utf8");
const contract = read("../docs/planning/db05-lesson-content-rescope-contract.md");
const validation = read("../src/modules/courses/validation.ts");
const service = read("../src/modules/courses/lesson-content-service.ts");
const scope = read("../scripts/sql/db05-lesson-content-delivery-scope.draft.sql");
const review = JSON.parse(read("../docs/planning/db05-chat06-source-semantic-review.json"));

test("vNext create lesson-content enforces matching offering and teaching permission", () => {
  assert.match(service, /delivery\.offeringId\s*!==\s*lesson\.offeringId/);
  assert.match(service, /requireDeliveryContentMutation\(\s*context,\s*input\.deliveryId/);
  assert.match(scope, /scoped_delivery_offering_id IS DISTINCT FROM owning_offering_id/);
});

test("current vNext generic content edit cannot silently reparent lesson, course or delivery", () => {
  const start = validation.indexOf("export const updateLessonContentInputSchema");
  const end = validation.indexOf("export const lessonContentTransitionSchema");
  assert.ok(start >= 0 && end > start);
  const edit = validation.slice(start, end);
  assert.doesNotMatch(edit, /\blessonId\s*:/);
  assert.doesNotMatch(edit, /\bdeliveryId\s*:/);
  assert.doesNotMatch(edit, /\bcourseId\s*:/);
  assert.match(service, /lessonId: current\.lessonId/);
  assert.match(service, /deliveryId: current\.deliveryId/);
});

test("legacy class scope create/update/clear semantics remain explicit and unverified", () => {
  for (const required of [
    "classId",
    "Positive",
    "Negative",
    "zero",
    "NULL",
    "CLEAR_DELIVERY",
    "SET_DELIVERY",
    "Teaching-scope",
  ]) assert.ok(contract.toLowerCase().includes(required.toLowerCase()), required);
  assert.match(contract, /no vNext class\/delivery reassignment feature/);
  assert.match(contract, /NONE RUN/);
});

test("DB05 lesson class and course ID normalization remain unresolved", () => {
  for (const field of ["lesson_contents.class_id", "lesson_contents.course_id"]) {
    const row = review.fields.find((item) => item.source === field);
    assert.ok(row, field);
    assert.equal(row.semanticVerification, "NOT_VERIFIED");
    assert.equal(row.runtimeDatabaseVerification, "NOT_RUN");
    assert.equal(row.classification, "REMODELED_NEEDS_PROOF");
  }
});
