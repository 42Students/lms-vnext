import {describe,it,expect} from "vitest";
import {projectTaskExpandedFieldsSchema,projectTaskBlockerValid,projectTaskCommentInputSchema} from "@/modules/projects/pr-s2-04-task-fields-model";
import {readFileSync} from "node:fs";
const sql=readFileSync(new URL("../../docs/proposed-migrations/pr-s2-04-task-details.sql",import.meta.url),"utf8");
describe("PR-S2-04 staged task details",()=>{
  it("validates estimates, task types and dated work",()=>{
    expect(projectTaskExpandedFieldsSchema.safeParse({taskType:"BUG",dueDate:"2026-10-30",estimatePoints:8}).success).toBe(true);
    expect(projectTaskExpandedFieldsSchema.safeParse({taskType:"OTHER"}).success).toBe(false);
    expect(projectTaskExpandedFieldsSchema.safeParse({estimatePoints:-1}).success).toBe(false);
    expect(projectTaskBlockerValid("BLOCKED","")).toBe(false);
    expect(projectTaskBlockerValid("BLOCKED","Waiting for feedback")).toBe(true);
    expect(projectTaskCommentInputSchema.safeParse({body:"Review",expectedTaskUpdatedAt:"2026-10-16T00:00:00Z"}).success).toBe(true);
  });
  it("stages cross-tenant safe composite task FK for comment history",()=>{
    expect(sql).toContain("UNIQUE (project_id,id)");
    expect(sql).toContain("FOREIGN KEY(project_id,task_id)");
    expect(sql).toContain("author_membership_id");
  });
});
