import { describe, expect, it } from "vitest";
import { adminProgressStats, adminLearningHref } from "@/modules/courses/admin-learning-read-model";
describe("Super Admin course progress summary", () => {
  it("counts recorded rows without summing distinct learners across offerings", () => {
    expect(adminProgressStats([
      { recordedRows: 4, completedRows: 2, learnersWithRecords: 2 },
      { recordedRows: 8, completedRows: 5, learnersWithRecords: 2 },
    ])).toEqual({ offerings: 2, contentRecords: 12, completedContentRecords: 7,
      perOfferingLearnerCounts: [2, 2] });
  });
  it("keeps internal page navigation in the Super Admin route", () => {
    expect(adminLearningHref("PROGRESS", { q: "a", status: "ARCHIVED", page: 2 }))
      .toBe("/admin/course-progress?q=a&status=ARCHIVED&page=2");
  });
});
