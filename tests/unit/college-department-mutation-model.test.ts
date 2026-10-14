import { describe, expect, it } from "vitest";
import {
  canArchiveCollegeDepartment,
  collegeDepartmentArchiveSchema,
  collegeDepartmentCreateSchema,
  collegeDepartmentRenameSchema,
} from "@/modules/departments/college-department-mutation-model";
import { restoreCollegeProgramSchema } from "@/modules/academics/college-program-mutation-model";

describe("College department and program lifecycle validation", () => {
  it("enforces strict name, archive and restore confirmations", () => {
    expect(collegeDepartmentCreateSchema.parse({ name: "  CSE  " }).name).toBe("CSE");
    expect(collegeDepartmentRenameSchema.safeParse({ name: "CSE" }).success).toBe(false);
    expect(collegeDepartmentArchiveSchema.safeParse({ confirm: false }).success).toBe(false);
    expect(collegeDepartmentArchiveSchema.safeParse({ confirm: true, collegeId: "other" }).success).toBe(false);
    expect(restoreCollegeProgramSchema.parse({ action: "RESTORE", confirm: true }).confirm).toBe(true);
    expect(restoreCollegeProgramSchema.safeParse({ action: "RESTORE", confirm: false }).success).toBe(false);
  });
  it("blocks every persistent dependency, not only active references", () => {
    expect(canArchiveCollegeDepartment({ programs: 0, faculty: 0, courses: 0 })).toBe(true);
    expect(canArchiveCollegeDepartment({ programs: 1, faculty: 0, courses: 0 })).toBe(false);
    expect(canArchiveCollegeDepartment({ programs: 0, faculty: 1, courses: 0 })).toBe(false);
    expect(canArchiveCollegeDepartment({ programs: 0, faculty: 0, courses: 1 })).toBe(false);
  });
});
