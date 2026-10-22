import { describe, expect, it } from "vitest";
import {
  createCollegeElectiveSlotSchema,
  editCollegeElectiveSlotSchema,
  normalizeSlotYear,
  slotSelectionChanged,
} from "@/modules/electives/college-slot-mutation-model";

const create = {
  programId: "10000000-0000-4000-8000-000000000001",
  academicPeriodId: null,
  semesterNumber: 2,
  academicYear: "2026-27",
  name: "Open Elective",
  description: null,
  credits: 3, minPick: 1, maxPick: 2, confirm: true,
};

describe("college elective slot mutation model", () => {
  it("keeps college scope out of the accepted client payload", () => {
    expect(createCollegeElectiveSlotSchema.parse(create).name).toBe("Open Elective");
    expect(createCollegeElectiveSlotSchema.safeParse({
      ...create, collegeId: "20000000-0000-4000-8000-000000000002",
    }).success).toBe(false);
    expect(createCollegeElectiveSlotSchema.safeParse({
      ...create, minPick: 3, maxPick: 2,
    }).success).toBe(false);
    expect(createCollegeElectiveSlotSchema.safeParse({
      ...create, confirm: false,
    }).success).toBe(false);
    expect(createCollegeElectiveSlotSchema.safeParse({
      ...create, semesterNumber: 13,
    }).success).toBe(false);
  });

  it("requires a version and confirmation for editing", () => {
    const edit = {
      expectedVersion: 0, name: "Updated", description: "Notes",
      credits: 3, minPick: 1, maxPick: 1, confirm: true,
    };
    expect(editCollegeElectiveSlotSchema.safeParse(edit).success).toBe(true);
    expect(editCollegeElectiveSlotSchema.safeParse({ ...edit, expectedVersion: -1 }).success).toBe(false);
    expect(editCollegeElectiveSlotSchema.safeParse({ ...edit, programId: create.programId }).success).toBe(true);
    expect(editCollegeElectiveSlotSchema.safeParse({ ...edit, programId: "foreign-college" }).success).toBe(false);
    expect(editCollegeElectiveSlotSchema.safeParse({ ...edit, collegeId: create.programId }).success).toBe(false);
  });

  it("normalizes years and detects actual enrollment-impacting edits", () => {
    expect(normalizeSlotYear("2026-2027")).toBe("2026-27");
    expect(normalizeSlotYear("2026-27")).toBe("2026-27");
    expect(normalizeSlotYear(null)).toBeNull();
    expect(() => normalizeSlotYear("2026-28")).toThrow();
    const before = { credits: 3, minPick: 1, maxPick: 2 };
    expect(slotSelectionChanged(before, { ...before })).toBe(false);
    expect(slotSelectionChanged(before, { ...before, maxPick: 1 })).toBe(true);
  });
});
