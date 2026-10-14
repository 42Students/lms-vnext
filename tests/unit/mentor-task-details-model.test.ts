import { describe,expect,it } from "vitest";
import {
  mentorTaskDetailsParamsSchema,mentorTaskDetailsInputSchema,
  taskDetailsChangedFields,
} from "@/modules/projects/mentor-task-details-model";
import { safeMentorProjectEventLabel } from "@/modules/projects/mentor-portfolio-model";

const uuid="00000000-0000-4000-8000-000000000001";
const other="00000000-0000-4000-8000-000000000002";
const input={
  title:"Task",description:null,acceptanceCriteria:null,
  priority:"HIGH" as const,expectedUpdatedAt:"2026-10-14T04:30:00.000Z",
};
describe("Mentor registered task details mutation",()=>{
  it("accepts only exact project and task identifiers",()=>{
    expect(mentorTaskDetailsParamsSchema.parse({projectId:uuid,taskId:other}))
      .toEqual({projectId:uuid,taskId:other});
    expect(mentorTaskDetailsParamsSchema.safeParse({projectId:uuid,taskId:other,collegeId:uuid}).success)
      .toBe(false);
    expect(mentorTaskDetailsParamsSchema.safeParse({projectId:"invalid",taskId:other}).success)
      .toBe(false);
  });
  it("rejects missing concurrency token, status and forbidden assignee fields",()=>{
    expect(mentorTaskDetailsInputSchema.safeParse(input).success).toBe(true);
    expect(mentorTaskDetailsInputSchema.safeParse({...input,expectedUpdatedAt:undefined}).success)
      .toBe(false);
    expect(mentorTaskDetailsInputSchema.safeParse({...input,status:"DONE"}).success).toBe(false);
    expect(mentorTaskDetailsInputSchema.safeParse({...input,assigneeMembershipId:other}).success)
      .toBe(false);
    expect(mentorTaskDetailsInputSchema.safeParse({...input,sprintId:other}).success).toBe(false);
    expect(mentorTaskDetailsInputSchema.safeParse({...input,title:""}).success).toBe(false);
    expect(mentorTaskDetailsInputSchema.safeParse({...input,priority:"URGENT"}).success).toBe(false);
    expect(mentorTaskDetailsInputSchema.safeParse({...input,description:"x".repeat(4001)}).success)
      .toBe(false);
  });
  it("returns exact changed fields and safe activity labels",()=>{
    expect(taskDetailsChangedFields(input,{
      title:"Task revised",description:"Useful context",
      acceptanceCriteria:null,priority:"CRITICAL",
    })).toEqual(["title","description","priority"]);
    expect(taskDetailsChangedFields(input,input)).toEqual([]);
    expect(safeMentorProjectEventLabel("projects.task.details_updated"))
      .toBe("Task details updated");
  });
});
