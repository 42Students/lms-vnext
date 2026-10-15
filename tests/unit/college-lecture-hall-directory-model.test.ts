import { describe, expect, it } from "vitest";
import {
  COLLEGE_LECTURE_HALL_PAGE_SIZE,
  collegeLectureHallHref,
  collegeLectureHallTotalPages,
  hasCollegeLectureHallFilters,
  parseCollegeLectureHallSearchParams,
} from "@/modules/academics/college-lecture-hall-directory-model";

describe("College Admin lecture hall directory filters", () => {
  it("defaults to all statuses and room types with a bounded first page", () => {
    expect(parseCollegeLectureHallSearchParams({})).toEqual({
      q: "", status: "ALL", roomType: "ALL", upcoming:"ALL", page: 1,
    });
    expect(COLLEGE_LECTURE_HALL_PAGE_SIZE).toBe(25);
    expect(collegeLectureHallTotalPages(0)).toBe(1);
    expect(collegeLectureHallTotalPages(25)).toBe(1);
    expect(collegeLectureHallTotalPages(26)).toBe(2);
  });

  it("accepts trimmed search with validated type/status/department/page", () => {
    const result = parseCollegeLectureHallSearchParams({
      q: "  Comp Lab  ",
      status: "ARCHIVED",
      roomType: "LAB",
      departmentId: "00000000-0000-4000-8000-000000000001",
      page: "2",
    });
    expect(result).toEqual({
      q: "Comp Lab", status: "ARCHIVED", roomType: "LAB",
      departmentId: "00000000-0000-4000-8000-000000000001", upcoming:"ALL", page: 2,
    });
    expect(parseCollegeLectureHallSearchParams({
      departmentId: "", status: "ALL",
    })?.departmentId).toBeUndefined();
  });

  it("fails closed on caller-chosen college and malformed/duplicate filters", () => {
    for (const invalid of [
      { collegeId: "00000000-0000-4000-8000-000000000001" },
      { page: "0" },
      { page: "1001" },
      { minimumCapacity: "0" },
      { minimumCapacity: "5001" },
      { maximumCapacity: "0" },
      { maximumCapacity: "5001" },
      { upcoming: "LATER" },
      { minimumCapacity: "40", maximumCapacity: "39" },
      { status: "DELETED" },
      { roomType: "GYM" },
      { departmentId: "another-college" },
      { q: "x".repeat(101) },
      { q: ["alpha", "beta"] },
      { page: ["1", "2"] },
    ]) {
      expect(parseCollegeLectureHallSearchParams(invalid)).toBeNull();
    }
  });

  it("keeps pagination hrefs relative, encoded and college-independent", () => {
    const query = parseCollegeLectureHallSearchParams({
      q: "Room & Hall", status: "ACTIVE", roomType: "LAB",
      page: "3",
    });
    expect(query).not.toBeNull();
    const href = collegeLectureHallHref(query!);
    const url = new URL(href, "https://example.test");
    expect(url.pathname).toBe("/college/lecture-halls");
    expect(url.searchParams.get("q")).toBe("Room & Hall");
    expect(url.searchParams.get("status")).toBe("ACTIVE");
    expect(url.searchParams.get("page")).toBe("3");
    const seats = parseCollegeLectureHallSearchParams({ minimumCapacity: "38" });
    expect(seats?.minimumCapacity).toBe(38);
    expect(collegeLectureHallHref(seats!)).toContain("minimumCapacity=38");
    const maxSeats = parseCollegeLectureHallSearchParams({ maximumCapacity: "38", minimumCapacity: "20" });
    expect(maxSeats?.maximumCapacity).toBe(38);
    expect(collegeLectureHallHref(maxSeats!)).toContain("maximumCapacity=38");
    expect(url.searchParams.has("collegeId")).toBe(false);
    expect(hasCollegeLectureHallFilters(query!)).toBe(true);
    const upcoming = parseCollegeLectureHallSearchParams({upcoming:"NO"});
    expect(collegeLectureHallHref(upcoming!)).toContain("upcoming=NO");
    expect(hasCollegeLectureHallFilters(upcoming!)).toBe(true);
    const defaults = parseCollegeLectureHallSearchParams({})!;
    expect(collegeLectureHallHref(defaults)).toBe("/college/lecture-halls");
    expect(hasCollegeLectureHallFilters(defaults)).toBe(false);
  });
});
