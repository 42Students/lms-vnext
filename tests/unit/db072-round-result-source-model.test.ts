import { describe, expect, it } from "vitest";
import { isRecruiterRoundResultSource,isSameRoundResultSubmitter } from "@/modules/placements/round-result-source-model";

describe("DB072 recruiter provenance transition", () => {
  it("recognizes both the pre-cutover stored code and canonical recruiter code", () => {
    expect(isRecruiterRoundResultSource("HR")).toBe(true);
    expect(isRecruiterRoundResultSource("RECRUITER")).toBe(true);
  });
  it("never conflates other provenance with recruiter ownership", () => {
    for (const source of ["TPO","IMPORT","EXCEL","FACULTY","PANELIST","DRIVE_DAY","", "hr", "RECRUITER "])
      expect(isRecruiterRoundResultSource(source)).toBe(false);
  });

  it("never lets an authorized recruiter replay or overwrite another submitter's result", () => {
    const own="60000000-0000-4000-8000-000000000001";
    const colleague="60000000-0000-4000-8000-000000000002";
    expect(isSameRoundResultSubmitter(own,own)).toBe(true);
    expect(isSameRoundResultSubmitter(colleague,own)).toBe(false);
    expect(isSameRoundResultSubmitter(null,own)).toBe(false);
    expect(isSameRoundResultSubmitter(undefined,own)).toBe(false);
    expect(isSameRoundResultSubmitter("",own)).toBe(false);
    expect(isSameRoundResultSubmitter(own,"")).toBe(false);
  });
});
