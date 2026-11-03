import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
describe("Learner board confirmations use accessible dialogs and keep server guards",()=>{
 const code=readFileSync("src/components/projects/learner-board-interactive.tsx","utf8");
 it("asks for a meaningful blocker reason without native window.prompt",()=>{
  expect(code).toContain('setBlockedTarget({taskId,title:task.title})');
  expect(code).toContain('maxLength={2000} required rows={4}');
  expect(code).toContain('confirmDisabled={blockerDraft.trim().length<3');
  expect(code).toContain('void move(targetId,"BLOCKED",note)');
  expect(code).toContain('expectedUpdatedAt:new Date(task.updatedAt).toISOString()');
  expect(code).not.toContain("window.prompt(");
 });
 it("confirms a backlog pull without triggering browser confirm",()=>{
  expect(code).toContain("await askConfirm(");
  expect(code).toContain("if(!(await askConfirm(");
  expect(code).toContain("onOpenChange={open=>");
  expect(code).toContain("{dialog}");
  expect(code).not.toContain("window.confirm(");
 });
});
