import { describe, expect, it } from "vitest";
import {
  createDepartmentInputSchema,
  renameDepartmentInputSchema,
} from "@/modules/departments/validation";
import {
  assertDepartmentCanArchive,
  DepartmentHasDependenciesError,
} from "@/modules/departments/archive-policy";

describe("departments domain", () => {
  it("normalizes department names at the boundary", () => {
    expect(
      createDepartmentInputSchema.parse({
        collegeId: "7f8e7b00-8503-4a2d-a222-fdfe8eb55ac0",
        name: "  Computer Science  ",
      }),
    ).toEqual({
      collegeId: "7f8e7b00-8503-4a2d-a222-fdfe8eb55ac0",
      name: "Computer Science",
    });

    expect(
      renameDepartmentInputSchema.parse({
        name: "  Electronics  ",
      }),
    ).toEqual({ name: "Electronics" });
  });

  it("rejects blank names and invalid college ids", () => {
    expect(() =>
      createDepartmentInputSchema.parse({
        collegeId: "legacy-12",
        name: " ",
      }),
    ).toThrow();
  });

  it("preserves the legacy dependency guard before archive", () => {
    expect(() =>
      assertDepartmentCanArchive({
        programs: 1,
        faculty: 0,
        courses: 0,
      }),
    ).toThrow(DepartmentHasDependenciesError);

    expect(() =>
      assertDepartmentCanArchive({
        programs: 0,
        faculty: 0,
        courses: 0,
      }),
    ).not.toThrow();
  });
});
