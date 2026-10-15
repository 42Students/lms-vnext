import {describe,expect,it} from "vitest";
import {learnerRoadmapDialogKey} from "@/modules/courses/learner-roadmap-dialog-key-model";
describe("Learning Path dialog identity across deep-link navigation",()=>{
 it("remounts only when focus changes for a published lesson item",()=>{
  expect(learnerRoadmapDialogKey("lesson","a",false))
   .not.toBe(learnerRoadmapDialogKey("lesson","a",true));
 });
 it("keeps distinct lesson IDs separate even with equal item IDs",()=>{
  expect(learnerRoadmapDialogKey("lesson-a","same",true))
   .not.toBe(learnerRoadmapDialogKey("lesson-b","same",true));
 });
});
