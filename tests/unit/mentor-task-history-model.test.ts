import { describe,expect,it } from "vitest";
import {
  mentorTaskHistoryHref, mentorTaskHistoryPage, mentorTaskHistoryQuerySchema,
  taskReviewDecisionLabel,
} from "@/modules/projects/mentor-task-history-model";

describe("Mentor reviewed task history model",()=>{
  it("maps recorded decisions only",()=>{
    expect(taskReviewDecisionLabel("APPROVED")).toBe("Approved");
    expect(taskReviewDecisionLabel("CHANGES_REQUESTED")).toBe("Changes requested");
    expect(taskReviewDecisionLabel("SUBMITTED")).toBe("Recorded review");
  });
  it("clamps stale pages without pretending missing reviews exist",()=>{
    expect(mentorTaskHistoryPage(21,999)).toEqual({total:21,page:2,pageSize:20,totalPages:2});
    expect(mentorTaskHistoryPage(0,66)).toEqual({total:0,page:1,pageSize:20,totalPages:1});
  });
  it("rejects forged project, membership and college scopes",()=>{
    expect(mentorTaskHistoryQuerySchema.safeParse({collegeId:"other"}).success).toBe(false);
    expect(mentorTaskHistoryQuerySchema.safeParse({projectId:"other"}).success).toBe(false);
    expect(mentorTaskHistoryQuerySchema.safeParse({decision:"SUBMITTED"}).success).toBe(false);
    expect(mentorTaskHistoryQuerySchema.safeParse({priority:"URGENT"}).success).toBe(false);
    expect(mentorTaskHistoryQuerySchema.parse({priority:"HIGH"}).priority).toBe("HIGH");
    expect(mentorTaskHistoryQuerySchema.safeParse({page:0}).success).toBe(false);
    expect(mentorTaskHistoryQuerySchema.safeParse({search:"x".repeat(121)}).success).toBe(false);
  });
  it("preserves filters when moving through authorized pages",()=>{
    expect(mentorTaskHistoryHref({decision:"APPROVED",search:"A & B",page:2}))
      .toBe("/mentor/task-review-history?decision=APPROVED&search=A+%26+B&page=2");
    expect(mentorTaskHistoryHref({decision:"APPROVED",priority:"CRITICAL",search:"",page:2}))
      .toContain("priority=CRITICAL");
  });
});
