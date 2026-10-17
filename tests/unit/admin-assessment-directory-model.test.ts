import { describe, expect, it } from "vitest";
import { adminAssessmentQuerySchema, adminAssessmentHref, adminAssessmentStats } from "@/modules/courses/admin-assessment-directory-model";
describe("Super Admin assessments read model", () => {
  it("keeps links inside admin, and strictly validates query", () => {
    expect(adminAssessmentHref("ASSIGNMENT", adminAssessmentQuerySchema.parse({ q: "A", status: "PUBLISHED", page: 2 })))
      .toBe("/admin/assignments?q=A&status=PUBLISHED&page=2");
    expect(adminAssessmentQuerySchema.safeParse({ page: "-1" }).success).toBe(false);
    expect(adminAssessmentQuerySchema.safeParse({ unexpected: "true" }).success).toBe(false);
  });
  it("summarizes only the authorized page's submitted records", () => {
    expect(adminAssessmentStats([{ status: "PUBLISHED", activityCount: 4 },
      { status: "DRAFT", activityCount: 0 }]))
      .toEqual({ displayed: 2, published: 1, activity: 4 });
  });
});
