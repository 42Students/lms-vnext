import { describe, expect, it } from "vitest";
import {
  academicDirectoryHref,
  academicDirectoryPageCount,
  academicDirectorySearchParams,
  batchProgressLabel,
  collegeBatchDirectorySchema,
  collegeSemesterDirectorySchema,
} from "@/modules/academics/college-academic-directory-model";


const sem = (query: Record<string, unknown>) => collegeSemesterDirectorySchema.parse(query);
const batch = (query: Record<string, unknown>) => collegeBatchDirectorySchema.parse(query);
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
      { maximumCredits: 501 },
      { minimumCredits: 19, maximumCredits: 18 },
    ]) {
      expect(collegeSemesterDirectorySchema.safeParse(invalid).success).toBe(false);
    }
  });

  it("accepts only defined cohort lifecycles", () => {
    expect(collegeBatchDirectorySchema.parse({})).toEqual({
      q: "", status: "ALL", progression: "ALL", page: 1,
    });
    expect(collegeBatchDirectorySchema.parse({
      status: "COMPLETED", page: "3",
    })).toEqual({ q: "", status: "COMPLETED", progression:"ALL", page: 3 });
    expect(collegeBatchDirectorySchema.safeParse({ status: "INACTIVE" }).success).toBe(false);
    expect(collegeBatchDirectorySchema.safeParse({progression:"UNKNOWN"}).success).toBe(false);
    expect(academicDirectoryHref("BATCHES",collegeBatchDirectorySchema.parse({progression:"MISSING"}))).toContain("progression=MISSING");
    expect(collegeBatchDirectorySchema.safeParse({ collegeId: "foreign" }).success).toBe(false);
    expect(collegeBatchDirectorySchema.safeParse({ yearStart: 1899 }).success).toBe(false);
    expect(collegeBatchDirectorySchema.safeParse({ currentTerm: 0 }).success).toBe(false);
    expect(collegeBatchDirectorySchema.safeParse({ currentTerm: 25 }).success).toBe(false);
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
    const semesters = new URL(academicDirectoryHref("SEMESTERS", sem({
      q: "a & b", status: "ACTIVE", page: 2,
    })), "https://example.test");
    expect(semesters.pathname).toBe("/college/semesters");
    expect(semesters.searchParams.get("q")).toBe("a & b");
    const term = new URL(academicDirectoryHref("SEMESTERS", sem({
      q: "", status: "ALL", page: 1, termNumber: 6,
    })), "https://example.test");
    expect(term.searchParams.get("termNumber")).toBe("6");
    expect(academicDirectoryHref("SEMESTERS", sem({q:"",status:"ALL",page:1,minimumCredits:18})))
      .toContain("minimumCredits=18");
    expect(academicDirectorySearchParams({minimumCredits:""})).toEqual({});
    expect(academicDirectoryHref("SEMESTERS", sem({q:"",status:"ALL",page:1,maximumCredits:20}))).toContain("maximumCredits=20");
    expect(academicDirectorySearchParams({maximumCredits:""})).toEqual({});
    expect(semesters.searchParams.has("collegeId")).toBe(false);
    expect(academicDirectoryHref("BATCHES", batch({
      q: "", status: "ALL", page: 1,
    }))).toBe("/college/batches");
    expect(academicDirectoryHref("BATCHES", batch({
      q: "", status: "ALL", page: 2, yearStart: 2026,
    }))).toContain("yearStart=2026");
    expect(academicDirectoryHref("BATCHES", batch({q:"",status:"ALL",page:1,currentTerm:3})))
      .toContain("currentTerm=3");
    expect(academicDirectorySearchParams({currentTerm:""})).toEqual({});
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
  it("distinguishes semester credits that are configured from missing evidence", () => {
    expect(collegeSemesterDirectorySchema.safeParse({creditState:"GUESSED"}).success).toBe(false);
    expect(academicDirectoryHref("SEMESTERS",collegeSemesterDirectorySchema.parse({creditState:"UNSET"}))).toContain("creditState=UNSET");
  });

  it("semester parent program lifecycle has a bounded College Admin URL", () => {
    expect(collegeSemesterDirectorySchema.safeParse({programStatus:"INVALID"}).success).toBe(false);
    expect(academicDirectoryHref("SEMESTERS",collegeSemesterDirectorySchema.parse({programStatus:"ACTIVE"}))).toContain("programStatus=ACTIVE");
  });

  it("mappingState: validates semester/batch query and pagination",()=>{
    expect(collegeSemesterDirectorySchema.safeParse({mappingState:"INVALID"}).success).toBe(false);
    expect(academicDirectoryHref("SEMESTERS",collegeSemesterDirectorySchema.parse({mappingState:"MAPPED"}))).toContain("mappingState=MAPPED");
  });

  it("expectedEndState: validates semester/batch query and pagination",()=>{
    expect(collegeBatchDirectorySchema.safeParse({expectedEndState:"INVALID"}).success).toBe(false);
    expect(academicDirectoryHref("BATCHES",collegeBatchDirectorySchema.parse({expectedEndState:"UNSET"}))).toContain("expectedEndState=UNSET");
  });

  it("academicYearState: validates semester/batch query and pagination",()=>{
    expect(collegeBatchDirectorySchema.safeParse({academicYearState:"INVALID"}).success).toBe(false);
    expect(academicDirectoryHref("BATCHES",collegeBatchDirectorySchema.parse({academicYearState:"RECORDED"}))).toContain("academicYearState=RECORDED");
  });

  it("filters batches using the actual parent program lifecycle",()=>{
    expect(collegeBatchDirectorySchema.safeParse({programStatus:"UNKNOWN"}).success).toBe(false);
    expect(academicDirectoryHref("BATCHES",collegeBatchDirectorySchema.parse({programStatus:"ARCHIVED"}))).toContain("programStatus=ARCHIVED");
  });

  it("startOnOrAfter validates actual ISO dates and survives batch links",()=>{
    expect(collegeBatchDirectorySchema.safeParse({startOnOrAfter:"2026-02-30"}).success).toBe(false);
    expect(collegeBatchDirectorySchema.safeParse({startOnOrAfter:"2026-07-01"}).success).toBe(true);
    expect(academicDirectorySearchParams({startOnOrAfter:""})).toEqual({});
    expect(academicDirectoryHref("BATCHES",collegeBatchDirectorySchema.parse({startOnOrAfter:"2026-07-01"}))).toContain("startOnOrAfter=2026-07-01");
  });

  it("startOnOrBefore validates actual ISO dates and survives batch links",()=>{
    expect(collegeBatchDirectorySchema.safeParse({startOnOrBefore:"2026-02-30"}).success).toBe(false);
    expect(academicDirectorySearchParams({startOnOrBefore:""})).toEqual({});
    expect(academicDirectoryHref("BATCHES",collegeBatchDirectorySchema.parse({startOnOrBefore:"2026-07-01"}))).toContain("startOnOrBefore=2026-07-01");
  });

  it("activeClassState supports persisted-only choices and safe pagination URLs",()=>{
    expect(collegeBatchDirectorySchema.safeParse({activeClassState:"GUESSED"}).success).toBe(false);
    expect(academicDirectoryHref("BATCHES",collegeBatchDirectorySchema.parse({activeClassState:"HAS_ACTIVE"}))).toContain("activeClassState=HAS_ACTIVE");
  });

  it("activeLearnerState supports persisted-only choices and safe pagination URLs",()=>{
    expect(collegeBatchDirectorySchema.safeParse({activeLearnerState:"GUESSED"}).success).toBe(false);
    expect(academicDirectoryHref("BATCHES",collegeBatchDirectorySchema.parse({activeLearnerState:"HAS_ACTIVE"}))).toContain("activeLearnerState=HAS_ACTIVE");
  });

 it("rejects batch start-date order but accepts noncontradictory choices",()=>{
  const bad=collegeBatchDirectorySchema.safeParse({startOnOrAfter:"2026-09-10",startOnOrBefore:"2026-09-09"});
  expect(bad.success).toBe(false);
  if(!bad.success)expect(bad.error.issues[0]?.message).toContain("Batch start-date end limit must not precede start limit");
  expect(collegeBatchDirectorySchema.safeParse({startOnOrAfter:"2026-09-09",startOnOrBefore:"2026-09-10"}).success).toBe(true);
 });
 it("rejects missing progression versus recorded term but accepts noncontradictory choices",()=>{
  const bad=collegeBatchDirectorySchema.safeParse({progression:"MISSING",currentTerm:2});
  expect(bad.success).toBe(false);
  if(!bad.success)expect(bad.error.issues[0]?.message).toContain("A missing progression record cannot have a recorded current term");
  expect(collegeBatchDirectorySchema.safeParse({progression:"RECORDED",currentTerm:2}).success).toBe(true);
 });
 it("rejects unrecorded academic year versus year filter but accepts noncontradictory choices",()=>{
  const bad=collegeBatchDirectorySchema.safeParse({academicYearState:"UNRECORDED",yearStart:2026});
  expect(bad.success).toBe(false);
  if(!bad.success)expect(bad.error.issues[0]?.message).toContain("An unrecorded academic year cannot match a year-start filter");
  expect(collegeBatchDirectorySchema.safeParse({academicYearState:"RECORDED",yearStart:2026}).success).toBe(true);
 });
 it("rejects missing progression versus academic year filter but accepts noncontradictory choices",()=>{
  const bad=collegeBatchDirectorySchema.safeParse({progression:"MISSING",yearStart:2026});
  expect(bad.success).toBe(false);
  if(!bad.success)expect(bad.error.issues[0]?.message).toContain("A missing progression record cannot match a recorded academic year");
  expect(collegeBatchDirectorySchema.safeParse({progression:"RECORDED",yearStart:2026}).success).toBe(true);
 });
 it("rejects unconfigured semester credits combined with numeric credit bounds",()=>{
  expect(collegeSemesterDirectorySchema.safeParse({creditState:"UNSET",minimumCredits:0}).success).toBe(false);
  expect(collegeSemesterDirectorySchema.safeParse({creditState:"UNSET",maximumCredits:6}).success).toBe(false);
  expect(collegeSemesterDirectorySchema.safeParse({creditState:"UNSET"}).success).toBe(true);
  expect(collegeSemesterDirectorySchema.safeParse({creditState:"CONFIGURED",minimumCredits:6}).success).toBe(true);
 });
});
