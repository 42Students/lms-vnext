import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";
import {projectTaskCommentInputSchema} from "@/modules/projects/pr-s2-04-task-fields-model";

const token="2026-10-22T12:00:00.000Z";
const input={body:"Completed the first milestone",expectedTaskUpdatedAt:token};
describe("Project comment legacy optional progress",()=>{
 it("preserves validated progress on human progress updates",()=>{
  expect(projectTaskCommentInputSchema.parse({...input,commentKind:"PROGRESS",
    progressValue:0})).toMatchObject({commentKind:"PROGRESS_UPDATE",progressValue:0});
  expect(projectTaskCommentInputSchema.safeParse({...input,commentKind:"PROGRESS_UPDATE",
    progressValue:100}).success).toBe(true);
  expect(projectTaskCommentInputSchema.safeParse({...input,commentKind:"PROGRESS_UPDATE",
    progressValue:101}).success).toBe(false);
  expect(projectTaskCommentInputSchema.safeParse({...input,commentKind:"PROGRESS_UPDATE",
    progressValue:42.5}).success).toBe(false);
 });
 it("prevents human comments spoofing task status and system events",()=>{
  expect(projectTaskCommentInputSchema.safeParse({...input,commentKind:"NOTE",
    progressValue:50}).success).toBe(false);
  expect(projectTaskCommentInputSchema.safeParse({...input,commentKind:"STATUS_UPDATE"}).success).toBe(false);
  expect(projectTaskCommentInputSchema.safeParse({...input,commentKind:"PROGRESS_UPDATE",
    taskStatusSnapshot:"DONE"}).success).toBe(false);
 });
 it("writes the percentage and locked task status in the same scoped transaction",()=>{
  const service=readFileSync("src/modules/projects/task-comment-service.ts","utf8");
  const ui=readFileSync("src/components/projects/project-task-comments.tsx","utf8");
  expect(service).toContain("progressValue:input.progressValue??null");
  expect(service).toContain("taskStatusSnapshot:task.status");
  expect(ui).toContain('aria-label="Progress percentage"');
  expect(ui).toContain("progressValue:progress");
 });
});
