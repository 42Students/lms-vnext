import { describe, expect, it } from "vitest";
import {
  mentorSprintProgressHref, mentorSprintProgressPage,
  mentorSprintProgressQuerySchema, summarizeSprintTasks,
} from "@/modules/projects/mentor-sprint-progress-model";

describe("Mentor sprint progress read model", () => {
  it("counts actual DONE, review and blocked statuses without inventing velocity", () => {
    expect(summarizeSprintTasks([
      {status:"DONE",total:3},{status:"BLOCKED",total:2},
      {status:"IN_REVIEW",total:1},{status:"TODO",total:2},
    ])).toEqual({total:8,completed:3,inReview:1,blocked:2,completionPercent:38});
    expect(summarizeSprintTasks([])).toEqual({
      total:0,completed:0,inReview:0,blocked:0,completionPercent:null,
    });
  });
  it("clamps stale page numbers and returns an honest empty page", () => {
    expect(mentorSprintProgressPage(41,999)).toEqual({
      total:41,page:3,pageSize:20,totalPages:3,
    });
    expect(mentorSprintProgressPage(0,25)).toEqual({
      total:0,page:1,pageSize:20,totalPages:1,
    });
  });
  it("rejects injected tenant or project scopes and invalid filters", () => {
    expect(mentorSprintProgressQuerySchema.safeParse({collegeId:"other"}).success).toBe(false);
    expect(mentorSprintProgressQuerySchema.safeParse({projectId:"other"}).success).toBe(false);
    expect(mentorSprintProgressQuerySchema.safeParse({state:"SHIPPED"}).success).toBe(false);
    expect(mentorSprintProgressQuerySchema.safeParse({release:"COMPLETED"}).success).toBe(false);
    expect(mentorSprintProgressQuerySchema.parse({release:"SHIPPED"}).release).toBe("SHIPPED");
    expect(mentorSprintProgressHref({state:"ALL",release:"SHIPPED",search:"",page:2})).toContain("release=SHIPPED&page=2");
    expect(mentorSprintProgressQuerySchema.safeParse({page:"0"}).success).toBe(false);
    expect(mentorSprintProgressQuerySchema.safeParse({search:"x".repeat(121)}).success).toBe(false);
  });
  it("retains view state without arbitrary scope fields", () => {
    expect(mentorSprintProgressHref({state:"ACTIVE",search:"Java & Web",page:2}))
      .toBe("/mentor/sprint-progress?state=ACTIVE&search=Java+%26+Web&page=2");
  });
});
