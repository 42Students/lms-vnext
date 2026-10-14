import { describe, expect, it } from "vitest";
import {
  academicDirectoryHref,
  academicDirectoryPageCount,
  academicDirectorySearchParams,
  batchProgressLabel,
  collegeBatchDirectorySchema,
  collegeSemesterDirectorySchema,
} from "@/modules/academics/college-academic-directory-model";

describe("College Admin semester and batch read models", () => {
  it("accepts only bounded, college-independent semester queries", () => {
    expect(collegeSemesterDirectorySchema.parse({})).toEqual({
      q: "", status: "ALL", page: 1,
    });
    expect(collegeSemesterDirectorySchema.parse({
      q: "  Data Science  ", status: "INACTIVE", page: "2",
    })).toEqual({ q: "Data Science", status: "INACTIVE", page: 2 });
    for (const invalid of [
      { collegeId: "not-allowed" },
      { status: "CLOSED" },
      { page: 0 },
      { page: 1001 },
      { q: "x".repeat(101) },
      { programId: "invalid-id" },
      { termNumber: 0 },
      { termNumber: 25 },
      { minimumCredits: -1 },
      { minimumCredits: 501 },
    ]) {
      expect(collegeSemesterDirectorySchema.safeParse(invalid).success).toBe(false);
    }
  });

  it("accepts only defined cohort lifecycles", () => {
    expect(collegeBatchDirectorySchema.parse({})).toEqual({
      q: "", status: "ALL", page: 1,
    });
    expect(collegeBatchDirectorySchema.parse({
      status: "COMPLETED", page: "3",
    })).toEqual({ q: "", status: "COMPLETED", page: 3 });
    expect(collegeBatchDirectorySchema.safeParse({ status: "INACTIVE" }).success).toBe(false);
    expect(collegeBatchDirectorySchema.safeParse({ collegeId: "foreign" }).success).toBe(false);
    expect(collegeBatchDirectorySchema.safeParse({ yearStart: 1899 }).success).toBe(false);
    expect(collegeBatchDirectorySchema.safeParse({ yearStart: 9999 }).success).toBe(false);
    expect(collegeBatchDirectorySchema.parse({ yearStart: "2026" }).yearStart).toBe(2026);
  });

  it("converts query values safely and never accepts duplicate selectors", () => {
    expect(academicDirectorySearchParams({
      q: "alpha", status: "ACTIVE",
    })).toEqual({ q: "alpha", status: "ACTIVE" });
    const duplicate = academicDirectorySearchParams({ page: ["1", "2"] });
    expect(duplicate).toBeNull();
    expect(collegeBatchDirectorySchema.safeParse(duplicate).success).toBe(false);
    expect(academicDirectorySearchParams({ q: "", programId: "", status: "ALL" }))
      .toEqual({ q: "", status: "ALL" });
  });

  it("constructs fixed paths with percent-encoded filters and bounded pages", () => {
    const semesters = new URL(academicDirectoryHref("SEMESTERS", {
      q: "a & b", status: "ACTIVE", page: 2,
    }), "https://example.test");
    expect(semesters.pathname).toBe("/college/semesters");
    expect(semesters.searchParams.get("q")).toBe("a & b");
    const term = new URL(academicDirectoryHref("SEMESTERS", {
      q: "", status: "ALL", page: 1, termNumber: 6,
    }), "https://example.test");
    expect(term.searchParams.get("termNumber")).toBe("6");
    expect(academicDirectoryHref("SEMESTERS",{q:"",status:"ALL",page:1,minimumCredits:18}))
      .toContain("minimumCredits=18");
    expect(academicDirectorySearchParams({minimumCredits:""})).toEqual({});
    expect(semesters.searchParams.has("collegeId")).toBe(false);
    expect(academicDirectoryHref("BATCHES", {
      q: "", status: "ALL", page: 1,
    })).toBe("/college/batches");
    expect(academicDirectoryHref("BATCHES", {
      q: "", status: "ALL", page: 2, yearStart: 2026,
    })).toContain("yearStart=2026");
    expect(academicDirectoryPageCount(0)).toBe(1);
    expect(academicDirectoryPageCount(26)).toBe(2);
  });

  it("does not manufacture missing progression state or academic year", () => {
    expect(batchProgressLabel(null)).toBe("No progression state recorded");
    expect(batchProgressLabel({
      currentTermNumber: 2, currentAcademicYearStart: null,
    })).toContain("academic year not recorded");
    expect(batchProgressLabel({
      currentTermNumber: 3, currentAcademicYearStart: 2026,
    })).toBe("Term 3 · 2026–2027");
  });
});
