import {describe,expect,it} from "vitest";
import {learnerBoardPriorityCounts,learnerBoardPriorityFilterHref} from "@/modules/projects/learner-board-priority-model";
const id="11111111-1111-4111-8111-111111111111";
describe("learner Board priority drill-ins",()=>{
 it("counts only persisted recognized priorities in the already-scoped workspace",()=>{
  expect(learnerBoardPriorityCounts([{priority:"LOW"},{priority:"HIGH"},{priority:"HIGH"},{priority:"UNSET"}]))
   .toEqual({LOW:1,MEDIUM:0,HIGH:2,CRITICAL:0});
 });
 it("preserves status/sprint/search while selecting a priority",()=>{
  const href=learnerBoardPriorityFilterHref(id,{taskSearch:"API",priority:"LOW",status:"BLOCKED",sprintId:id,releaseId:""},"CRITICAL");
  expect(href).toContain("priority=CRITICAL");
  expect(href).toContain("taskStatus=BLOCKED");
  expect(href).toContain("sprintId=");
  expect(href).toContain("taskSearch=API");
 });
});
