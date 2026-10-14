import { describe, expect, it } from "vitest";
import {
  createCollegeCohortSchema,
  hasUnsavedCollegeCohortEdit,
  updateCollegeCohortSchema,
  validCohortPeriodRange,
} from "@/modules/academics/college-cohort-mutation-model";

const id = "00000000-0000-4000-8000-000000000001";

describe("College Admin batch mutations", () => {
  const created = {
    programId: id, name: "First Year", code: "FY-2026",
    startPeriodId: id, expectedEndPeriodId: null,
  };
  it("validates exact create fields and trims academic names", () => {
    expect(createCollegeCohortSchema.parse({ ...created, name: " First Year " }).name)
      .toBe("First Year");
    for (const input of [
      { ...created, collegeId: id },
      { ...created, name: "" },
      { ...created, code: "a b" },
      { ...created, programId: "bad" },
      { ...created, expectedEndPeriodId: "bad" },
    ]) {
      expect(createCollegeCohortSchema.safeParse(input).success).toBe(false);
    }
  });
  it("requires explicit confirmation for edits and prevents immutable field changes", () => {
    const edit = { name: "New Name", code: "FY-2027", expectedEndPeriodId: null, confirm: true };
    expect(updateCollegeCohortSchema.safeParse(edit).success).toBe(true);
    expect(updateCollegeCohortSchema.safeParse({ ...edit, confirm: false }).success).toBe(false);
    expect(updateCollegeCohortSchema.safeParse({ ...edit, programId: id }).success).toBe(false);
    expect(updateCollegeCohortSchema.safeParse({ ...edit, startPeriodId: id }).success).toBe(false);
    expect(updateCollegeCohortSchema.safeParse({ ...edit, code: "invalid code" }).success).toBe(false);
  });
  it("enforces period ordering and unsaved edit detection", () => {
    expect(validCohortPeriodRange("2026-08-01", null)).toBe(true);
    expect(validCohortPeriodRange("2026-08-01", "2026-12-31")).toBe(true);
    expect(validCohortPeriodRange("2026-08-01", "2025-12-31")).toBe(false);
    const original = { name: "Batch", code: "B1", expectedEndPeriodId: null };
    expect(hasUnsavedCollegeCohortEdit(original, { ...original })).toBe(false);
    expect(hasUnsavedCollegeCohortEdit(original, { ...original, name: "Renamed" })).toBe(true);
    expect(hasUnsavedCollegeCohortEdit(original, { ...original, expectedEndPeriodId: id })).toBe(true);
  });
});
