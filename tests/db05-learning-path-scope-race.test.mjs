import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (file) => readFileSync(new URL(file, import.meta.url), "utf8");
const code = read("../src/modules/courses/learning-path-service.ts");
const scope = read("../src/modules/courses/scope.ts");

function section(name, next) {
  const begin = code.indexOf("export async function " + name + "(");
  assert.ok(begin >= 0, name);
  const end = next
    ? code.indexOf("export async function " + next + "(", begin)
    : code.length;
  assert.ok(end > begin);
  return code.slice(begin, end);
}

const create = section("createLearningPath", "updateLearningPath");
const update = section("updateLearningPath", "transitionLearningPath");
const transition = section("transitionLearningPath", null);
const writes = [create, update, transition];

test("DB05 learning path creates, updates and publishes only in transactions", () => {
  assert.match(create, /return await getDb\(\)\.transaction\(async \(tx\) => \{/);
  assert.match(update, /return getDb\(\)\.transaction\(async \(tx\) => \{/);
  assert.match(transition, /return db\.transaction\(async \(tx\) => \{/);
  for (const body of writes) {
    assert.match(body, /await tx[\s\S]*?\.for\("share"\)/);
    assert.match(body, /await tx[\s\S]*?\.(?:insert|update)\(courseLearningPaths\)/);
  }
});

test("DB05 learning path write owner checks compare current organization and college while SHARE locked", () => {
  for (const body of writes) {
    assert.match(body, /\.innerJoin\(courses, eq\(courses\.id, courseOfferings\.courseId\)\)/);
    assert.match(body, /\.innerJoin\(departments, eq\(departments\.id, courses\.departmentId\)\)/);
    assert.match(body, /\.innerJoin\(colleges, eq\(colleges\.id, departments\.collegeId\)\)/);
    assert.match(body, /\.innerJoin\(organizations, eq\(organizations\.id, colleges\.organizationId\)\)/);
    assert.match(body, /eq\(courseOfferings\.status, "ACTIVE"\)/);
    assert.match(body, /eq\(courses\.status, "ACTIVE"\)/);
    assert.match(body, /eq\(colleges\.status, "ACTIVE"\)/);
    assert.match(body, /eq\(organizations\.status, "ACTIVE"\)/);
  }
  assert.match(create, /activeOffering\.collegeId !== offering\.collegeId/);
  assert.match(create, /activeOffering\.organizationId !== offering\.organizationId/);
  for (const body of [update, transition]) {
    assert.match(body, /lockedOffering\.collegeId !== current\.collegeId/);
    assert.match(body, /lockedOffering\.organizationId !== current\.organizationId/);
  }
});

test("DB05 lesson path mutation refuses stale course/cohort/period and offering reassignment", () => {
  for (const body of writes) {
    for (const key of ["courseId", "cohortId", "academicPeriodId", "collegeId", "organizationId"]) {
      assert.ok(body.includes(key), key);
    }
  }
  for (const body of [update, transition]) {
    assert.match(body, /eq\(courseLearningPaths\.offeringId, current\.offeringId\)/);
    assert.match(body, /\.for\("update"\)/);
  }
  assert.match(scope, /export async function loadLearningPathScope/);
});

test("DB05 lesson path update checks live state after row lock rather than pre-read only", () => {
  const beforeLock = update.indexOf('const [lockedPath] = await tx');
  const pathLock = update.indexOf('.for("update")');
  const offeringLock = update.indexOf('.for("share")');
  const actualUpdate = update.indexOf(".update(courseLearningPaths)");
  assert.ok(beforeLock < pathLock && pathLock < offeringLock && offeringLock < actualUpdate);
  assert.match(update, /ne\(courseLearningPaths\.status, "ARCHIVED"\)/);
  assert.match(update, /throw new CoursesServiceError\("LEARNING_PATH_NOT_FOUND"\)/);
});

test("DB05 publish transition retains atomic audit and source status predicate", () => {
  const pathLock = transition.indexOf('.for("update")');
  const offeringLock = transition.indexOf('.for("share")');
  const actualUpdate = transition.indexOf(".update(courseLearningPaths)");
  const audit = transition.indexOf("recordActivityEventInTransaction(");
  assert.ok(pathLock < offeringLock && offeringLock < actualUpdate && actualUpdate < audit);
  assert.match(transition, /input\.action === "PUBLISH"[\s\S]*?eq\(courseLearningPaths\.status, "DRAFT"\)/);
  assert.match(transition, /recordActivityEventInTransaction\(\s*tx,/);
  assert.match(transition, /ACTIVITY_EVENT_TYPES\.COURSES_LEARNING_PATH_PUBLISHED/);
  assert.match(transition, /eq\(courseLearningPaths\.offeringId, current\.offeringId\)/);
});

test("DB05 documentation never treats source checks as completed PostgreSQL race acceptance", () => {
  const notes = read("../docs/planning/db05-learning-path-scope-race-contract.md");
  assert.match(notes, /NOT RUN/);
  assert.match(notes, /two-session/);
  assert.match(notes, /READ COMMITTED/);
  assert.match(notes, /tenant/);
  assert.match(notes, /DB05/);
});
