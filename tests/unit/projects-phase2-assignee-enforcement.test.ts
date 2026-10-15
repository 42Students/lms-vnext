import {describe,it,expect} from "vitest";
import {maySubmitAssignedProjectTask} from "@/modules/projects/task-assignee-policy";
import {readFileSync} from "node:fs";
const source=readFileSync(new URL("../../src/modules/projects/task-submission-service.ts",import.meta.url),"utf8");
describe("PR-S2-03 persisted task assignee",()=>{
  it("refuses unassigned and other learner's submissions",()=>{
    expect(maySubmitAssignedProjectTask(null,"learner-a")).toBe(false);
    expect(maySubmitAssignedProjectTask("learner-a","learner-b")).toBe(false);
    expect(maySubmitAssignedProjectTask("learner-a",null)).toBe(false);
    expect(maySubmitAssignedProjectTask("learner-a","learner-a")).toBe(true);
  });
  it("checks persisted assignment under the project task row lock",()=>{
    expect(source).toContain("maySubmitAssignedProjectTask(task.assigneeMembershipId, context.membership?.id ?? null)");
    expect(source).toContain('PROJECT_TASK_SUBMISSION_ACCESS_DENIED');
    expect(source).toContain('.for("update")');
  });
});
