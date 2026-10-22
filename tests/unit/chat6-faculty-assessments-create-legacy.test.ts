import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";

describe("faculty assessment create legacy two-step entry",()=>{
 it("FAC-assessments-12 requires course and lesson before Continue and exposes exact selection copy",()=>{
  const src=readFileSync("src/components/courses/faculty-assessment-create.tsx","utf8");
  for(const label of ["Select course and class","Select lesson","Continue","Select a course and lesson to create a quiz.","No lessons in this course yet. Create a lesson"]){
   expect(src).toContain(label);
  }
  expect(src).toContain("disabled={!course||!lesson||Boolean(lessonsLoadError)}");
  expect(src).toContain("disabled={!lesson||!course||editorBusy}");
  expect(src).toContain("setLessonKey(\"\")");
  expect(src).toContain("continued&&lesson&&course");
  expect(src).toContain("deliveryId={course.deliveryId}");
 });
});
