import { describe, expect, it } from "vitest";
import {
  COURSE_OVERVIEW_PREVIEW_LENGTH,
  plainCourseDescription,
  summarizeCourseDescription,
} from "@/components/courses/course-description-preview";

describe("learner course overview preview", () => {
  it("matches the legacy 350-character collapse threshold", () => {
    expect(summarizeCourseDescription("A".repeat(COURSE_OVERVIEW_PREVIEW_LENGTH)).long).toBe(false);
    const result = summarizeCourseDescription("A".repeat(COURSE_OVERVIEW_PREVIEW_LENGTH + 1));
    expect(result.long).toBe(true);
    expect(result.preview).toHaveLength(COURSE_OVERVIEW_PREVIEW_LENGTH + 1);
    expect(result.preview.endsWith("…")).toBe(true);
  });

  it("creates a text-only preview of sanitized rich text", () => {
    expect(plainCourseDescription("<p>About <strong>this</strong> course</p>"))
      .toBe("About this course");
  });

  it("does not truncate a short description", () => {
    expect(summarizeCourseDescription("Short overview"))
      .toEqual({ long: false, preview: "Short overview" });
  });
});
