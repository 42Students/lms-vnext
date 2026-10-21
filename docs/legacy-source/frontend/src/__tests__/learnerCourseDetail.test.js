import { loadLearnerCourse, learnerCourseCanonicalHref } from "@/utils/learnerCourseDetail";

describe("Learner course detail context", () => {
  test("slug course passes cancellation signal and validates resolved course", async () => {
    const signal = new AbortController().signal;
    const getCourseBySlug = jest.fn().mockResolvedValue({ data: { data: { id: 5, slug: "statics" } } });
    const result = await loadLearnerCourse("statics", {
      getCourseBySlug, getCourse: jest.fn(), signal,
    });
    expect(result.course.id).toBe(5);
    expect(result.numeric).toBe(false);
    expect(getCourseBySlug).toHaveBeenCalledWith("statics", { signal });
  });

  test("numeric courses use authorized course lookup rather than assignment mapping", async () => {
    const getCourse = jest.fn().mockResolvedValue({ data: { data: { id: 42 } } });
    const result = await loadLearnerCourse("42", {
      getCourseBySlug: jest.fn(), getCourse, signal: null,
    });
    expect(result.course.id).toBe(42);
    expect(getCourse).toHaveBeenCalledWith({ courseId: 42 }, { signal: null });
  });

  test("missing data, invalid numeric IDs and canceled responses never create selected course", async () => {
    await expect(loadLearnerCourse("0", { getCourse: jest.fn() }))
      .rejects.toThrow("Invalid course identifier");
    await expect(loadLearnerCourse("bad-slug", {
      getCourseBySlug: jest.fn().mockResolvedValue({ data: { data: null } }),
    })).rejects.toThrow("Course not found");
    const controller = new AbortController();
    controller.abort();
    await expect(loadLearnerCourse("valid", { signal: controller.signal,
      getCourseBySlug: jest.fn().mockResolvedValue({ data: { data: { id: 1 } } }),
    })).rejects.toThrow("Course request canceled");
  });

  test("numeric-to-slug redirects preserve the selected tab and query", () => {
    expect(learnerCourseCanonicalHref("/learn/courses/42/home?cls=9&mode=day", "42", "course-42"))
      .toBe("/learn/courses/course-42/home?cls=9&mode=day");
    expect(learnerCourseCanonicalHref("/learn/courses/42/home", "missing", "slug"))
      .toBeNull();
  });
});
