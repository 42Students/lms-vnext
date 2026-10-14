import { describe, expect, it } from "vitest";
import { peopleCsvQuery, neutralizePeopleCsv, renderPeopleCsv,
  collegePeopleExportHref, parsePeopleCsvParams } from "@/modules/people/college-people-export-model";
describe("College people CSV contract", () => {
  it("only allows the three source filters", () => {
    expect(peopleCsvQuery.parse({})).toEqual({ q:"", role:"ALL", status:"ALL" });
    expect(peopleCsvQuery.safeParse({ collegeId:"other" }).success).toBe(false);
    expect(peopleCsvQuery.safeParse({ role:"SUPER_ADMIN" }).success).toBe(false);
    expect(() => parsePeopleCsvParams(new URLSearchParams("q=a&q=b"))).toThrow();
    const url = new URL(collegePeopleExportHref({ q:"a & b", role:"MENTOR", status:"ACTIVE" }), "https://test.invalid");
    expect(url.searchParams.get("q")).toBe("a & b");
    expect(url.searchParams.has("collegeId")).toBe(false);
    const learner = new URL(collegePeopleExportHref({q:"Ana",role:"LEARNER",status:"SUSPENDED"}), "https://test.invalid");
    expect(learner.searchParams.get("role")).toBe("LEARNER");
    expect(learner.searchParams.get("status")).toBe("SUSPENDED");
  });
  it("neutralizes spreadsheet injection and reports truncation", () => {
    for (const value of ["=2+2", " -10", "+cmd", "@query", "\t=1"])
      expect(neutralizePeopleCsv(value)).toContain("'" + value);
    expect(neutralizePeopleCsv('a"b')).toBe('"a""b"');
    expect(renderPeopleCsv([], true)).toContain("EXPORT TRUNCATED");
  });
});
