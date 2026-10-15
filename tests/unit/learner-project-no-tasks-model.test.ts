import {describe,it,expect} from "vitest";
import {learnerProjectHasNoTrackedTasks} from "@/modules/projects/learner-project-work-model";
describe("learner Project empty tracked-task filter",()=>{
 it("finds active or planned projects only when scoped progress exists and is zero",()=>{
  expect(learnerProjectHasNoTrackedTasks("ACTIVE",{totalTasks:0,completedTasks:0,blockedTasks:0})).toBe(true);
  expect(learnerProjectHasNoTrackedTasks("PLANNED",{totalTasks:0,completedTasks:0,blockedTasks:0})).toBe(true);
  expect(learnerProjectHasNoTrackedTasks("ACTIVE",undefined)).toBe(false);
  expect(learnerProjectHasNoTrackedTasks("ACTIVE",{totalTasks:1,completedTasks:0,blockedTasks:0})).toBe(false);
 });
 it("does not surface closed/archived projects as a new-work callout",()=>{
  const zero={totalTasks:0,completedTasks:0,blockedTasks:0};
  expect(learnerProjectHasNoTrackedTasks("ARCHIVED",zero)).toBe(false);
  expect(learnerProjectHasNoTrackedTasks("COMPLETED",zero)).toBe(false);
 });
});
