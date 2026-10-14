import { describe, expect, it } from "vitest";
import {
  mentorProjectActivityHref, mentorProjectActivityPage, mentorProjectActivityQuerySchema,
  mentorProjectActivityEventTypes,
} from "@/modules/projects/mentor-project-activity-model";

const projectId="00000000-0000-4000-8000-000000000001";
describe("Mentor exact project event timeline",()=>{
  it("bounds pagination and never converts absent events into created work",()=>{
    expect(mentorProjectActivityPage(21,999))
      .toEqual({total:21,pageSize:20,page:2,totalPages:2});
    expect(mentorProjectActivityPage(0,1234))
      .toEqual({total:0,pageSize:20,page:1,totalPages:1});
  });
  it("requires an exact valid UUID and narrow registered importance values",()=>{
    expect(mentorProjectActivityQuerySchema.safeParse({projectId}).success).toBe(true);
    expect(mentorProjectActivityQuerySchema.safeParse({projectId:"invalid"}).success).toBe(false);
    expect(mentorProjectActivityQuerySchema.safeParse({projectId,importance:"OTHER"}).success).toBe(false);
    expect(mentorProjectActivityQuerySchema.safeParse({projectId,page:"0"}).success).toBe(false);
    expect(mentorProjectActivityQuerySchema.safeParse({projectId,collegeId:projectId}).success).toBe(false);
    expect(mentorProjectActivityQuerySchema.safeParse({projectId,actorId:projectId}).success).toBe(false);
  });
  it("only selects registered event-type groups, not raw event metadata",()=>{
    expect(mentorProjectActivityEventTypes("ALL")).toBeNull();
    expect(mentorProjectActivityEventTypes("REVIEWS")).toEqual([
      "projects.task.reviewed","projects.delivery.reviewed",
    ]);
    expect(mentorProjectActivityEventTypes("MEETINGS")).toContain("projects.meeting.rescheduled");
    expect(mentorProjectActivityQuerySchema.safeParse({
      projectId,view:"OTHER",
    }).success).toBe(false);
    expect(mentorProjectActivityHref({
      projectId,importance:"ALL",view:"REVIEWS",page:2,
    })).toContain("view=REVIEWS");
  });
  it("preserves project identity in navigation, not an injected actor filter",()=>{
    expect(mentorProjectActivityHref({projectId,importance:"HIGH",view:"ALL",page:3}))
      .toBe("/mentor/projects/"+projectId+"/activity-history?importance=HIGH&page=3");
  });
});
