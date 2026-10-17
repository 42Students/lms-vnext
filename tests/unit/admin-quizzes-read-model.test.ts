import { describe, expect, it } from "vitest";
import { adminAssessmentHref, adminAssessmentStats, adminAssessmentQuerySchema } from "@/modules/courses/admin-assessment-directory-model";
describe("Super Admin quiz directory", () => {
  it("retains CLOSED quiz status and admin pagination", () => {
    expect(adminAssessmentQuerySchema.safeParse({ status: "CLOSED", page: "3" })).toMatchObject({
      success: true, data: { status: "CLOSED", page: 3 },
    });
    expect(adminAssessmentHref("QUIZ", adminAssessmentQuerySchema.parse({ q: "term", status: "CLOSED", page: 3 })))
      .toBe("/admin/quizzes?q=term&status=CLOSED&page=3");
  });
  it("does not invent percentage results from attempt counts", () => {
    expect(adminAssessmentStats([{ status: "PUBLISHED", activityCount: 8 }]))
      .toEqual({ displayed: 1, published: 1, activity: 8 });
  });
});
