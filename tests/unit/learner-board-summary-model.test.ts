import {describe,expect,it} from "vitest";
import {learnerBoardStatusCounts,learnerBoardStatusFilterHref} from "@/modules/projects/learner-board-summary-model";
const projectId="11111111-1111-4111-8111-111111111111";
describe("learner Board status summary",()=>{
 it("counts only the rows supplied by the scoped Project workspace",()=>{
  expect(learnerBoardStatusCounts([{status:"TODO"},{status:"DONE"},{status:"TODO"},{status:"BOGUS"}]))
   .toEqual({TODO:2,IN_PROGRESS:0,BLOCKED:0,IN_REVIEW:0,DONE:1});
 });
 it("opens status-filtered Board while retaining sprint and priority",()=>{
  const href=learnerBoardStatusFilterHref(projectId,{taskSearch:"api",priority:"HIGH",status:"",sprintId:projectId,releaseId:""},"BLOCKED");
  expect(href).toContain("taskStatus=BLOCKED");
  expect(href).toContain("priority=HIGH");
  expect(href).toContain("sprintId=");
 });
});
