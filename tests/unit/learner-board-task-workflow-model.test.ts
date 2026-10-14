import {describe,expect,it} from "vitest";
import {learnerBoardTaskWorkspaceHref} from "@/modules/projects/learner-board-task-workflow-model";
const id="11111111-1111-4111-8111-111111111111";
const filters={taskSearch:"write",priority:"HIGH",sprintId:"",releaseId:"",status:"IN_PROGRESS"};
describe("learner Board task workflow deep link",()=>{
 it("jumps to the real task card without reopening the read-only dialog",()=>{
  const href=learnerBoardTaskWorkspaceHref(id,filters,id);
  expect(href).toContain("taskStatus=IN_PROGRESS");
  expect(href).toContain("#mentor-task-"+id);
  expect(href).not.toContain("taskId=");
 });
 it("never builds an arbitrary fragment for an invalid task id",()=>{
  expect(learnerBoardTaskWorkspaceHref(id,filters,"javascript:evil")).not.toContain("#");
 });
});
