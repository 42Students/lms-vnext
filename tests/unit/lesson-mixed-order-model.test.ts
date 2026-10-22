import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";
import {orderLessonCurriculum} from "@/modules/courses/lesson-mixed-order-model";

describe("G2-13-027-042: legacy cross-kind curriculum",()=>{
 it("interleaves assignments, media and quizzes by sequence without discarding ties",()=>{
  const rows=[
   {id:"z",sequence:4,kind:"VIDEO"},
   {id:"a",sequence:1,kind:"ASSIGNMENT"},
   {id:"b",sequence:4,kind:"ASSIGNMENT"},
   {id:"c",sequence:3,kind:"QUIZ"},
   {id:"d",sequence:4,kind:"ASSIGNMENT"},
  ];
  const ordered=orderLessonCurriculum(rows);
  expect(ordered.map(row=>row.id)).toEqual(["a","c","b","d","z"]);
  expect(rows.map(row=>row.id)).toEqual(["z","a","b","c","d"]);
 });
 it("exposes the combined ordered projection alongside old per-kind arrays",()=>{
  const page=readFileSync("src/modules/courses/college-offering-section-preview-service.ts","utf8");
  expect(page).toContain("curriculum:orderLessonCurriculum([");
  expect(page).toContain('source:"CONTENT" as const');
  expect(page).toContain('kind:"ASSIGNMENT" as const');
  expect(page).toContain('kind:"QUIZ" as const');
  expect(page).toContain("eq(courseAssignments.deliveryId,selected.deliveryId)");
  expect(page).toContain("eq(lessonContents.deliveryId,selected.deliveryId)");
 });
});
