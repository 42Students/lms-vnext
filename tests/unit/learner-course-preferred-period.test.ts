import { describe, expect, it } from "vitest";
import { learnerCoursePreferredPeriod } from "@/modules/courses/learner-course-preferred-period-model";

const row = (id: string, start: string, readOnly: boolean) =>
  ({ readOnly, course: { academicPeriodId: id, periodStartDate: start } });

describe("learner Course default semester", () => {
  it("prefers currently enrolled course term despite newer historical rows", () => {
    expect(learnerCoursePreferredPeriod([row("archived", "2026-09-01", true),
      row("active", "2026-08-01", false)])).toBe("active");
  });
  it("chooses the latest accessible historical term when all courses are read only", () => {
    expect(learnerCoursePreferredPeriod([row("old", "2024-01-01", true),
      row("new", "2025-01-01", true)])).toBe("new");
  });
  it("handles first-run no-courses state", () => {
    expect(learnerCoursePreferredPeriod([])).toBe("");
  });
});
