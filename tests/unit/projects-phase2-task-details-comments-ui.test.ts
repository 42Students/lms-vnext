import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
const read=(p:string)=>readFileSync(new URL("../../"+p,import.meta.url),"utf8");
const workspace=read("src/components/projects/project-workspace.tsx");
const create=read("src/components/projects/mentor-task-create.tsx");
const editor=read("src/components/projects/mentor-task-details-edit.tsx");
const comments=read("src/components/projects/project-task-comments.tsx");
const legacy=read("docs/audit/legacy-copy-A.md");
describe("PR-S2-04 0090 UI registered task fields and comments",()=>{
 it("uses legacy field labels and no obsolete storage warning",()=>{
  for(const label of ["Estimate","Type","Due date","blocking this task"]){
    expect(legacy).toContain(label);
    expect(create).toContain(label);
  }
  // Mentor edit form uses the shorter legacy labels (see commit d428bbd92).
  for(const label of ["Estimate","Type","Due","Blocker note"]) expect(editor).toContain(label);
  expect(create).not.toContain("estimate and workload tracking are unavailable");
  expect(workspace).toContain("<ProjectTaskComments");
  expect(workspace).toContain("taskType={task.taskType}");
 });
 it("uses real 0090 task comment endpoint for read/write",()=>{
  expect(comments).toContain('"/comments"');
  expect(comments).toContain('expectedTaskUpdatedAt:currentToken');
 });
});