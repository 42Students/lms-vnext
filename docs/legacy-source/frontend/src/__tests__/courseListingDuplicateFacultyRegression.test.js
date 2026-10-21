import { courseHref, normalizedFacultyCourses, normalizedLearnerCourses } from "@/utils/courseListingUtils";

describe("Faculty and Learner course-list identity integrity", () => {
  it("keeps distinct teaching assignments but makes a duplicate mapping record unavailable", () => {
    const assignments = normalizedFacultyCourses([
      { id: 21, faculty_id: 7, course_id: 5, course_slug: "design", class_id: 3, course_name: "Design", role: "PRIMARY" },
      { id: 22, faculty_id: 7, course_id: 5, course_slug: "design", class_id: 3, course_name: "Design", role: "CO_TEACHER" },
      { id: 21, faculty_id: 7, course_id: 5, course_slug: "design", class_id: 3, course_name: "Design", role: "PRIMARY" },
    ]);
    expect(assignments).toHaveLength(3);
    expect(assignments.filter((row) => !row.invalidRecord)).toHaveLength(2);
    expect(assignments[2].invalidRecord).toBe(true);
    expect(courseHref("/teacher", assignments[2], true)).toBeNull();
  });
  it("never links assignments with invalid identity, missing course, or orphaned class", () => {
    const rows = normalizedFacultyCourses([
      { id: null, course_id: 5, course_name: "Design", course_slug: "design", class_id: 3 },
      { id: 10, course_id: 5, course_slug: "design", course_name: null, class_id: 3 },
      { id: 11, course_id: 5, course_slug: "design", course_name: "Design", class_id: null },
      { id: 12, course_id: 5, course_slug: "design", course_name: "Design", class_id: 0 },
    ]);
    expect(rows.every((row) => row.invalidRecord)).toBe(true);
    expect(rows.every((row) => courseHref("/teacher", row, true) === null)).toBe(true);
  });
  it("surfaces missing Learner course IDs and labels missing titles instead of silently hiding records", () => {
    const rows = normalizedLearnerCourses({ class_id: 3, courses: [
      { id: null, slug: null, credits: 5, course_name: "Ghost" },
      { id: 6, slug: "design", course_name: null, credits: 3 },
    ] }, null);
    expect(rows).toHaveLength(2);
    expect(rows[0].invalidRecord).toBe(true);
    expect(rows[0].credits).toBeNull();
    expect(courseHref("/learn", rows[0], false)).toBeNull();
    expect(rows[1].metadataIncomplete).toBe(true);
    expect(rows[1].name).toBe("Course name unavailable");
    expect(courseHref("/learn", rows[1], false)).toBe("/learn/courses/design/home");
  });
});
