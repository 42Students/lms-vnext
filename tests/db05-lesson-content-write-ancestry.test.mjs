#!/usr/bin/env node
// DB-008 code-shape regression. Source-level; does not certify a DB race.
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { readFileSync } from "node:fs";

const code = readFileSync(new URL("../src/modules/courses/lesson-content-service.ts", import.meta.url),"utf8");
const ancestry = readFileSync(new URL("../src/modules/courses/lesson-write-ancestry.ts", import.meta.url),"utf8");
const func = (name,next) => {
  const start=code.indexOf("export async function "+name+"(");
  assert.ok(start>=0,name);
  const end=next?code.indexOf("export async function "+next+"(",start+20):-1;
  return code.slice(start,end<0?undefined:end);
};
const create=func("createLessonContent","updateLessonContent");
const update=func("updateLessonContent","transitionLessonContent");
const transition=func("transitionLessonContent");

describe("DB-008 lesson-content live write scope", () => {
  it("reuses exact locked offering/course/cohort/period guard", () => {
    assert.match(code,/import \{ lockLiveLessonWriteAncestry \} from ".\/lesson-write-ancestry"/);
    assert.match(ancestry,/cohort\.collegeId !== expected\.collegeId/);
    assert.match(ancestry,/period\.collegeId !== expected\.collegeId/);
    assert.match(code,/await lockLiveLessonWriteAncestry\(tx, path\)/);
  });
  it("pre-write guards exact lesson identity, path and ACTIVE lifecycle", () => {
    for(const literal of [
      "eq(courseLessons.id, scope.lessonId)",
      "eq(courseLessons.learningPathId, scope.learningPathId)",
      'eq(courseLessons.status, "ACTIVE")',
    ])assert.ok(code.includes(literal),literal);
    assert.match(code,/\.from\(courseLessons\)[\s\S]*?\.for\("share"\)/);
  });
  it("validates optional class delivery active, same offering and lock-held", () => {
    assert.match(code,/eq\(courseSectionDeliveries.id, scope.deliveryId\)/);
    assert.match(code,/isNull\(courseSectionDeliveries.endedAt\)/);
    assert.match(code,/delivery\.offeringId !== scope\.offeringId/);
    assert.match(code,/\.from\(courseSectionDeliveries\)[\s\S]*?\.for\("share"\)/);
  });
  for(const [name,body,mutation] of [
    ["create",create,".insert(lessonContents)"],
    ["update",update,".update(lessonContents)"],
    ["transition",transition,".update(lessonContents)"],
  ]){
    it(name+" obtains SHARE-parent scope inside same transaction before write",()=>{
      assert.match(body,/getDb\(\)\.transaction\(async \(tx\) =>/);
      assert.ok(body.indexOf("await lockLiveContentWriteParents(tx, path")>=0);
      assert.ok(body.indexOf("await lockLiveContentWriteParents(tx, path")<body.indexOf(mutation));
    });
  }
  it("content transitions still require status + immutable parent/type CAS",()=>{
    assert.match(transition,/eq\(lessonContents.lessonId, current.lessonId\)/);
    assert.match(transition,/eq\(lessonContents.contentType, current.contentType\)/);
    assert.match(transition,/eq\(lessonContents.status, "DRAFT"\)/);
    assert.match(update,/ne\([\s\S]*?lessonContents.status,[\s\S]*?"ARCHIVED"/);
  });
});
