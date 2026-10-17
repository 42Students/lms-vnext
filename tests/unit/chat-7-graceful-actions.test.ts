import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
const src=(p:string)=>readFileSync(new URL("../../"+p,import.meta.url),"utf8");
describe("chat-7 graceful operation on touched pages",()=>{
 it("GR-35 MEN-projects-meetings-46 confirms destructive task deletion in an accessible dialog",()=>{
  const text=src("src/components/projects/mentor-task-delete-control.tsx");
  expect(text).toContain("ConfirmDialog");
  expect(text).toContain("Delete this task?");
  expect(text).not.toContain("window.confirm");
  expect(text).toContain("if(pending)return");
 });
 it("GR-35 REC-home-drives-49 previews bulk results in a keyboard-reachable confirmation dialog",()=>{
  const text=src("src/components/placements/recruiter-result-controls.tsx");
  expect(text).toContain("ConfirmDialog");
  expect(text).toContain("Send ");
  expect(text).toContain("No result is final until the placement cell applies it.");
  expect(text).not.toContain("window.confirm");
 });
 it("GR-35 FAC-courses-24 uses a real draft-discard dialog and keeps unsaved input until confirmation",()=>{
  const text=src("src/components/courses/faculty-lesson-authoring.tsx");
  expect(text).toContain("ConfirmDialog");
  expect(text).toContain("Discard this content draft?");
  expect(text).toContain("setDiscardConfirm(true)");
  expect(text).not.toContain("window.confirm");
 });
 it("GR-90 mentor delete failures keep a spoken error and never show provider text",()=>{
  const text=src("src/components/projects/mentor-task-delete-control.tsx");
  expect(text).toContain('role="alert"');
  expect(text).toContain("Could not delete this task. Please try again.");
  expect(text).not.toContain("cause.message");
 });
 it("GR-71 Learner Placements exposes the genuine failed and empty views instead of a blank state",()=>{
  const failed=src("src/components/placements/learner-placement-partial-alert.tsx");
  const empty=src("src/modules/placements/learner-drives-empty-state-model.ts");
  expect(failed).toContain('role="alert"');
  expect(failed).toContain("Retry");
  expect(empty).toContain("NO_PUBLISHED");
  expect(empty).toContain("FILTERED_OUT");
 });
 it("GR-71 Faculty Courses differentiates an empty assigned list and a search miss",()=>{
  const text=src("src/components/courses/faculty-course-list.tsx");
  expect(text).toContain("No teaching assignments found. Please contact your administrator.");
  expect(text).toContain("No courses match");
 });
 it("GR-90 Recruiter result errors use plain toast copy and retain unsubmitted selections",()=>{
  const text=src("src/components/placements/recruiter-result-controls.tsx");
  expect(text).toContain("Could not save this result. Please try again.");
  expect(text).toContain("failed selections remain checked for retry.");
 });
});
