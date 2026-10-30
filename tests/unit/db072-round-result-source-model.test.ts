import { describe, expect, it } from "vitest";
import { isRecruiterRoundResultSource } from "@/modules/placements/round-result-source-model";

describe("DB072 recruiter provenance transition", () => {
  it("recognizes both the pre-cutover stored code and canonical recruiter code", () => {
    expect(isRecruiterRoundResultSource("HR")).toBe(true);
    expect(isRecruiterRoundResultSource("RECRUITER")).toBe(true);
  });
  it("never conflates other provenance with recruiter ownership", () => {
    for (const source of ["TPO","IMPORT","EXCEL","FACULTY","PANELIST","DRIVE_DAY","", "hr", "RECRUITER "])
      expect(isRecruiterRoundResultSource(source)).toBe(false);
  });
});
