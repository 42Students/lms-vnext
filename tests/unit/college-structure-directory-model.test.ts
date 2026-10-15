import { describe, expect, it } from "vitest";
import {
  classCapacityLabel,
  collegeStructureHref,
  collegeStructureQuerySchema,
  collegeClassQuerySchema,
  collegeElectiveQuerySchema,
  collegeStructureTotalPages,
  electiveSelectionLabel,
  readCollegeStructureParams,
} from "@/modules/academics/college-structure-directory-model";

describe("College Admin classes/electives read-only filters", () => {
  it("parses bounded filters and refuses a caller-controlled college", () => {
    expect(collegeStructureQuerySchema.parse({})).toEqual({
      q: "", status: "ACTIVE", page: 1,
    });
    expect(collegeStructureQuerySchema.parse({
      q: "  Science  ", status: "ARCHIVED", page: "3",
    })).toEqual({ q: "Science", status: "ARCHIVED", page: 3 });
    for (const invalid of [
      { collegeId: "00000000-0000-4000-8000-000000000001" },
      { page: "0" },
      { page: "1001" },
      { status: "DISABLED" },
      { q: "x".repeat(101) },
      { programId: "not-a-uuid" },
    ]) {
      expect(collegeStructureQuerySchema.safeParse(invalid).success).toBe(false);
    }
  });

  it("handles empty program picker and refuses duplicate query values", () => {
    expect(readCollegeStructureParams({ programId: "", status: "ACTIVE" }))
      .toEqual({ status: "ACTIVE" });
    expect(readCollegeStructureParams({ page: ["1", "2"] })).toBeNull();
    expect(collegeStructureQuerySchema.safeParse(
      readCollegeStructureParams({ page: ["1", "2"] }),
    ).success).toBe(false);
  });

  it("builds fixed relative routes with escaped search text", () => {
    const query = { q: "x & y", status: "ALL" as const, page: 2 };
    const url = new URL(collegeStructureHref("CLASSES", query), "https://example.test");
    expect(url.pathname).toBe("/college/classes");
    expect(url.searchParams.get("q")).toBe("x & y");
    expect(url.searchParams.has("collegeId")).toBe(false);
    expect(collegeStructureHref("ELECTIVES", { q: "", status: "ACTIVE", page: 1 }))
      .toBe("/college/electives");
    expect(collegeClassQuerySchema.parse({ minimumCapacity: "36" }).minimumCapacity).toBe(36);
    expect(collegeClassQuerySchema.safeParse({ minimumCapacity: 0 }).success).toBe(false);
    expect(collegeClassQuerySchema.safeParse({ maximumCapacity: 0 }).success).toBe(false);
    expect(collegeClassQuerySchema.safeParse({ maximumCapacity: 100001 }).success).toBe(false);
    expect(readCollegeStructureParams({maximumCapacity:""})).toEqual({});
    expect(collegeStructureQuerySchema.safeParse({ minimumCapacity: 36 }).success).toBe(false);
    expect(collegeStructureHref("CLASSES", { ...query, minimumCapacity: 36 })).toContain("minimumCapacity=36");
    expect(collegeStructureHref("CLASSES", { ...query, maximumCapacity: 36 })).toContain("maximumCapacity=36");
    expect(collegeStructureTotalPages(0)).toBe(1);
    expect(collegeElectiveQuerySchema.parse({ semesterNumber: "1" }).semesterNumber).toBe(1);
    expect(collegeElectiveQuerySchema.safeParse({ semesterNumber: 25 }).success).toBe(false);
    expect(collegeElectiveQuerySchema.safeParse({ minimumCredits: 0 }).success).toBe(false);
    expect(collegeElectiveQuerySchema.safeParse({ minimumCredits: 501 }).success).toBe(false);
    expect(readCollegeStructureParams({minimumCapacity:"",semesterNumber:"",minimumCredits:""})).toEqual({});
    expect(collegeClassQuerySchema.safeParse({ semesterNumber: 1 }).success).toBe(false);
    expect(collegeStructureHref("ELECTIVES", { ...query, semesterNumber: 1 })).toContain("semesterNumber=1");
    expect(collegeStructureHref("ELECTIVES", { ...query, minimumCredits: 3 })).toContain("minimumCredits=3");
    expect(collegeStructureTotalPages(26)).toBe(2);
  });

  it("does not fabricate capacity or elective choice rules", () => {
    expect(classCapacityLabel(null)).toBe("Not configured");
    expect(classCapacityLabel(60)).toBe("60");
    expect(electiveSelectionLabel(1, 1)).toBe("Select 1");
    expect(electiveSelectionLabel(1, 3)).toBe("Select 1–3");
  });
  it("cohortStatus classes query is validated and retained in navigation",()=>{
    expect(collegeClassQuerySchema.safeParse({cohortStatus:"INVALID"}).success).toBe(false);
    expect(collegeStructureHref("CLASSES",collegeClassQuerySchema.parse({cohortStatus:"ACTIVE"}))).toContain("cohortStatus=ACTIVE");
  });

  it("programStatus classes query is validated and retained in navigation",()=>{
    expect(collegeClassQuerySchema.safeParse({programStatus:"INVALID"}).success).toBe(false);
    expect(collegeStructureHref("CLASSES",collegeClassQuerySchema.parse({programStatus:"ACTIVE"}))).toContain("programStatus=ACTIVE");
  });

  it("periodState electives query is validated and retained in navigation",()=>{
    expect(collegeElectiveQuerySchema.safeParse({periodState:"INVALID"}).success).toBe(false);
    expect(collegeStructureHref("ELECTIVES",collegeElectiveQuerySchema.parse({periodState:"LINKED"}))).toContain("periodState=LINKED");
  });

  it("elective program lifecycle is validated and retained in navigation",()=>{
    expect(collegeElectiveQuerySchema.safeParse({programStatus:"OTHER"}).success).toBe(false);
    expect(collegeStructureHref("ELECTIVES",collegeElectiveQuerySchema.parse({programStatus:"ARCHIVED"}))).toContain("programStatus=ARCHIVED");
  });

  it("periodCode is an exact bounded class code filter, not arbitrary SQL",()=>{
    expect(collegeClassQuerySchema.safeParse({periodCode:"x".repeat(65)}).success).toBe(false);
    expect(readCollegeStructureParams({periodCode:""})).toEqual({});
    expect(collegeStructureHref("CLASSES",collegeClassQuerySchema.parse({periodCode:"A&26"}))).toContain("periodCode=A%2626");
  });

  it("classCode is an exact bounded class code filter, not arbitrary SQL",()=>{
    expect(collegeClassQuerySchema.safeParse({classCode:"x".repeat(65)}).success).toBe(false);
    expect(readCollegeStructureParams({classCode:""})).toEqual({});
    expect(collegeStructureHref("CLASSES",collegeClassQuerySchema.parse({classCode:"A&26"}))).toContain("classCode=A%2626");
  });

  it("choiceMode validates persisted elective evidence and navigation",()=>{
    expect(collegeElectiveQuerySchema.safeParse({choiceMode:"ASSUMED"}).success).toBe(false);
    expect(collegeStructureHref("ELECTIVES",collegeElectiveQuerySchema.parse({choiceMode:"FLEXIBLE"}))).toContain("choiceMode=FLEXIBLE");
  });

  it("offeringState validates persisted elective evidence and navigation",()=>{
    expect(collegeElectiveQuerySchema.safeParse({offeringState:"ASSUMED"}).success).toBe(false);
    expect(collegeStructureHref("ELECTIVES",collegeElectiveQuerySchema.parse({offeringState:"HAS_ACTIVE"}))).toContain("offeringState=HAS_ACTIVE");
  });

});
