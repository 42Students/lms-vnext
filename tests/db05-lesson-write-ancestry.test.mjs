#!/usr/bin/env node
// Source-level DB008 lesson ancestry checks. Native execution requires a
// checkout; this test is NOT PostgreSQL concurrency or tenant verification.
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const code = readFileSync(new URL("../src/modules/courses/lesson-service.ts", import.meta.url), "utf8") +
  "\n" + readFileSync(new URL("../src/modules/courses/lesson-write-ancestry.ts", import.meta.url), "utf8");
const body = (name, next = "export async function") => {
  const start = code.indexOf("export async function " + name + "(");
  assert.ok(start >= 0, "missing " + name);
  const end = code.indexOf(next, start + 15);
  return code.slice(start, end === -1 ? undefined : end);
};
const create=body("createCourseLesson");
const update=body("updateCourseLesson");
const archive=body("archiveCourseLesson");

describe("DB008 lesson mutation live ancestor locks", () => {
  it("uses SHARE on the path with immutable offering parent", () => {
    assert.match(code,/async function lockLiveLessonWriteAncestry\(/);
    assert.match(code,/eq\(courseLearningPaths\.offeringId, expected\.offeringId\)/);
    assert.match(code,/ne\(courseLearningPaths\.status, "ARCHIVED"\)/);
    assert.match(code,/\.from\(courseLearningPaths\)[\s\S]*?\.for\("share"\)/);
  });
  it("locks the offering/course/department/college/org chain", () => {
    for(const pattern of [
      /\.from\(courseOfferings\)/,
      /\.innerJoin\(courses,/,
      /\.innerJoin\(departments,/,
      /\.innerJoin\(colleges,/,
      /\.innerJoin\(organizations,/,
      /eq\(courseOfferings\.status, "ACTIVE"\)/,
      /eq\(courses\.status, "ACTIVE"\)/,
      /eq\(colleges\.status, "ACTIVE"\)/,
      /eq\(organizations\.status, "ACTIVE"\)/,
    ]) assert.match(code,pattern);
  });
  it("locks cohort/program department and period college independently", () => {
    assert.match(code,/\.from\(cohorts\)/);
    assert.match(code,/\.innerJoin\(programs,/);
    assert.match(code,/eq\(cohorts\.id, offering\.cohortId\)/);
    assert.match(code,/eq\(programs\.status, "ACTIVE"\)/);
    assert.match(code,/isNull\(departments\.archivedAt\)/);
    assert.match(code,/\.from\(academicPeriods\)/);
    assert.match(code,/eq\(academicPeriods\.id, offering\.academicPeriodId\)/);
    assert.match(code,/cohort\.collegeId !== expected\.collegeId/);
    assert.match(code,/period\.collegeId !== expected\.collegeId/);
  });
  it("compares all five authorization ancestors, not only college", () => {
    for(const name of ["courseId","cohortId","academicPeriodId","collegeId","organizationId"])
      assert.ok(code.includes("offering."+name+" !== expected."+name),name);
  });
  it("create rechecks live ancestry inside transaction before insert", () => {
    assert.match(create,/getDb\(\)\.transaction\(async \(tx\) => \{/);
    assert.ok(create.indexOf("await lockLiveLessonWriteAncestry(tx, path)") <
      create.indexOf(".insert(courseLessons)"));
  });
  it("update checks pre-authorized path and holds transaction across UPDATE", () => {
    assert.match(update,/loadLearningPathScope\(current\.learningPathId\)/);
    assert.match(update,/return await getDb\(\)\.transaction/);
    assert.ok(update.indexOf("await lockLiveLessonWriteAncestry(tx, path)") <
      update.indexOf(".update(courseLessons)"));
    assert.match(update,/eq\(courseLessons\.learningPathId, current\.learningPathId\)/);
  });
  it("archive checks ancestry before FOR UPDATE lesson and archive", () => {
    assert.match(archive,/loadLearningPathScope\(current\.learningPathId\)/);
    assert.ok(archive.indexOf("await lockLiveLessonWriteAncestry(tx, path)") <
      archive.indexOf(".for(\"update\")"));
    assert.match(archive,/eq\(courseLessons\.learningPathId, current\.learningPathId\)/);
  });
});
