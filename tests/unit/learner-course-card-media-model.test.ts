import { describe, expect, it } from "vitest";
import { learnerCourseCardMedia, learnerCourseFallbackMedia } from "@/modules/courses/learner-course-card-media-model";

describe("learner course thumbnail with verified authored display data", () => {
  it("keeps a bundled local fallback when no image has been authored", () => {
    expect(learnerCourseFallbackMedia()).toEqual({
      src: "/assets/images/common/course.svg", source: "FALLBACK",
    });
    expect(learnerCourseCardMedia(null).source).toBe("FALLBACK");
  });
  it("uses a validated, HTTPS-authored course image", () => {
    expect(learnerCourseCardMedia("https://cdn.example.edu/a.png")).toEqual({
      src: "https://cdn.example.edu/a.png", source: "AUTHORED",
    });
  });
  it.each(["http://example.edu/a.png", "javascript:alert(1)", "/private.png",
    "https://user:password@example.edu/a.png", "not a url"])(
    "does not render an unsafe thumbnail URL: %s", (value) => {
      expect(learnerCourseCardMedia(value).source).toBe("FALLBACK");
    },
  );
});
