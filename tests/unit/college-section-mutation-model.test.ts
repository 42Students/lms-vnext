import { describe, expect, it } from "vitest";
import {
  createCollegeSectionSchema, updateCollegeSectionSchema,
  sectionIdentityChanged, sectionCapacityAllows, sectionPeriodWithinCohort,
} from "@/modules/academics/college-section-mutation-model";

const id = "10000000-0000-4000-8000-000000000001";
const input = {
  cohortId: id, academicPeriodId: id,
  name: "Class A", code: "CS-A", capacity: 40,
};

describe("College Admin class mutation model", () => {
  it("requires strict validated registered fields and bounded capacity", () => {
    expect(createCollegeSectionSchema.parse({ ...input, name: "  A  " }).name).toBe("A");
    expect(createCollegeSectionSchema.safeParse({ ...input, capacity: null }).success).toBe(false);
    expect(createCollegeSectionSchema.parse({ ...input, capacity: 200 }).capacity).toBe(200);
    for (const invalid of [
      { ...input, collegeId: id },
      { ...input, capacity: 0 },
      { ...input, capacity: -1 },
      { ...input, capacity: 201 },
      { ...input, capacity: 10001 },
      { ...input, capacity: 1.5 },
      { ...input, name: "" },
      { ...input, code: "A B" },
      { ...input, cohortId: "foreign" },
    ]) {
      expect(createCollegeSectionSchema.safeParse(invalid).success).toBe(false);
    }
  });

  it("requires explicit edit confirmation and rejects parent reassignment", () => {
    const edit = { name: "A", code: "A-1", capacity: 20, confirm: true };
    expect(updateCollegeSectionSchema.parse(edit)).toEqual(edit);
    expect(updateCollegeSectionSchema.safeParse({ ...edit, confirm: false }).success).toBe(false);
    expect(updateCollegeSectionSchema.safeParse({ ...edit, cohortId: id }).success).toBe(false);
    expect(updateCollegeSectionSchema.safeParse({ ...edit, capacity: 0 }).success).toBe(false);
  });

  it("enforces period bounds and capacity floor without inferred defaults", () => {
    expect(sectionPeriodWithinCohort("2026-07-01", "2027-06-30",
      "2026-07-01", "2026-12-31")).toBe(true);
    expect(sectionPeriodWithinCohort("2026-07-01", null,
      "2027-01-01", "2027-06-30")).toBe(true);
    expect(sectionPeriodWithinCohort("2026-07-01", "2026-12-31",
      "2027-01-01", "2027-06-30")).toBe(false);
    expect(sectionPeriodWithinCohort("2026-07-01", null,
      "2026-01-01", "2026-06-30")).toBe(false);
    expect(sectionCapacityAllows(null, 5)).toBe(true);
    expect(sectionCapacityAllows(5, 5)).toBe(true);
    expect(sectionCapacityAllows(4, 5)).toBe(false);
    expect(sectionIdentityChanged({ name: "A", code: "A" },
      { name: "A", code: "B" })).toBe(true);
    expect(sectionIdentityChanged({ name: "A", code: "A" },
      { name: "A", code: "A" })).toBe(false);
  });
});
