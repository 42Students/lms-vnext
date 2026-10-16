import {describe,expect,it} from "vitest";
import {projectTaskDueLabel, projectTaskVisibleFacts} from "@/modules/projects/project-task-visible-facts-model";
describe("LEARNER-projects-R02 and MEN-projects-meetings-41 task owner and due", () => {
 it("renders an IST date without shifting the calendar day",()=>{
  expect(projectTaskDueLabel("2026-10-16")).toBe("16 Oct 2026");
  expect(projectTaskDueLabel(null)).toBe("No due date");
  expect(projectTaskDueLabel("2026-02-30")).toBe("No due date");
 });
 it("distinguishes assigned members and missing estimates without leaking IDs",()=>{
  const task={assigneeMembershipId:"internal-id",dueDate:"2026-10-16",
    estimatePoints:8,taskType:"BUG",blockerReason:"Waiting for review"};
  expect(projectTaskVisibleFacts(task,"Student One")).toEqual({
    assignee:"Student One",dueDate:"16 Oct 2026",estimate:"8 points",
    taskType:"Bug",blockerReason:"Waiting for review",
  });
  expect(JSON.stringify(projectTaskVisibleFacts(task,"Student One"))).not.toContain("internal-id");
  expect(projectTaskVisibleFacts({...task,assigneeMembershipId:null,dueDate:null,
   estimatePoints:null,taskType:null,blockerReason:""},"Ignored")).toEqual({
    assignee:"Unassigned",dueDate:"No due date",estimate:"Not estimated",
    taskType:"Not set",blockerReason:null,
  });
 });
});
