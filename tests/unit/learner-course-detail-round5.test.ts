import {readFileSync} from "node:fs";
import {join} from "node:path";
import {describe,expect,it} from "vitest";
import {resourceInteractionState} from "@/components/courses/learner-interaction-model";
const code=(p:string)=>readFileSync(join(process.cwd(),p),"utf8");
describe("chat-11 Learner Course Detail legacy parity",()=>{
 it("LEARNER-course-detail-08 allows manual Resource and Live session completion with legacy confirmation copy",()=>{
  expect(resourceInteractionState({type:"RESOURCE",externalUrl:null,storageKey:null,progressStatus:"NOT_STARTED"}).canMarkComplete).toBe(true);
  expect(resourceInteractionState({type:"LIVE_CLASS",externalUrl:null,storageKey:null,progressStatus:"NOT_STARTED"}).canMarkComplete).toBe(true);
  expect(resourceInteractionState({type:"VIDEO",externalUrl:null,storageKey:null,progressStatus:"NOT_STARTED"}).canMarkComplete).toBe(false);
  const ui=code("src/components/courses/resource-progress-control.tsx");
  expect(ui).toContain("Finished with these materials?");
  expect(ui).toContain("Attended this session?");
  expect(ui).toContain("Marked as complete");
  expect(code("src/modules/courses/progress-service.ts")).not.toContain('throw new CoursesServiceError(\n        "LIVE_CLASS_NOT_FINISHED"');
 });
 it("LEARNER-course-detail-14 displays content kind, progress and due labels on learning items",()=>{
  const row=code("src/components/courses/learner-roadmap-item-dialog.tsx");
  expect(row).toContain("caption ?? kind");
  expect(row).toContain("Due ");
  const page=code("src/components/courses/learner-course-workspace.tsx");
  expect(page).toContain('caption="Assignment"');
  expect(page).toContain('caption="Quiz"');
  expect(page).toContain('"Live session"');
 });
 it("LEARNER-course-detail-15 defaults to next unfinished lesson and shows legacy status and numbering",()=>{
  const page=code("src/components/courses/learner-course-workspace.tsx");
  expect(page).toContain('padStart(2, "0")');
  expect(page).toContain("workspace.nextItem?.lessonId === lesson.id");
  expect(page).toContain("Continue here");
  expect(page).toContain("Not started");
  expect(page).toContain('label: "Live sessions"');
 });
 it("LEARNER-course-detail-16 gives lesson-focused previous next and back navigation",()=>{
  const page=code("src/components/courses/learner-course-workspace.tsx");
  expect(page).toContain("focusLessonId && focusLessonId !== lesson.id");
  expect(page).toContain("Back to Learning Path");
  expect(page).toContain("Previous lesson");
  expect(page).toContain("Next lesson");
  expect(page).toContain('aria-label="Lesson navigation"');
 });
});
