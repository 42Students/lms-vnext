import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
const read = (p) => readFileSync(new URL(p, import.meta.url), "utf8");
const sources = [
  ["learning-path-service.ts", "listLearningPaths"],
  ["lesson-service.ts", "listCourseLessons"],
  ["lesson-content-service.ts", "listLessonContents"],
];
const list = (name, fn) => {
  const source = read("../src/modules/courses/" + name);
  const from = source.indexOf("export async function " + fn + "(");
  assert.ok(from >= 0, fn);
  const to = source.indexOf("export async function ", from + 22);
  return source.slice(from, to < 0 ? undefined : to);
};
test("DB05 all three hierarchy read APIs propagate historical option exclusively from includeArchived", () => {
  for (const [name, fn] of sources) {
    const body = list(name, fn);
    assert.match(body, /includeArchived\s*=\s*false/);
    assert.match(body, /await requireLearningReadAccess\(/);
    assert.match(body, /\{\s*includeHistorical:\s*includeArchived\s*\}/);
  }
});
test("DB05 archived hierarchy access retains explicit courses.manage check", () => {
  for (const [name, fn] of sources) {
    const body = list(name, fn);
    assert.match(body, /includeArchived &&[\s\S]*?!can\(context, "courses\.manage"/);
    assert.match(body, /LEARNING_ACCESS_DENIED/);
  }
});
test("DB05 historical scope still enforces tenant membership and learner enrollment", () => {
  const access = read("../src/modules/courses/learning-access.ts");
  assert.match(access, /options\.includeHistorical\s*\?\?\s*false/);
  assert.match(access, /loadCourseOfferingScope\(\s*offeringId,\s*includeHistorical/);
  assert.match(access, /if \(can\(context, "courses\.manage", resource\)\)/);
  assert.match(access, /activeSameCollegeMembership/);
  assert.match(access, /hasLearnerDeliveryAccess/);
  assert.match(access, /LEARNING_ACCESS_DENIED/);
});
test("DB05 historical mode does not remove learner publication gates", () => {
  const path = list(...sources[0]);
  const lesson = list(...sources[1]);
  const content = list(...sources[2]);
  assert.match(path, /if \(access === "LEARNER"\)/);
  assert.match(path, /"PUBLISHED"/);
  assert.match(lesson, /path\.status !== "PUBLISHED"/);
  assert.match(content, /lesson\.learningPathStatus !== "PUBLISHED"/);
  assert.match(content, /lessonContents\.status,[\s\S]*?"PUBLISHED"/);
});
