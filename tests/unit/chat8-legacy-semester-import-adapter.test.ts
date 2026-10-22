import { describe, expect, it } from "vitest";
import { adaptLegacyProgramStructureCreate } from "@/modules/academics/semester-mutation-model";

const programId = "11111111-1111-4111-8111-111111111111";
const courseId = "22222222-2222-4222-8222-222222222222";
const secondCourseId = "33333333-3333-4333-8333-333333333333";
const map = (entries: readonly (readonly [number, string])[] = [[10, courseId]]) => ({
  legacyProgramId: 5,
  programId,
  termNumber: 3,
  courseIdsByLegacyId: new Map(entries),
});

describe("lane-8 verify2: legacy semester structure import bridge", () => {
  it("preserves source fields and maps all permitted course IDs without guessing", () => {
    const result = adaptLegacyProgramStructureCreate({
      programId: 5, name: "Semester III", courseIds: [10],
      status: "COMPLETED", startDate: "2022/07", endDate: "2022/12",
    }, map());
    expect(result.semester).toMatchObject({
      programId, name: "Semester III", termNumber: 3, isActive: false,
    });
    expect(result.courseIds).toEqual([courseId]);
    expect(result.source).toEqual({
      legacyProgramId: 5, status: "COMPLETED", startDate: "2022/07", endDate: "2022/12",
    });
  });
  it("never accepts a foreign program, omitted course crosswalk or ambiguous duplication", () => {
    expect(() => adaptLegacyProgramStructureCreate(
      {programId: 6, name: "Semester III"}, map(),
    )).toThrow("LEGACY_PROGRAM_ID_UNMAPPED");
    expect(() => adaptLegacyProgramStructureCreate(
      {programId: 5, name: "Semester III", courseIds: [10, 11]}, map(),
    )).toThrow("LEGACY_COURSE_ID_UNMAPPED");
    expect(() => adaptLegacyProgramStructureCreate(
      {programId: 5, name: "Semester III", courseIds: [10, 10]}, map(),
    )).toThrow("LEGACY_COURSE_ID_DUPLICATE");
    expect(() => adaptLegacyProgramStructureCreate(
      {programId: 5, name: "Semester III", courseIds: [10, 11]},
      map([[10, courseId], [11, courseId]]),
    )).toThrow("LEGACY_COURSE_ID_DUPLICATE");
    expect(() => adaptLegacyProgramStructureCreate(
      {programId: 5, name: "Semester III", courseIds: [10]},
      map([[10, "other-college"]]),
    )).toThrow();
  });
  it("retains optional empty source fields without inventing a status or courses", () => {
    const result = adaptLegacyProgramStructureCreate(
      { programId: 5, name: "Semester IV" }, map(),
    );
    expect(result.semester.isActive).toBeUndefined();
    expect(result.courseIds).toEqual([]);
    expect(result.source.status).toBeNull();
    expect(result.source.startDate).toBeNull();
    expect(result.source.endDate).toBeNull();
    expect(secondCourseId).not.toEqual(courseId);
  });
});
