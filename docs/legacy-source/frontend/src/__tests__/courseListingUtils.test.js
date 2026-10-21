import {
  courseHref, sectionKey, searchCourses, safeCredits, normalizedLearnerCourses,
  normalizedFacultyCourses, academicConfigurationMessage,
} from "@/utils/courseListingUtils";

describe("Faculty and Learner course listing invariants", () => {
  test("slugless legacy learner courses use numeric detail links, never undefined", () => {
    const [course] = normalizedLearnerCourses({ class_id: 8, courses: [
      { id: 42, slug: null, course_name: "Design" },
    ] }, null);
    expect(courseHref("/learn", course, false)).toBe("/learn/courses/42/home");
    expect(courseHref("/learn", { id: null, slug: null }, false)).toBeNull();
  });

  test("Faculty slug links preserve encoded class context", () => {
    const [course] = normalizedFacultyCourses([{
      id: 12, course_id: 5, course_slug: "intro-to-civil", class_id: 77,
      course_name: "Civil", class_name: "A",
    }]);
    expect(courseHref("/teacher", course, true)).toBe("/teacher/courses/intro-to-civil/home?cls=77");
  });

  // #2 on the audit list: the bare /courses/[id] route (src/pages/{learn,teacher}/courses/
  // [courseId]/index.js) exists only as a fallback for a tab-less URL and immediately
  // client-redirects to /home itself -- linking there from the course list meant every single
  // click mounted that route, rendered its skeleton, fired a redirect, then mounted /home and
  // rendered a SECOND skeleton before real content appeared. Course cards must link straight to
  // /home so this is one navigation, not two.
  test("course links point straight at /home, skipping the bare route's own redirect-to-/home hop", () => {
    const [learnerCourse] = normalizedLearnerCourses({ class_id: 8, courses: [
      { id: 42, slug: "design-101", course_name: "Design" },
    ] }, null);
    expect(courseHref("/learn", learnerCourse, false)).toBe("/learn/courses/design-101/home");

    const [teacherCourse] = normalizedFacultyCourses([{
      id: 12, course_id: 5, course_slug: null, class_id: 77,
      course_name: "Civil", class_name: "A",
    }]);
    expect(courseHref("/teacher", teacherCourse, true)).toMatch(/^\/teacher\/courses\/5\/home\?/);
  });

  test("sections use class identifiers rather than potentially repeated names", () => {
    expect(sectionKey({ clsid: 1, sectionName: "A" }))
      .not.toBe(sectionKey({ clsid: 2, sectionName: "A" }));
    expect(sectionKey({ sectionName: "A", batchName: "One" }))
      .not.toBe(sectionKey({ sectionName: "A", batchName: "Two" }));
  });

  test("trimmed search includes course code, section and instructor safely", () => {
    const courses = [{ name: "Structures", courseCode: "CE101", faculty: "Ada" },
      { name: "Math", sectionName: "Section B", faculty: null }];
    expect(searchCourses(courses, "  ce101  ")).toEqual([courses[0]]);
    expect(searchCourses(courses, "section b")).toEqual([courses[1]]);
    expect(searchCourses(courses, "  ")).toEqual(courses);
  });

  test("co-instructors are visible and searchable instead of only the first faculty", () => {
    const [course] = normalizedLearnerCourses({ class_id: 8, courses: [{
      id: 12, course_name: "Bridge Design", faculty: { name: "Lead" },
      instructors: [
        { id: 4, name: "Lead", role: "PRIMARY" },
        { id: 5, name: "Co Teacher", role: "CO_TEACHER" },
      ],
    }] }, null);
    expect(course.faculty).toBe("Lead, Co Teacher");
    expect(searchCourses([course], "co teacher")).toEqual([course]);
  });

  test("malformed and negative credits cannot inflate or reduce total", () => {
    expect(safeCredits(-3)).toBe(0);
    expect(safeCredits("5abc")).toBe(0);
    expect(safeCredits("3")).toBe(3);
    expect(safeCredits(null)).toBe(0);
  });

  test("missing academic relationships each have an actionable status", () => {
    ["NO_CLASS", "CLASS_NOT_FOUND", "NO_BATCH", "BATCH_NOT_FOUND", "NO_PROGRAM",
      "PROGRAM_NOT_FOUND", "NO_SEMESTER"].forEach((status) => {
      expect(academicConfigurationMessage(status)).toMatch(/administrator/i);
    });
    expect(academicConfigurationMessage("READY")).toBeNull();
  });

  test("malformed and duplicate learner rows stay visible but cannot inflate credits or navigate", () => {
    const items = normalizedLearnerCourses({ class_id: 7, courses: [
      { id: 11, course_name: "Design", credits: 3 }, null,
      { id: 11, course_name: "Duplicate", credits: 3 },
    ] }, null);
    expect(items).toHaveLength(3);
    expect(items.filter((item) => item.invalidRecord)).toHaveLength(2);
    expect(items.reduce((total, item) => total + safeCredits(item.credits), 0)).toBe(3);
    expect(courseHref("/learn", items[1], false)).toBeNull();
    expect(courseHref("/learn", items[2], false)).toBeNull();
  });


  test("learner course navigation fails closed for locked or explicitly unpublished courses", () => {
    const [lockedCourse, hiddenCourse] = normalizedLearnerCourses({ class_id: 8, courses: [
      { id: 42, slug: "locked-course", course_name: "Locked", locked: true, lock_reason: "Complete orientation first." },
      { id: 43, slug: "hidden-course", course_name: "Hidden", enabled: false },
    ] }, null);

    expect(courseHref("/learn", lockedCourse, false)).toBeNull();
    expect(lockedCourse.lockReason).toBe("Complete orientation first.");
    expect(courseHref("/learn", hiddenCourse, false)).toBeNull();
  });

  test("incomplete Faculty course metadata is explicit and cannot open a ghost course", () => {
    const [missing] = normalizedFacultyCourses([{
      id: 1, course_id: 4, metadata_incomplete: true, course_name: null,
    }]);
    expect(missing.name).toBe("Course information unavailable");
    expect(courseHref("/teacher", missing, true)).toBeNull();
  });
});
