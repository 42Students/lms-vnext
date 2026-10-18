import { describe, expect, it } from "vitest";
import {
  classCapacityLabel,
  collegeClassQuerySchema,
  collegeElectiveQuerySchema,
  collegeStructureHref,
  collegeStructureTotalPages,
  collegeStructureQuerySchema,
  electiveSelectionLabel,
  readCollegeStructureParams,
} from "@/modules/academics/college-structure-directory-model";

describe("College Admin academic structure query integrity", () => {
  it("COL-STRUCTURE-DECIMAL-01 accepts decimal URL pagination but not exponents, hex, signs, whitespace or floats", () => {
    expect(collegeStructureQuerySchema.parse({ page: "2", pageSize: "50" })).toEqual({
      q: "", status: "ACTIVE", page: 2, pageSize: 50,
    });
    expect(collegeStructureQuerySchema.parse({ page: 2, pageSize: 50 }).pageSize).toBe(50);
    for (const invalid of ["2e1", "0xA", " 10", "+10", "10.0", "10 ", "-1", "0", "1001"]) {
      expect(collegeStructureQuerySchema.safeParse({ page: invalid }).success).toBe(false);
    }
    for (const invalid of ["0x32", "5e1", " 50", "+50", "50.0", "50 ", "0", "11"]) {
      expect(collegeStructureQuerySchema.safeParse({ pageSize: invalid }).success).toBe(false);
    }
    expect(readCollegeStructureParams({ page: ["1", "2"] })).toBeNull();
    expect(readCollegeStructureParams({ page: "2", pageSize: "25" })).toEqual({
      page: "2", pageSize: "25",
    });
  });

  it("COL-STRUCTURE-DECIMAL-02 enforces numeric class capacities and interdependent filters", () => {
    const ok = collegeClassQuerySchema.parse({
      minimumCapacity: "1", maximumCapacity: "40", capacityState: "CONFIGURED",
    });
    expect(ok.minimumCapacity).toBe(1);
    expect(ok.maximumCapacity).toBe(40);
    for (const invalid of ["0x28", "4e1", " 40", "+40", "40.0", "-1"]) {
      expect(collegeClassQuerySchema.safeParse({ maximumCapacity: invalid }).success).toBe(false);
    }
    expect(collegeClassQuerySchema.safeParse({
      minimumCapacity: "50", maximumCapacity: "20",
    }).success).toBe(false);
    expect(collegeClassQuerySchema.safeParse({
      capacityState: "UNSET", minimumCapacity: "5",
    }).success).toBe(false);
    expect(collegeClassQuerySchema.safeParse({
      periodStartsOnOrAfter: "2099-04-02", periodEndsOnOrBefore: "2099-04-01",
    }).success).toBe(false);
  });

  it("COL-STRUCTURE-DECIMAL-03 validates elective semester, credits and choice bounds", () => {
    expect(collegeElectiveQuerySchema.parse({ semesterFrom: "1", semesterThrough: "6" }).semesterFrom).toBe(1);
    for (const invalid of ["0x2", "2e0", " 2", "+2", "2.0"]) {
      expect(collegeElectiveQuerySchema.safeParse({ semesterNumber: invalid }).success).toBe(false);
      expect(collegeElectiveQuerySchema.safeParse({ maximumAllowedPicks: invalid }).success).toBe(false);
      expect(collegeElectiveQuerySchema.safeParse({ maximumCredits: invalid }).success).toBe(false);
    }
    expect(collegeElectiveQuerySchema.safeParse({ semesterFrom: "4", semesterThrough: "2" }).success).toBe(false);
    expect(collegeElectiveQuerySchema.safeParse({ minimumCredits: "20", maximumCredits: "10" }).success).toBe(false);
    expect(collegeElectiveQuerySchema.safeParse({
      minimumRequiredPicks: "4", maximumAllowedPicks: "2",
    }).success).toBe(false);
    expect(collegeElectiveQuerySchema.safeParse({
      periodState: "UNLINKED", periodLifecycle: "CLOSED",
    }).success).toBe(false);
  });

  it("COL-STRUCTURE-PAGE-01 preserves filter and page semantics on class and elective deep links", () => {
    const classes = collegeClassQuerySchema.parse({
      q: "2029 Cohort", page: "3", pageSize: "50",
      minimumCapacity: "20", classCode: "CSE-A",
    });
    const href = collegeStructureHref("CLASSES", classes);
    expect(href).toContain("/college/classes?");
    expect(new URL(href, "https://lms.example").searchParams.get("minimumCapacity")).toBe("20");
    expect(new URL(href, "https://lms.example").searchParams.get("page")).toBe("3");
    expect(new URL(href, "https://lms.example").searchParams.get("classCode")).toBe("CSE-A");
    const elective = collegeElectiveQuerySchema.parse({
      slotName: "Open elective", maximumAllowedPicks: "2", minimumRequiredPicks: "1",
    });
    const electiveUrl = collegeStructureHref("ELECTIVES", elective);
    expect(electiveUrl).toContain("/college/electives?");
    expect(new URL(electiveUrl, "https://lms.example").searchParams.get("maximumAllowedPicks")).toBe("2");
    expect(collegeStructureTotalPages(51, 25)).toBe(3);
    expect(collegeStructureTotalPages(0, 25)).toBe(1);
    expect(classCapacityLabel(null)).toBe("Not configured");
    expect(classCapacityLabel(30)).toBe("30");
    expect(electiveSelectionLabel(2, 2)).toBe("Select 2");
    expect(electiveSelectionLabel(1, 3)).toBe("Select 1–3");
  });
});
