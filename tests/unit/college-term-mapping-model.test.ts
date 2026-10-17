import { describe, expect, it } from "vitest";
import {
  collegeTermCourseAddSchema, collegeTermCourseUnmapSchema,
  nextTermCourseOrder, reorderTermCourseIds, collegeTermCourseUpdateSchema, collegeTermMappingErrorMessage,
} from "@/modules/academics/college-term-mapping-model";

const termId = "90000000-0000-4000-8000-000000000001";
const courseId = "90000000-0000-4000-8000-000000000002";

describe("Semester-course mapping boundaries", () => {
  it("COL-academic-setup-06 accepts strict curriculum mapping input", () => {
    expect(collegeTermCourseAddSchema.parse({
      programTermId: termId, courseId, type: "ELECTIVE", credits: 3,
    })).toEqual({
      programTermId: termId, courseId, type: "ELECTIVE", credits: 3,
    });
    for (const invalid of [
      { programTermId: termId, courseId, type: "CORE", credits: 31 },
      { programTermId: termId, courseId, type: "PRIMARY", credits: 3 },
      { programTermId: termId, courseId, type: "CORE", credits: 3, collegeId: courseId },
      { programTermId: "invalid", courseId, type: "CORE", credits: null },
    ]) expect(collegeTermCourseAddSchema.safeParse(invalid).success).toBe(false);
  });
  it("updates mapping credits/order and rejects invalid positions or values", () => {
    expect(collegeTermCourseUpdateSchema.safeParse({ credits: 3, position: 2 }).success).toBe(true);
    expect(collegeTermCourseUpdateSchema.safeParse({ credits: 10, position: 1 }).success).toBe(true);
    for (const body of [
      { credits: 11, position: 1 }, { credits: 0, position: 1 }, { credits: null, position: 1 }, { credits: 3, position: 0 },
      { credits: 3, position: 2, collegeId: courseId },
    ]) expect(collegeTermCourseUpdateSchema.safeParse(body).success).toBe(false);
    expect(reorderTermCourseIds(["a", "b", "c"], "c", 1)).toEqual(["c", "a", "b"]);
    expect(reorderTermCourseIds(["a", "b", "c"], "a", 3)).toEqual(["b", "c", "a"]);
    expect(() => reorderTermCourseIds(["a", "b"], "foreign", 1)).toThrow();
    expect(() => reorderTermCourseIds(["a", "b"], "a", 3)).toThrow();
  });
  it("requires explicit unmap confirmation and computes sequential order", () => {
    expect(collegeTermCourseUnmapSchema.safeParse({ confirm: true }).success).toBe(true);
    expect(collegeTermCourseUnmapSchema.safeParse({ confirm: false }).success).toBe(false);
    expect(nextTermCourseOrder([])).toBe(1);
    expect(nextTermCourseOrder([1, 5, 4])).toBe(6);
    expect(collegeTermMappingErrorMessage("TERM_COURSE_IN_USE")).toContain("active");
  });
});
