import { describe, expect, it } from "vitest";
import {
  safePublicCourseThumbnailUrl,
  safeVerifiedCourseImagePath,
} from "@/modules/courses/course-thumbnail-url-policy";
import { courseThumbnailUrlSchema } from "@/modules/courses/validation";
import { updateCourseDisplayContentSchema } from "@/modules/courses/course-display-validation";
import { learnerCourseCardMedia } from "@/modules/courses/learner-course-card-media-model";

const privateImage = "/api/courses/550e8400-e29b-41d4-a716-446655440000/image";
const publicImage = "https://cdn.example.edu/covers/course.png";

function displayInput(thumbnailUrl: string) {
  return {
    introductionText: null,
    bodyHtml: null,
    takeaways: [],
    thumbnailUrl,
    expectedVersion: null,
  };
}

describe("course thumbnail URL trust boundary", () => {
  it("accepts public HTTPS media consistently for authors and learners", () => {
    expect(safePublicCourseThumbnailUrl(publicImage)).toBe(publicImage);
    expect(safePublicCourseThumbnailUrl("https://cdn.example.edu:443/image.png"))
      .toBe("https://cdn.example.edu/image.png");
    expect(courseThumbnailUrlSchema.parse(publicImage)).toBe(publicImage);
    expect(updateCourseDisplayContentSchema.safeParse(displayInput(publicImage)).success).toBe(true);
    expect(learnerCourseCardMedia(publicImage)).toEqual({ src: publicImage, source: "AUTHORED" });
  });

  it("preserves a verified same-origin course image without allowing arbitrary relative paths", () => {
    expect(safeVerifiedCourseImagePath(privateImage)).toBe(privateImage);
    expect(updateCourseDisplayContentSchema.safeParse(displayInput(privateImage)).success).toBe(true);
    expect(learnerCourseCardMedia(privateImage)).toEqual({ src: privateImage, source: "AUTHORED" });
    expect(courseThumbnailUrlSchema.safeParse(privateImage).success).toBe(false);
    for (const candidate of [
      "/api/courses/not-a-uuid/image",
      "/api/courses/550e8400-e29b-41d4-a716-446655440000/image?download=1",
      "/api/courses/550e8400-e29b-41d4-a716-446655440000/image/../../secret",
      "/api/people/export",
      "//evil.example.edu/image",
    ]) {
      expect(safeVerifiedCourseImagePath(candidate)).toBeNull();
      expect(learnerCourseCardMedia(candidate).source).toBe("FALLBACK");
    }
  });

  it.each([
    "http://cdn.example.edu/cover.png",
    "javascript:alert(1)",
    "data:image/svg+xml,<svg></svg>",
    "https://user:pass@cdn.example.edu/cover.png",
    "https://cdn.example.edu/cover.png#private",
    "https://cdn.example.edu:8443/cover.png",
    "https://localhost/private",
    "https://app.localhost/private",
    "https://server.internal/private",
    "https://router.local/private",
    "https://router.lan/private",
    "https://router.home/private",
    "https://private.test/private",
    "https://127.0.0.1/private",
    "https://10.20.30.40/private",
    "https://192.168.1.4/private",
    "https://169.254.169.254/latest/meta-data",
    "https://172.16.0.1/private",
    "https://100.64.0.1/private",
    "https://0x7f000001/private",
    "https://2130706433/private",
    "https://[::1]/private",
    "https://[fd00::1]/private",
    "https://[::ffff:127.0.0.1]/private",
    "https://singlelabel/cover.png",
    "https://cdn.example.edu./cover.png",
    "https://-bad.example.edu/cover.png",
    "https://bad-.example.edu/cover.png",
  ])("rejects unsafe authored image destination across writer and reader: %s", value => {
    expect(safePublicCourseThumbnailUrl(value)).toBeNull();
    expect(courseThumbnailUrlSchema.safeParse(value).success).toBe(false);
    expect(updateCourseDisplayContentSchema.safeParse(displayInput(value)).success).toBe(false);
    expect(learnerCourseCardMedia(value).source).toBe("FALLBACK");
  });

  it.each([
    "https://cdn.example.edu/cover.png?X-Amz-Signature=unsafe",
    "https://cdn.example.edu/cover.png?X-Amz-Credential=unsafe",
    "https://cdn.example.edu/cover.png?X-Goog-Signature=unsafe",
    "https://cdn.example.edu/cover.png?AWSAccessKeyId=unsafe",
    "https://cdn.example.edu/cover.png?Signature=unsafe",
    "https://cdn.example.edu/cover.png?access_token=unsafe",
    "https://cdn.example.edu/cover.png?api_key=unsafe",
    "https://cdn.example.edu/cover.png?token=unsafe",
    "https://cdn.example.edu/cover.png?Expires=120",
    "https://cdn.example.edu/cover.png?%58-Amz-Signature=unsafe",
  ])("never persist presigned image download credentials: %s", value => {
    expect(safePublicCourseThumbnailUrl(value)).toBeNull();
    expect(courseThumbnailUrlSchema.safeParse(value).success).toBe(false);
    expect(updateCourseDisplayContentSchema.safeParse(displayInput(value)).success).toBe(false);
    expect(learnerCourseCardMedia(value).source).toBe("FALLBACK");
  });

  it("keeps harmless cache-busting query parameters", () => {
    const image = "https://cdn.example.edu/cover.png?v=2&width=800";
    expect(safePublicCourseThumbnailUrl(image)).toBe(image);
    expect(courseThumbnailUrlSchema.safeParse(image).success).toBe(true);
    expect(learnerCourseCardMedia(image).source).toBe("AUTHORED");
  });

  it("rejects unknown course display mutation keys rather than silently ignoring them", () => {
    expect(updateCourseDisplayContentSchema.safeParse({
      ...displayInput(publicImage),
      visibility: "PUBLIC",
      collegeId: "foreign",
    }).success).toBe(false);
  });

  it("does not permit oversized URLs or embedded control characters", () => {
    for (const value of [
      "https://cdn.example.edu/" + "x".repeat(2048),
      "https://cdn.example.edu/cover.png\nanything",
    ]) {
      expect(safePublicCourseThumbnailUrl(value)).toBeNull();
      expect(updateCourseDisplayContentSchema.safeParse(displayInput(value)).success).toBe(false);
      expect(learnerCourseCardMedia(value).source).toBe("FALLBACK");
    }
  });

  it("preserves the legacy optional blank cover field", () => {
    expect(courseThumbnailUrlSchema.safeParse("").success).toBe(true);
    expect(courseThumbnailUrlSchema.safeParse(null).success).toBe(true);
    expect(learnerCourseCardMedia("").source).toBe("FALLBACK");
  });
});
