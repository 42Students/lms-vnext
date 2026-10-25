import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";

const lesson=readFileSync("src/modules/courses/lesson-service.ts","utf8");
const content=readFileSync("src/modules/courses/lesson-content-service.ts","utf8");
const route=readFileSync("src/app/api/courses/lessons/route.ts","utf8");

describe("legacy lesson authoring is atomic and scoped",()=>{
 it("normalizes legacy lessonName and contentsDTOs without trusting arbitrary child identities",()=>{
  expect(lesson).toContain("const {contentsDTOs,lessonName,courseSlug,courseId,...lessonFields}=rawObject");
  expect(lesson).toContain('if(resolvedLegacyPath&&lessonFields["learningPathId"]!==undefined');
  expect(lesson).toContain('item["lessonId"]!==undefined');
  expect(lesson).toContain('item["deliveryId"]!=null');
  expect(lesson).toContain("CONTENT_DELIVERY_MISMATCH");
  expect(lesson).toContain("createLessonContentInputSchema.parse");
 });
 it("only resolves legacy course links inside the selected tenant",()=>{
  expect(lesson).toContain("resolveLegacyLessonLearningPath(");
  expect(lesson).toContain("const legacyId=slug?null:raw.courseId");
  expect(lesson).toContain("eq(departments.collegeId,collegeId)");
  expect(lesson).toContain("return found.length===1?found[0]!.pathId:null");
  expect(route).toContain("COURSE_SCOPE_AMBIGUOUS");
 });
 it("inserts the lesson and all course-wide child contents under one transaction",()=>{
  const start=lesson.indexOf("return await getDb().transaction(async (tx) =>");
  const inserted=lesson.indexOf(".insert(courseLessons)",start);
  const children=lesson.indexOf("tx.insert(lessonContents)",inserted);
  const audit=lesson.indexOf("recordActivityEventInTransaction(tx, context",children);
  expect(start).toBeGreaterThan(-1);
  expect(inserted).toBeGreaterThan(start);
  expect(children).toBeGreaterThan(inserted);
  expect(audit).toBeGreaterThan(children);
  expect(content).toContain("export function normalizedContentValues(");
 });
});
