import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

// Read-only source assertions for current application mutations; no database
// runner is implied. Race/tenant acceptance remains a W01 PG gate.
const read = (name) =>
  readFileSync(new URL("../src/modules/courses/" + name, import.meta.url), "utf8");
function method(source, name) {
  const from = source.indexOf("export async function " + name + "(");
  assert.ok(from >= 0, name);
  const next = source.indexOf("\nexport async function ", from + 10);
  return source.slice(from, next < 0 ? undefined : next);
}
function assertScopePredicates(source, fields, expectedCount) {
  for (const field of fields) {
    const occurrences = source.split(field).length - 1;
    assert.ok(
      occurrences >= expectedCount,
      `${field} must be checked in each lock/write predicate: saw ${occurrences}`,
    );
  }
}
const offering = read("offering-service.ts");
const delivery = read("delivery-service.ts");
const lesson = read("lesson-service.ts");
const content = read("lesson-content-service.ts");

test("offering edit revalidates course/cohort/period identity in SELECT and UPDATE", () => {
  const body = method(offering, "updateCourseOffering");
  assert.match(body, /getDb\(\)\.transaction\(async \(tx\)/);
  assert.match(body, /\.for\("update"\)/);
  assert.match(body, /\.from\(cohorts\)[\s\S]*?\.for\("share"\)/);
  assert.match(body, /\.from\(academicPeriods\)[\s\S]*?\.for\("share"\)/);
  assert.match(body, /lockedCohort\.collegeId !== current\.collegeId/);
  assert.match(body, /lockedPeriod\.collegeId !== current\.collegeId/);
  assertScopePredicates(body, [
    "eq(courseOfferings.courseId, current.courseId)",
    "eq(courseOfferings.cohortId, current.cohortId)",
    "eq(courseOfferings.academicPeriodId, current.academicPeriodId)",
  ], 2);
});

test("offering archive checks the same authorized ancestry before and after its child check", () => {
  const body = method(offering, "archiveCourseOffering");
  assertScopePredicates(body, [
    "eq(courseOfferings.courseId, current.courseId)",
    "eq(courseOfferings.cohortId, current.cohortId)",
    "eq(courseOfferings.academicPeriodId, current.academicPeriodId)",
  ], 2);
  const p = body.indexOf(".from(courseOfferings)");
  const child = body.indexOf(".from(courseSectionDeliveries)", p);
  const update = body.indexOf(".update(courseOfferings)", child);
  assert.ok(p >= 0 && p < child && child < update);
});

test("delivery end does not use stale offering or section authorization", () => {
  const body = method(delivery, "endCourseSectionDelivery");
  assertScopePredicates(body, [
    "eq(courseSectionDeliveries.offeringId, current.offeringId)",
    "eq(courseSectionDeliveries.sectionId, current.sectionId)",
  ], 2);
  assert.match(body, /\.for\("update"\)/);
  assert.match(body, /DELIVERY_HAS_ACTIVE_TEACHERS/);
});

test("lesson edit/archive fail if lesson migrated to another learning path", () => {
  assertScopePredicates(method(lesson, "updateCourseLesson"), [
    "eq(courseLessons.learningPathId, current.learningPathId)",
  ], 1);
  const archive = method(lesson, "archiveCourseLesson");
  assertScopePredicates(archive, [
    "eq(courseLessons.learningPathId, current.learningPathId)",
  ], 2);
  assert.match(archive, /\.for\("update"\)/);
});

test("lesson-content edits require identical lesson, delivery and content kind", () => {
  const body = method(content, "updateLessonContent");
  for (const predicate of [
    "eq(lessonContents.lessonId, current.lessonId)",
    "eq(lessonContents.deliveryId, current.deliveryId)",
    "isNull(lessonContents.deliveryId)",
    "eq(lessonContents.contentType, current.contentType)",
  ]) assert.ok(body.includes(predicate), predicate);
  assert.match(body, /ne\(\s*lessonContents\.status,\s*"ARCHIVED"/);
});

test("lesson-content publication and archive keep the same authorized parent scope", () => {
  const body = method(content, "transitionLessonContent");
  for (const predicate of [
    "eq(lessonContents.lessonId, current.lessonId)",
    "eq(lessonContents.deliveryId, current.deliveryId)",
    "isNull(lessonContents.deliveryId)",
    "eq(lessonContents.contentType, current.contentType)",
    'eq(lessonContents.status, "DRAFT")',
    'ne(lessonContents.status, "ARCHIVED")',
  ]) assert.ok(body.includes(predicate), predicate);
  assert.match(body, /INVALID_LESSON_CONTENT_TRANSITION/);
});

test("no application-source guard is mistaken for DB05 verification", () => {
  const review = JSON.parse(readFileSync(new URL("../docs/planning/db05-chat06-source-semantic-review.json", import.meta.url), "utf8"));
  assert.equal(review.counts.sourceFields, 92);
  assert.ok(review.fields.every((field) =>
    field.semanticVerification !== "WORKFLOW_VERIFIED" ||
    field.runtimeDatabaseVerification !== "PASS",
  ));
});
