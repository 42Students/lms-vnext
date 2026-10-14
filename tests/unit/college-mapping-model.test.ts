import { describe, expect, it } from "vitest";
import {
  collegeMappingHref,
  facultyAssignmentQuerySchema,
  facultyAssignmentState,
  mappingPageCount,
  semesterCourseQuerySchema,
} from "@/modules/academics/college-mapping-model";

describe("College Admin semester offering and faculty assignment models", () => {
  it("strictly validates academic mapping filters without a caller college override", () => {
    expect(semesterCourseQuerySchema.parse({})).toEqual({ q: "", type: "ALL", page: 1 });
    expect(semesterCourseQuerySchema.parse({ q: "  Maths  ", page: "2" }))
      .toEqual({ q: "Maths", type: "ALL", page: 2 });
    for (const invalid of [
      { collegeId: "foreign" },
      { type: "OPTIONAL" },
      { page: -1 },
      { page: "99999" },
      { periodId: "not-a-uuid" },
      { programId: "not-a-uuid" },
      { q: "x".repeat(101) },
    ]) {
      expect(semesterCourseQuerySchema.safeParse(invalid).success).toBe(false);
    }
  });

  it("validates teaching lifecycle filters and rejects unrecognised fields", () => {
    expect(facultyAssignmentQuerySchema.parse({}))
      .toEqual({ q: "", status: "ACTIVE", page: 1 });
    expect(facultyAssignmentQuerySchema.parse({ status: "ENDED", page: "3" }))
      .toEqual({ q: "", status: "ENDED", page: 3 });
    expect(facultyAssignmentQuerySchema.safeParse({ status: "INACTIVE" }).success).toBe(false);
    expect(facultyAssignmentQuerySchema.safeParse({ collegeId: "other" }).success).toBe(false);
  });

  it("derives ended state from either teaching or delivery end", () => {
    const ended = new Date("2026-10-01T00:00:00.000Z");
    expect(facultyAssignmentState(null, null)).toBe("ACTIVE");
    expect(facultyAssignmentState(ended, null)).toBe("ENDED");
    expect(facultyAssignmentState(null, ended)).toBe("ENDED");
    expect(mappingPageCount(0)).toBe(1);
    expect(mappingPageCount(26)).toBe(2);
  });

  it("creates only trusted relative routes and escapes search text", () => {
    const url = new URL(collegeMappingHref("SEMESTER_COURSES", {
      q: "a & b",
      programId: "00000000-0000-4000-8000-000000000001",
      page: 2,
      type: "ELECTIVE",
    }), "https://example.test");
    expect(url.pathname).toBe("/college/semester-courses");
    expect(url.searchParams.get("q")).toBe("a & b");
    expect(url.searchParams.get("type")).toBe("ELECTIVE");
    expect(url.searchParams.has("collegeId")).toBe(false);
    const faculty = collegeMappingHref("FACULTY_ASSIGNMENTS", {
      q: "", status: "ENDED", page: 1,
    });
    expect(faculty).toBe("/college/faculty-assignment?status=ENDED");
  });
});
