import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (name) => readFileSync(new URL("../src/modules/courses/" + name, import.meta.url), "utf8");
const offering = read("offering-service.ts");
const path = read("learning-path-service.ts");
const lesson = read("lesson-service.ts");
const content = read("lesson-content-service.ts");

function segment(source, method) {
  const from = source.indexOf("export async function " + method + "(");
  assert.ok(from >= 0, method);
  const to = source.indexOf("\nexport async function ", from + 10);
  return source.slice(from, to < 0 ? undefined : to);
}

test("DB05 offering archive and learning-path create pair UPDATE and SHARE locks", () => {
  const close = segment(offering, "archiveCourseOffering");
  const create = segment(path, "createLearningPath");
  assert.match(close, /\.for\("update"\)/);
  assert.match(create, /getDb\(\)\.transaction\(async \(tx\)/);
  const parent = create.indexOf(".from(courseOfferings)");
  const check = create.indexOf('eq(courseOfferings.status, "ACTIVE")', parent);
  const lock = create.indexOf('.for("share")', check);
  const insert = create.indexOf(".insert(courseLearningPaths)", lock);
  assert.ok(parent >= 0 && parent < check && check < lock && lock < insert);
});

test("DB05 learning-path transition atomically checks DRAFT on publish and nonarchived on archive", () => {
  const transition = segment(path, "transitionLearningPath");
  assert.match(transition, /return db\.transaction\(async \(tx\)/);
  assert.match(transition, /input\.action === "PUBLISH"\s*\? eq\(courseLearningPaths\.status, "DRAFT"\)/);
  assert.match(transition, /: ne\(courseLearningPaths\.status, "ARCHIVED"\)/);
  assert.match(transition, /INVALID_LEARNING_PATH_TRANSITION/);
  assert.match(transition, /recordActivityEventInTransaction/);
});

test("DB05 lesson insert acquires SHARE on a nonarchived path, not a stale preliminary scope", () => {
  const create = segment(lesson, "createCourseLesson");
  const parent = create.indexOf(".from(courseLearningPaths)");
  const predicate = create.indexOf('ne(courseLearningPaths.status, "ARCHIVED")', parent);
  const lock = create.indexOf('.for("share")', predicate);
  const insert = create.indexOf(".insert(courseLessons)", lock);
  assert.ok(parent >= 0 && parent < predicate && predicate < lock && lock < insert);
  assert.match(create, /return await getDb\(\)\.transaction\(async \(tx\)/);
});

test("DB05 lesson archive locks parent UPDATE while content create rechecks ACTIVE under SHARE", () => {
  const close = segment(lesson, "archiveCourseLesson");
  const create = segment(content, "createLessonContent");
  const p = close.indexOf(".from(courseLessons)");
  const up = close.indexOf('.for("update")', p);
  const mutate = close.indexOf(".update(courseLessons)", up);
  assert.ok(p >= 0 && p < up && up < mutate);
  const child = create.indexOf(".from(courseLessons)");
  const active = create.indexOf('eq(courseLessons.status, "ACTIVE")', child);
  const share = create.indexOf('.for("share")', active);
  const ins = create.indexOf(".insert(lessonContents)", share);
  assert.ok(child >= 0 && child < active && active < share && share < ins);
});

test("DB05 lesson content PUBLISH uses status DRAFT predicate in the final UPDATE", () => {
  const transition = segment(content, "transitionLessonContent");
  const idx = transition.indexOf(".update(lessonContents)");
  assert.ok(idx >= 0);
  const predicate = transition.slice(idx);
  assert.match(predicate, /input\.action === "PUBLISH"\s*\? eq\(lessonContents\.status, "DRAFT"\)/);
  assert.match(predicate, /: ne\(lessonContents\.status, "ARCHIVED"\)/);
});

test("DB05 neither learning-path nor lesson-content creation uses autocommit INSERT", () => {
  for (const [file, method, table] of [
    [path, "createLearningPath", "courseLearningPaths"],
    [lesson, "createCourseLesson", "courseLessons"],
    [content, "createLessonContent", "lessonContents"],
  ]) {
    const create = segment(file, method);
    assert.match(create, new RegExp("\\.insert\\(" + table + "\\)"));
    assert.doesNotMatch(create, /await getDb\(\)\s*\.insert\(/);
    assert.match(create, /getDb\(\)\.transaction\(async \(tx\)/);
  }
});
