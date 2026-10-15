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

// A long pasted query must never turn into an empty search that shows every course.
describe("long search input", () => {
  it("keeps a meaningful prefix instead of falling back to a blank query", () => {
    const row = { course: { courseName: "Physics", courseCode: "PHY", programName: "BSc",
      sectionName: "A", academicPeriodName: "Semester 1" }, instructorNames: ["Rao"] };
    expect(learnerCourseMatchesSearch(row, "x".repeat(101))).toBe(false);
    expect(learnerCourseMatchesSearch(row, "Physics" + " ".repeat(101))).toBe(true);
  });
});
