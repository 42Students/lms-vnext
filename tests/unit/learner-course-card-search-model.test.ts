import { describe, expect, it } from "vitest";
import { learnerCourseMatchesSearch } from "@/modules/courses/learner-course-card-search-model";

const row = {
  course: { courseName: "Algorithms", courseCode: "CS101", programName: "Computer Science",
    sectionName: "A", academicPeriodName: "Semester 3" },
  instructorNames: ["Dr. Sita Rao"],
};
describe("learner course list search", () => {
  it("matches the persisted instructor display name without reading contacts", () => {
    expect(learnerCourseMatchesSearch(row, "sita")).toBe(true);
    expect(learnerCourseMatchesSearch(row, "cs101")).toBe(true);
    expect(learnerCourseMatchesSearch(row, "physics")).toBe(false);
  });
  it("treats invalid/oversized input as the unfiltered state", () => {
    expect(learnerCourseMatchesSearch(row, "x".repeat(101))).toBe(true);
  });
});
