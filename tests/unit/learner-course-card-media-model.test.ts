import { describe, expect, it } from "vitest";
import { learnerCourseCardMedia, learnerCourseFallbackMedia, learnerCourseCardMediaAfterError } from "@/modules/courses/learner-course-card-media-model";

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
    "https://user:password@example.edu/a.png", "not a url",
    "https://localhost/admin", "https://app.localhost/secure",
    "https://127.0.0.1/admin", "https://10.0.0.5/config",
    "https://192.168.1.1/login", "https://172.16.1.1/config",
    "https://169.254.169.254/latest/meta-data", "https://[::1]/secure",
    "https://cdn.example.edu/photo.jpg#token"])(
    "does not render an unsafe thumbnail URL: %s", (value) => {
      expect(learnerCourseCardMedia(value).source).toBe("FALLBACK");
    },
  );
});

describe("learner Course authored image transport failure",()=>{
 it("falls back to the bundled illustration on image load errors",()=>{
  const image="https://cdn.example.edu/old-or-deleted.jpg";
  expect(learnerCourseCardMediaAfterError(image,false).source).toBe("AUTHORED");
  expect(learnerCourseCardMediaAfterError(image,true).source).toBe("FALLBACK");
 });
});
