import { describe, expect, it } from "vitest";
import {
  collegeTermCourseAddSchema, collegeTermCourseUnmapSchema,
  nextTermCourseOrder, collegeTermMappingErrorMessage,
} from "@/modules/academics/college-term-mapping-model";

const termId = "90000000-0000-4000-8000-000000000001";
const courseId = "90000000-0000-4000-8000-000000000002";

describe("Semester-course mapping boundaries", () => {
  it("accepts strict curriculum mapping input", () => {
    expect(collegeTermCourseAddSchema.parse({
      programTermId: termId, courseId, type: "ELECTIVE", credits: 0,
    })).toEqual({
      programTermId: termId, courseId, type: "ELECTIVE", credits: 0,
    });
    for (const invalid of [
      { programTermId: termId, courseId, type: "CORE", credits: 31 },
      { programTermId: termId, courseId, type: "PRIMARY", credits: 3 },
      { programTermId: termId, courseId, type: "CORE", credits: 3, collegeId: courseId },
      { programTermId: "invalid", courseId, type: "CORE", credits: null },
    ]) expect(collegeTermCourseAddSchema.safeParse(invalid).success).toBe(false);
  });
  it("requires explicit unmap confirmation and computes sequential order", () => {
    expect(collegeTermCourseUnmapSchema.safeParse({ confirm: true }).success).toBe(true);
    expect(collegeTermCourseUnmapSchema.safeParse({ confirm: false }).success).toBe(false);
    expect(nextTermCourseOrder([])).toBe(1);
    expect(nextTermCourseOrder([1, 5, 4])).toBe(6);
    expect(collegeTermMappingErrorMessage("TERM_COURSE_IN_USE")).toContain("active");
  });
});
