import {describe,it,expect} from "vitest";
import {projectTaskExpandedFieldsSchema,projectTaskBlockerValid,projectTaskCommentInputSchema} from "@/modules/projects/pr-s2-04-task-fields-model";
import {mentorTaskCreateSchema} from "@/modules/projects/mentor-task-create-model";
import {mentorTaskDetailsInputSchema} from "@/modules/projects/mentor-task-details-model";
import {readFileSync} from "node:fs";
const schema=readFileSync(new URL("../../src/db/schema/projects.ts",import.meta.url),"utf8");
describe("PR-S2-04 registered 0090 field validation",()=>{
  it("accepts valid estimates/date/types and rejects unsafe ones",()=>{
    expect(projectTaskExpandedFieldsSchema.safeParse({taskType:"BUG",dueDate:"2026-10-30",estimatePoints:8}).success).toBe(true);
    expect(projectTaskExpandedFieldsSchema.safeParse({taskType:"OTHER"}).success).toBe(false);
    expect(projectTaskExpandedFieldsSchema.safeParse({estimatePoints:-1}).success).toBe(false);
    expect(projectTaskBlockerValid("BLOCKED","")).toBe(false);
    expect(projectTaskBlockerValid("BLOCKED","Waiting")).toBe(true);
    expect(projectTaskCommentInputSchema.safeParse({body:"Review",expectedTaskUpdatedAt:"2026-10-16T00:00:00Z"}).success).toBe(true);
  });
  it("uses registered task metadata on create/edit and registered comments table",()=>{
    expect(mentorTaskCreateSchema.shape.taskType).toBeDefined();
    expect(mentorTaskDetailsInputSchema.shape.blockerReason).toBeDefined();
    expect(schema).toContain("export const projectTaskComments = pgTable(");
    expect(schema).toContain('"project_task_comments_project_task_fk"');
  });
});