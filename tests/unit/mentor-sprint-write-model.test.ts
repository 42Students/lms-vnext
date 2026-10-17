import { describe, expect, it } from "vitest";
import {
  mentorSprintCreateSchema, mentorSprintTransitionSchema,
  isValidMentorSprintTransition,
} from "@/modules/projects/mentor-sprint-write-model";

const releaseId="00000000-0000-4000-8000-000000000001";
describe("Mentor sprint create and transition model",()=>{
  it("accepts only migrated title/description/goal/date/release fields",()=>{
    const base={releaseId,title:" Sprint A ",description:null,goal:null,
      definitionOfDone:null,startDate:null,endDate:null,dueDate:null};
    expect(mentorSprintCreateSchema.safeParse(base).success).toBe(true);
    expect(mentorSprintCreateSchema.safeParse({...base,startDate:"2026-10-14"}).success).toBe(true);
    expect(mentorSprintCreateSchema.safeParse({...base,startDate:"2026-10-14",endDate:"2026-10-01"}).success).toBe(false);
    expect(mentorSprintCreateSchema.safeParse({...base,startDate:"2026-10-14T00:00:00Z"}).success).toBe(false);
    expect(mentorSprintCreateSchema.safeParse({...base,collegeId:releaseId}).success).toBe(false);
  });
  it("checks date tokens as ISO instants but never misinterprets plain calendar dates",()=>{
    expect(mentorSprintTransitionSchema.safeParse({
      action:"START",expectedUpdatedAt:"2026-10-14T10:00:00+05:30",
    }).success).toBe(true);
    expect(mentorSprintTransitionSchema.safeParse({
      action:"START",expectedUpdatedAt:"2026-10-14",
    }).success).toBe(false);
    expect(mentorSprintTransitionSchema.safeParse({
      action:"START",expectedUpdatedAt:"2026-10-14T10:00:00",
    }).success).toBe(false);
    expect(mentorSprintTransitionSchema.safeParse({
      action:"START",expectedUpdatedAt:"2026-10-14T10:00:00Z",collegeId:releaseId,
    }).success).toBe(false);
  });
  it("permits only lifecycle-owned transitions",()=>{
    expect(isValidMentorSprintTransition("PLANNED","START")).toBe(true);
    expect(isValidMentorSprintTransition("ACTIVE","COMPLETE")).toBe(true);
    expect(isValidMentorSprintTransition("COMPLETED","REOPEN")).toBe(true);
    expect(isValidMentorSprintTransition("ACTIVE","START")).toBe(false);
  });
});
