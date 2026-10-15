import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
describe("faculty lesson video management reachability",()=>{
 it("attaches a video manager to each lesson in Faculty Blueprint",()=>{
  const workspace=readFileSync("src/components/courses/faculty-course-workspace.tsx","utf8");
  expect(workspace).toContain("<FacultyLessonVideoManager");
  expect(workspace).toContain("lessonId={lesson.id}");
  expect(workspace).toContain("deliveryId={course.deliveryId}");
  expect(workspace).toContain("nextContentSequence={nextSequence}");
  expect(workspace.indexOf("<FacultyLessonVideoManager")).toBeGreaterThan(workspace.indexOf("workspace.lessons.map"));
 });
});
