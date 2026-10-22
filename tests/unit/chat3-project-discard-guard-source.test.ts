import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";

describe("project workspace creation legacy discard navigation",()=>{
 it("intercepts Back to workspaces and new-workspace links while dirty",()=>{
  const creator=readFileSync("src/components/projects/class-team-workspace-creator.tsx","utf8");
  const guard=readFileSync("src/components/projects/project-editor-discard-guard.ts","utf8");
  expect(creator).toContain("useProjectEditorDiscardGuard(true,dirty,pending");
  expect(creator).toContain('href={basePath}');
  expect(creator).toContain('title="Discard unsaved changes?"');
  expect(guard).toContain('document.addEventListener("click",onLinkClick,true)');
  expect(guard).toContain("event.preventDefault();event.stopPropagation()");
 });
 it("performs one navigation only after confirmation and permits cancel",()=>{
  const guard=readFileSync("src/components/projects/project-editor-discard-guard.ts","utf8");
  expect(guard).toContain("leaveConfirmed.current=true;");
  expect(guard).toContain("window.location.assign(navigateTo);\n   return;");
  expect(guard).toContain("if(!next)destination.current=null");
  expect(guard).toContain('window.addEventListener("beforeunload",beforeUnload)');
 });
});
