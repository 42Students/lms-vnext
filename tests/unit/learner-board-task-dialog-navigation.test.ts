import {describe,it,expect} from "vitest";
import {createLearnerBoardTaskDialogNavigationGuard} from "@/modules/projects/learner-board-task-dialog-navigation-model";
describe("learner Project Board task dialog return behavior",()=>{
 it("does not route back after following the task's action deep link",()=>{
  const guard=createLearnerBoardTaskDialogNavigationGuard();guard.startNavigation();expect(guard.shouldReturn()).toBe(false);
 });
 it("resets when a different task is selected in the mounted dialog",()=>{
  const guard=createLearnerBoardTaskDialogNavigationGuard();guard.startNavigation();guard.reset();expect(guard.shouldReturn()).toBe(true);
 });
});
