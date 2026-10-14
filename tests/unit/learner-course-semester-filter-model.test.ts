import { describe, expect, it } from "vitest";
import { learnerCourseSemesterFilterReset } from "@/modules/courses/learner-course-semester-filter-model";

describe("learner semester switch filters", () => {
  it("resets search, course kind and pagination for regular-only semesters", () => {
    expect(learnerCourseSemesterFilterReset()).toEqual({
      search: "", type: "all", visibleLimit: 48,
    });
  });
});
