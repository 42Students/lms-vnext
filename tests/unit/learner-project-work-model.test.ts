import {describe,expect,it} from "vitest";
import {learnerProjectHasBlockedTasks} from "@/modules/projects/learner-project-work-model";
describe("learner blocked project filter",()=>{
  it("uses persisted blocked task count and excludes archived/completed work",()=>{
    const counts={totalTasks:5,completedTasks:2,blockedTasks:1};
    expect(learnerProjectHasBlockedTasks("ACTIVE",counts)).toBe(true);
    expect(learnerProjectHasBlockedTasks("ARCHIVED",counts)).toBe(false);
    expect(learnerProjectHasBlockedTasks("COMPLETED",counts)).toBe(false);
    expect(learnerProjectHasBlockedTasks("ACTIVE",undefined)).toBe(false);
    expect(learnerProjectHasBlockedTasks("ACTIVE",{...counts,blockedTasks:0})).toBe(false);
  });
});
