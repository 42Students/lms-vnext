import {
  resolveNumericFacultyCourse, resolveFacultyCourseClass,
  canonicalCourseHref, canonicalClassHref,
} from "@/utils/facultyCourseDetail";

describe("Faculty course-detail navigation and authorization context", () => {
  const numeric = { identifier: "42", facultyId: 7 };
  test("a null mapping result falls back to a real course instead of rendering undefined", async () => {
    const getCourse = jest.fn().mockResolvedValue({ data: { data: { id: 42, slug: null } } });
    const result = await resolveNumericFacultyCourse({
      ...numeric, getMapping: jest.fn().mockResolvedValue(null), getCourse,
    });
    expect(result).toEqual({ source: "course", course: { id: 42, slug: null }, classId: null });
    expect(getCourse).toHaveBeenCalledWith({ courseId: 42 });
  });
  test("typed course links do not resolve a colliding mapping ID", async () => {
    const getMapping = jest.fn().mockResolvedValue({ facultyId: 7, classId: 2, course: { id: 999 } });
    const result = await resolveNumericFacultyCourse({ ...numeric,
      preferCourseId: true, getMapping,
      getCourse: jest.fn().mockResolvedValue({ data: { data: { id: 42 } } }),
    });
    expect(result.course.id).toBe(42);
    expect(getMapping).not.toHaveBeenCalled();
  });
  test("legacy mapping IDs still resolve an assignment belonging to the current faculty", async () => {
    const result = await resolveNumericFacultyCourse({ ...numeric,
      getMapping: jest.fn().mockResolvedValue({ facultyId: 7, classId: 18, course: { id: 90 } }),
      getCourse: jest.fn(),
    });
    expect(result).toEqual({ source: "mapping", course: { id: 90 }, classId: 18 });
  });
  test("another faculty's mapping cannot select their class", async () => {
    const result = await resolveNumericFacultyCourse({ ...numeric,
      getMapping: jest.fn().mockResolvedValue({ facultyId: 8, classId: 18, course: { id: 90 } }),
      getCourse: jest.fn().mockResolvedValue({ data: { data: { id: 42 } } }),
    });
    expect(result.source).toBe("course");
    expect(result.classId).toBeNull();
  });
  test("invalid and absent numeric course identifiers fail rather than creating blank context", async () => {
    await expect(resolveNumericFacultyCourse({ ...numeric, identifier: "0",
      getMapping: jest.fn(), getCourse: jest.fn() })).rejects.toThrow("Invalid course identifier");
    await expect(resolveNumericFacultyCourse({ ...numeric,
      getMapping: jest.fn().mockResolvedValue(null),
      getCourse: jest.fn().mockResolvedValue({ data: { data: null } }),
    })).rejects.toThrow("Course not found");
  });
  test("class resolution respects this faculty's actual assignments, not a foreign URL class", () => {
    const result = resolveFacultyCourseClass({
      assignments: [
        { faculty_id: 7, course_id: 42, class_id: 2, class_name: "A" },
        { faculty_id: 7, course_id: 42, class_id: 3, class_name: "B" },
        { faculty_id: 8, course_id: 42, class_id: 9, class_name: "Foreign" },
        { faculty_id: 7, course_id: 99, class_id: 10, class_name: "Wrong course" },
      ],
      course: { id: 42 }, facultyId: 7,
      requestedClassId: "9", preferredClassId: 3, existingClassId: 2,
    });
    expect(result.options.map((option) => option.classId)).toEqual([2, 3]);
    expect(result.selected.classId).toBe(3);
  });
  test("deactivated mapping cannot leave the Faculty detail workspace open", () => {
    expect(() => resolveFacultyCourseClass({
      assignments: [{ faculty_id: 7, course_id: 42, class_id: 18, is_active: false }],
      course: { id: 42 }, facultyId: 7,
      requestedClassId: 18, preferredClassId: 18, existingClassId: 18,
    })).toThrow("No active teaching assignment");
  });
  test("another Faculty or course without an assignment cannot fall back to an old class", () => {
    expect(() => resolveFacultyCourseClass({
      assignments: [{ faculty_id: 8, course_id: 42, class_id: 18 }],
      course: { id: 42 }, facultyId: 7,
      requestedClassId: 18, preferredClassId: 18, existingClassId: 18,
    })).toThrow("No active teaching assignment");
  });
  test("canonical redirects retain class context but remove the numeric type hint", () => {
    expect(canonicalCourseHref("/teacher/courses/42/home?cls=3&ref=course", "42", "real-slug"))
      .toBe("/teacher/courses/real-slug/home?cls=3");
    expect(canonicalClassHref("/teacher/courses/real-slug/home?cls=999&tab=1", 3))
      .toBe("/teacher/courses/real-slug/home?cls=3&tab=1");
    expect(canonicalClassHref("/teacher/courses/real-slug/home?cls=999", null))
      .toBe("/teacher/courses/real-slug/home");
  });
});
