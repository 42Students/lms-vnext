import { describe, expect, it } from "vitest";
import {
  sanitizeCourseDisplayHtml,
  updateCourseDisplayContentSchema,
} from "@/modules/courses/course-display-validation";

describe("W02 DB05 Course display content", () => {
  it("preserves only attribute-free formatting tags and escapes executable markup", () => {
    expect(
      sanitizeCourseDisplayHtml(
        '<p onclick="alert(1)">Hello <strong>world</strong></p><script>alert(2)</script><a href="javascript:alert(3)">click</a>',
      ),
    ).toBe(
      "<p>Hello <strong>world</strong></p>&lt;script&gt;alert(2)&lt;/script&gt;&lt;a href="javascript:alert(3)"&gt;click&lt;/a&gt;",
    );
  });

  it("escapes malformed/unclosed tag text instead of handing it to the browser parser", () => {
    expect(
      sanitizeCourseDisplayHtml(
        "Safe <img src=x onerror=alert(1)> text <",
      ),
    ).toBe(
      "Safe &lt;img src=x onerror=alert(1)&gt; text &lt;",
    );
  });

  it("deduplicates ordered takeaways case-insensitively without reordering", () => {
    const parsed =
      updateCourseDisplayContentSchema.parse({
        introductionText: null,
        bodyHtml: null,
        takeaways: [
          "Atomic transactions",
          "Tenant isolation",
          "atomic transactions",
        ],
        thumbnailUrl: null,
        expectedVersion: null,
      });
    expect(parsed.takeaways).toEqual([
      "Atomic transactions",
      "Tenant isolation",
    ]);
  });

  it("requires https for thumbnails and caps the authoring contract", () => {
    expect(
      updateCourseDisplayContentSchema.safeParse({
        introductionText: null,
        bodyHtml: null,
        takeaways: [],
        thumbnailUrl:
          "javascript:alert(1)",
        expectedVersion: null,
      }).success,
    ).toBe(false);
    expect(
      updateCourseDisplayContentSchema.safeParse({
        introductionText: "x".repeat(501),
        bodyHtml: null,
        takeaways: [],
        thumbnailUrl: null,
        expectedVersion: null,
      }).success,
    ).toBe(false);
  });
});
