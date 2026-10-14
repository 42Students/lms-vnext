import { describe, expect, it } from "vitest";
import {
  mentorReviewDecisionLabel,
  mentorReviewHistoryHref,
  mentorReviewHistoryPagination,
  mentorReviewHistoryLiteralSearch,
  mentorReviewHistoryQuerySchema,
} from "@/modules/projects/mentor-review-history-model";

describe("Mentor final delivery history model",() => {
  it("uses only persisted final-delivery decision labels",() => {
    expect(mentorReviewDecisionLabel("APPROVED")).toBe("Approved");
    expect(mentorReviewDecisionLabel("CHANGES_REQUESTED")).toBe("Changes requested");
    expect(mentorReviewDecisionLabel("PRIVATE:learner@example.com")).toBe("Recorded review");
  });
  it("clamps stale pagination and represents honest no-data",() => {
    expect(mentorReviewHistoryPagination(21,999)).toEqual({
      total:21,pageSize:20,totalPages:2,page:2,
    });
    expect(mentorReviewHistoryPagination(0,55)).toEqual({
      total:0,pageSize:20,totalPages:1,page:1,
    });
  });
  it("rejects project, college and actor selectors",() => {
    expect(mentorReviewHistoryQuerySchema.safeParse({projectId:"other"}).success).toBe(false);
    expect(mentorReviewHistoryQuerySchema.safeParse({membershipId:"other"}).success).toBe(false);
    expect(mentorReviewHistoryQuerySchema.safeParse({decision:"UNKNOWN"}).success).toBe(false);
    expect(mentorReviewHistoryQuerySchema.safeParse({page:"0"}).success).toBe(false);
    expect(mentorReviewHistoryQuerySchema.safeParse({search:"x".repeat(121)}).success).toBe(false);
    expect(mentorReviewHistoryLiteralSearch("%_\\")).toBe("\\%\\_\\\\");
    expect(mentorReviewHistoryHref({decision:"ALL",search:"Atlas & Co",page:2})).toContain("search=Atlas+%26+Co&page=2");
  });
  it("constructs scoped review history URLs",() => {
    expect(mentorReviewHistoryHref({decision:"APPROVED",page:3}))
      .toBe("/mentor/review-history?decision=APPROVED&page=3");
    expect(mentorReviewHistoryHref({decision:"ALL",page:1}))
      .toBe("/mentor/review-history");
  });
});
