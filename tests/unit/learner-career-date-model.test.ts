import {describe,expect,it} from "vitest";
import {parseLearnerCareerDate} from "@/modules/placements/learner-career-date-model";
describe("direct IST career calendar date selection",()=>{
  it("accepts real leap dates and UTC-independent calendar keys",()=>{
    expect(parseLearnerCareerDate("2028-02-29")).toBe("2028-02-29");
    expect(parseLearnerCareerDate("2026-10-17")).toBe("2026-10-17");
  });
  it("rejects invalid leap days, malformed dates and caller-provided identity",()=>{
    for(const raw of ["2026-02-29","2026-13-01","2026-10-32","2026-10-1",
      ["2026-10-17"],{date:"2026-10-17",collegeId:"other"},""]) {
      expect(parseLearnerCareerDate(raw)).toBeNull();
    }
  });
});
