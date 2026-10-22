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
  // Quiz uses the authorized course/lesson snapshot captured by Continue,
  // so a subsequent dropdown change cannot redirect a draft to another lesson.
  expect(src).toContain('const selectedContext=kind==="QUIZ"?snapshot:');
  expect(src).toContain('setSnapshot({deliveryId:course.deliveryId,lessonId:lesson.lessonId,nextSequence:lesson.nextSequence})');
  expect(src).toContain("open&&continued");
  // The quiz builder must remain bound to the frozen Continue snapshot,
  // not a mutable dropdown selection after Continue.
  expect(src).toContain("deliveryId={selectedContext.deliveryId}");
  expect(src).toContain("lessonId={selectedContext.lessonId}");
  expect(src).toContain("key={selectedContext.deliveryId");
  expect(src).toContain("nextQuizSequence={selectedContext.nextSequence}");
 });
});
