import {describe,it,expect} from "vitest";
import {assignProjectTaskInputSchema} from "@/modules/projects/task-assignment-service";
import {readFileSync} from "node:fs";
const source=readFileSync(new URL("../../src/modules/projects/task-assignment-service.ts",import.meta.url),"utf8");
describe("PR-S2-03 task assignment writes",()=>{
  it("requires a version and permits explicit unassignment",()=>{
    expect(assignProjectTaskInputSchema.safeParse({assigneeMembershipId:null,expectedUpdatedAt:"2026-10-16T00:00:00Z"}).success).toBe(true);
    expect(assignProjectTaskInputSchema.safeParse({assigneeMembershipId:null}).success).toBe(false);
    expect(assignProjectTaskInputSchema.safeParse({assigneeMembershipId:"not-an-id",expectedUpdatedAt:"2026-10-16T00:00:00Z"}).success).toBe(false);
  });
  it("locks rows and checks active project learner membership before assignment",()=>{
    for(const required of ['eq(projectMembers.role,"LEARNER")','eq(collegeMemberships.collegeId,scope.collegeId)','eq(collegeMemberships.status,"ACTIVE")','eq(users.platformStatus,"ACTIVE")',"date_trunc('milliseconds', ${projectTasks.updatedAt})",'PROJECTS_TASK_DETAILS_UPDATED'])expect(source).toContain(required);
  });
});
