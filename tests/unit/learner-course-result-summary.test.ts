import { describe, it, expect } from "vitest";
import { learnerCourseResultSummary } from "@/modules/courses/learner-course-result-summary-model";
describe("learner Course list paginated count", () => {
  it("announces the 48-card window and later expansion", () => {
    expect(learnerCourseResultSummary(48, 54)).toBe("Showing 48 of 54 matching courses");
    expect(learnerCourseResultSummary(54, 54)).toBe("Showing 54 of 54 matching courses");
  });
  it("handles zero, singular and capped counts", () => {
    expect(learnerCourseResultSummary(0, 0)).toBe("Showing 0 of 0 matching courses");
    expect(learnerCourseResultSummary(1, 1)).toBe("Showing 1 of 1 matching course");
    expect(learnerCourseResultSummary(120, 54)).toBe("Showing 54 of 54 matching courses");
  });
});
