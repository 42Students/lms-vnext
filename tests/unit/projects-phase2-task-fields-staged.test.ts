import {describe,it,expect} from "vitest";
import {projectTaskExpandedFieldsSchema,projectTaskBlockerValid,projectTaskCommentInputSchema} from "@/modules/projects/pr-s2-04-task-fields-model";
import {readFileSync} from "node:fs";
const sql=readFileSync(new URL("../../drizzle/0090_project_task_details.sql",import.meta.url),"utf8");
const schema=readFileSync(new URL("../../src/db/schema/projects.ts",import.meta.url),"utf8");
describe("PR-S2-04 registered task details",()=>{
  it("validates estimates, task types and dated work",()=>{
    expect(projectTaskExpandedFieldsSchema.safeParse({taskType:"BUG",dueDate:"2026-10-30",estimatePoints:8}).success).toBe(true);
    expect(projectTaskExpandedFieldsSchema.safeParse({taskType:"OTHER"}).success).toBe(false);
    expect(projectTaskExpandedFieldsSchema.safeParse({estimatePoints:-1}).success).toBe(false);
    expect(projectTaskBlockerValid("BLOCKED","")).toBe(false);
    expect(projectTaskBlockerValid("BLOCKED","Waiting for feedback")).toBe(true);
    expect(projectTaskCommentInputSchema.safeParse({body:"Review",expectedTaskUpdatedAt:"2026-10-16T00:00:00Z"}).success).toBe(true);
  });
  it("registers cross-tenant safe composite task FK for comment history",()=>{
    expect(sql).toContain('UNIQUE INDEX "project_tasks_project_id_id_uq"');
    expect(sql).toContain('FOREIGN KEY ("project_id","task_id")');
    expect(sql).toContain("author_membership_id");
    expect(sql.indexOf("project_tasks_project_id_id_uq")).toBeLessThan(sql.indexOf("project_task_comments_project_task_fk"));
    expect(schema).toContain("projectTaskComments");
    expect(schema).toContain('uniqueIndex("project_tasks_project_id_id_uq")');
  });
});
