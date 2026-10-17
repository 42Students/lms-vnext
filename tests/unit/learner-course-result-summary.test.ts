import { describe, it, expect } from "vitest";
import { learnerCourseResultSummary } from "@/modules/courses/learner-course-result-summary-model";
describe("learner Course list paginated count", () => {
  it("announces the 48-card window and later expansion", () => {
    expect(learnerCourseResultSummary(48, 54)).toBe("Showing 54 of 54 records · 48 currently displayed");
    expect(learnerCourseResultSummary(54, 54)).toBe("Showing 54 of 54 records · 54 currently displayed");
  });
  it("handles zero, singular and capped counts", () => {
    expect(learnerCourseResultSummary(0, 0)).toBe("Showing 0 of 0 records · 0 currently displayed");
    expect(learnerCourseResultSummary(1, 1)).toBe("Showing 1 of 1 records · 1 currently displayed");
    expect(learnerCourseResultSummary(120, 54)).toBe("Showing 54 of 54 records · 54 currently displayed");
    expect(learnerCourseResultSummary(10, 20, 54)).toBe("Showing 20 of 54 records · 10 currently displayed");
  });
});
