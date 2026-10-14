import { describe, expect, it } from "vitest";
import { learnerCourseFallbackMedia } from "@/modules/courses/learner-course-card-media-model";

describe("learner course fallback thumbnail", () => {
  it("uses a bundled local decoration without claiming a stored course image", () => {
    expect(learnerCourseFallbackMedia()).toEqual({
      src: "/assets/images/common/course.svg", source: "FALLBACK",
    });
  });
});
