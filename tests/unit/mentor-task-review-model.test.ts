import { describe, expect, it } from "vitest";
import {
  mentorTaskReviewQuerySchema, mentorTaskReviewHref, mentorTaskReviewSummary,
} from "@/modules/projects/mentor-task-review-model";

describe("Mentor pending task review model", () => {
  it("uses persisted totals to calculate page bounds", () => {
    expect(mentorTaskReviewSummary({total:21,page:2,pageSize:20})).toEqual({
      total:21,page:2,pageSize:20,totalPages:2,first:21,last:21,
    });
    expect(mentorTaskReviewSummary({total:0,page:1,pageSize:20}).first).toBe(0);
  });
  it("rejects untrusted selectors and excessive page size", () => {
    expect(mentorTaskReviewQuerySchema.safeParse({membershipId:"unknown"}).success).toBe(false);
    expect(mentorTaskReviewQuerySchema.safeParse({collegeId:"other"}).success).toBe(false);
    expect(mentorTaskReviewQuerySchema.safeParse({pageSize:51}).success).toBe(false);
    expect(mentorTaskReviewQuerySchema.safeParse({page:0}).success).toBe(false);
  });
  it("encodes only supported search and page parameters", () => {
    expect(mentorTaskReviewHref({search:"Cloud & Ops",page:2,pageSize:50}))
      .toBe("/mentor/task-reviews?search=Cloud+%26+Ops&page=2&pageSize=50");
  });
});
