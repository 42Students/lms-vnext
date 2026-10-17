import { describe, expect, it } from "vitest";
import {
  mentorSprintDetailsParamsSchema, mentorSprintDetailsSchema,
  sprintDetailsChanged,
} from "@/modules/projects/mentor-sprint-details-model";
import { safeMentorProjectEventLabel } from "@/modules/projects/mentor-portfolio-model";
const projectId="00000000-0000-4000-8000-000000000001";
const sprintId="00000000-0000-4000-8000-000000000002";
const before={title:"Sprint 1",description:null,goal:null,definitionOfDone:null,startDate:null,endDate:null,dueDate:null};
const valid={title:"Sprint 2",description:"Deliver tests",
  expectedUpdatedAt:"2026-10-14T04:30:00.000Z"};

describe("Mentor sprint details mutation",()=>{
  it("strictly validates only the registered editable fields",()=>{
    expect(mentorSprintDetailsSchema.parse(valid)).toEqual(valid);
    expect(mentorSprintDetailsParamsSchema.parse({projectId,sprintId}))
      .toEqual({projectId,sprintId});
    expect(mentorSprintDetailsSchema.safeParse({...valid,status:"COMPLETED"}).success).toBe(false);
    expect(mentorSprintDetailsSchema.safeParse({...valid,releaseId:projectId}).success).toBe(false);
    expect(mentorSprintDetailsSchema.safeParse({...valid,title:" "}).success).toBe(false);
    expect(mentorSprintDetailsSchema.safeParse({...valid,description:"x".repeat(4001)}).success).toBe(false);
    expect(mentorSprintDetailsSchema.safeParse({...valid,expectedUpdatedAt:"yesterday"}).success).toBe(false);
    expect(mentorSprintDetailsParamsSchema.safeParse({projectId,sprintId,collegeId:projectId}).success).toBe(false);
  });
  it("allows persisted title/description changes without phantom fields",()=>{
    expect(sprintDetailsChanged(before,{title:"Sprint 2",description:"Deliver tests",goal:null,definitionOfDone:null,startDate:null,endDate:null,dueDate:null})).toBe(true);
    expect(sprintDetailsChanged(before,{title:"Sprint 1",description:null,goal:null,definitionOfDone:null,startDate:null,endDate:null,dueDate:null})).toBe(false);
    expect(sprintDetailsChanged(before,{title:"Sprint 1",description:"New goals",goal:null,definitionOfDone:null,startDate:null,endDate:null,dueDate:null})).toBe(true);
  });
  it("maps the new audited event to a fixed, non-personal activity label",()=>{
    expect(safeMentorProjectEventLabel("projects.sprint.updated"))
      .toBe("Sprint details updated");
    expect(safeMentorProjectEventLabel("private-person-email@example.com"))
      .toBe("Project activity recorded");
  });
});
