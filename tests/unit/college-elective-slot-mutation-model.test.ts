import { describe, expect, it } from "vitest";
import {
  createCollegeElectiveSlotSchema,
  editCollegeElectiveSlotSchema,
  electiveSlotDraftFromRow,
  electiveSlotFormErrorsFromIssues,
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

  it("maps real Zod API names onto visible elective slot fields", () => {
    const result = createCollegeElectiveSlotSchema.safeParse({
      ...create, semesterNumber: 13, academicYear: "2026-29",
      minPick: 4, maxPick: 2,
    });
    expect(result.success).toBe(false);
    if (result.success) throw new Error("Expected invalid elective slot");
    const fields = electiveSlotFormErrorsFromIssues(result.error.issues);
    expect(fields["term"]).toBeTruthy();
    expect(fields["year"]).toBeTruthy();
    expect(fields["maxPick"]).toBeTruthy();
    expect(fields["semesterNumber"]).toBeUndefined();
    expect(fields["academicYear"]).toBeUndefined();
  });

  it("preserves known API field errors and displays period/description issues", () => {
    expect(electiveSlotFormErrorsFromIssues([
      { path: ["academicPeriodId"], message: "Period is unavailable" },
      { path: ["description"], message: "Too long" },
      { path: ["programId"], message: "Unknown program" },
      { path: ["name"], message: "Name required" },
      { path: ["academicPeriodId"], message: "Later duplicate" },
    ])).toEqual({
      periodId: "Period is unavailable",
      description: "Too long",
      programId: "Unknown program",
      name: "Name required",
    });
  });

  it("ignores malformed and unrecognized server paths without prototype pollution", () => {
    const errors = electiveSlotFormErrorsFromIssues([
      { path: ["__proto__"], message: "unsafe" },
      { path: ["constructor"], message: "unsafe" },
      { path: [0, "name"], message: "numeric" },
      { path: "semesterNumber", message: "not an array" },
      { path: ["body", "semesterNumber"], message: "unknown wrapper" },
      null,
      { path: ["academicYear"], message: "" },
      { path: ["maxPick"], message: "Bad maximum" },
    ]);
    expect(errors).toEqual({
      year: "Please check this field",
      maxPick: "Bad maximum",
    });
    expect(Object.hasOwn(errors, "__proto__")).toBe(false);
    expect(electiveSlotFormErrorsFromIssues(null)).toEqual({});
    expect(electiveSlotFormErrorsFromIssues({ path: ["name"] })).toEqual({});
  });

  it("rebuilds the freshest form draft after route refresh instead of preserving stale local fields", () => {
    const older = {
      name: "Old slot name", description: "Old notes",
      programId: create.programId, academicPeriodId: null,
      semesterNumber: 2, academicYear: "2026-27",
      credits: 3, minPick: 1, maxPick: 2,
    };
    const current = {
      ...older, name: "Updated on another screen", description: "New notes",
      academicPeriodId: "20000000-0000-4000-8000-000000000002",
      semesterNumber: 3, academicYear: "2027-28", credits: 5, maxPick: 3,
    };
    expect(electiveSlotDraftFromRow(current)).toEqual({
      programId: current.programId, periodId: current.academicPeriodId,
      term: "3", year: "2027-28", name: "Updated on another screen",
      description: "New notes", credits: "5", minPick: "1", maxPick: "3",
    });
    expect(electiveSlotDraftFromRow(current).name)
      .not.toBe(electiveSlotDraftFromRow(older).name);
    expect(electiveSlotDraftFromRow(undefined)).toEqual({
      programId: "", periodId: "", term: "1", year: "", name: "",
      description: "", credits: "3", minPick: "1", maxPick: "1",
    });
  });

  it("caps new slots at ten picks but parses historical edits losslessly", () => {
    expect(createCollegeElectiveSlotSchema.safeParse({
      ...create, minPick: 11, maxPick: 14,
    }).success).toBe(false);
    const historicEdit = {
      expectedVersion: 5, name: "Historical elective", description: "Rename",
      credits: 3, minPick: 11, maxPick: 14, confirm: true,
    };
    expect(editCollegeElectiveSlotSchema.safeParse(historicEdit).success).toBe(true);
    expect(editCollegeElectiveSlotSchema.safeParse({
      ...historicEdit, minPick: -1,
    }).success).toBe(false);
    expect(editCollegeElectiveSlotSchema.safeParse({
      ...historicEdit, maxPick: Number.MAX_SAFE_INTEGER + 1,
    }).success).toBe(false);
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
