import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";

const read=(path:string)=>readFileSync(new URL("../../"+path,import.meta.url),"utf8");
const dialog=read("src/components/ui/dialog.tsx");
const drawer=read("src/components/ui/drawer.tsx");
const confirmation=read("src/components/ui/confirm-dialog.tsx");

describe("UX-courses-attendance-overlay-foundation-01",()=>{
 it("shared modal enforces Escape/backdrop policy, focus restoration, scroll cues and accessible title",()=>{
  for(const source of [dialog,drawer]){
   expect(source).toContain("showModal()");
   expect(source).toContain("opener.current?.focus()");
   expect(source).toContain("aria-labelledby={titleId}");
   expect(source).toContain("onCancel={event");
   expect(source).toContain("event.preventDefault()");
   expect(source).toContain("dismissible");
   expect(source).toContain("<ScrollCue");
   expect(source).toContain('axis="y"');
   expect(source).toContain("safe-area-inset-bottom");
  }
  expect(confirmation).toContain("confirmDisabled");
  expect(confirmation).toContain("pending");
  expect(confirmation).toContain("onClick={onConfirm}");
  expect(confirmation).toContain("disabled={pending || confirmDisabled}");
 });

 const cases=[
  ["attendance","college-attendance-policy-form","ConfirmDialog",["Reset attendance policy to default?","onConfirm","pending"]],
  ["courses","admin-course-actions","Dialog",["Discard unsaved course changes?","ConfirmDialog","onOpenChange"]],
  ["courses","admin-course-create-panel","ConfirmDialog",["Course setup workflow","onConfirm={commitOffering}"]],
  ["courses","admin-learning-structure-actions","Dialog",["ConfirmDialog","LearningPathActions","onOpenChange"]],
  ["courses","assignment-submission-control","Dialog",["Discard this submission?","submissionType","onOpenChange"]],
  ["courses","college-archived-lesson-restore","ConfirmDialog",["Restore Lesson","onConfirm"]],
  ["courses","college-content-preview","Dialog",["Content preview","aria-haspopup","Scoped metadata preview only","Close preview"]],
  ["courses","college-lesson-reorder-actions","ConfirmDialog",["Lesson order controls","onConfirm={confirm}"]],
  ["courses","faculty-assessment-create","Drawer",["Select course and class","Select lesson","closeDrawer"]],
  ["courses","faculty-assessment-editor","Drawer",["Confirm title correction?","onOpenChange"]],
  ["courses","faculty-assignment-review","Drawer",["Submission grading filters","Submission student navigation","Assignment submissions"]],
  ["courses","faculty-content-editor","Drawer",["Discard unsaved changes to this lesson content?","onOpenChange"]],
  ["courses","faculty-lesson-authoring","ConfirmDialog",["Discard this content draft?","Any unsaved changes in this content form will be lost."]],
  ["courses","faculty-quiz-question-editor","Drawer",["Confirm replacement of this draft quiz question bank?","onOpenChange"]],
  ["courses","faculty-quiz-review","Drawer",["assessment list","onOpenChange"]],
  ["courses","faculty-report-download","ConfirmDialog",["This report is incomplete","onConfirm"]],
  ["courses","learner-roadmap-item-dialog","Dialog",["aria-haspopup","min-h-14","onOpenChange","Close"]],
  ["courses","resource-progress-control","ConfirmDialog",["Mark as complete","onConfirm"]],
 ] as const;
 for(const [area,name,primitive,required] of cases){
  it(`UX-${area}-${name}-01 preserves its accessible ${primitive} and relevant state/action`,()=>{
   const path=`src/components/${area}/${name}.tsx`;
   const source=read(path);
   expect(source).toContain(primitive);
   for(const token of required)expect(source).toContain(token);
   expect(source).not.toMatch(/<div[^>]*role="dialog"/);
  });
 }
});
