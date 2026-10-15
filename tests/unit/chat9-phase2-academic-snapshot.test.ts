import { describe, expect, it } from "vitest";
import { parseAcademicSnapshot } from "@/modules/profile-verification/academic-snapshot";
import { VerificationStateError } from "@/modules/profile-verification/domain";

const row = (educationType: string, grade: string, endYear: string) => ({
  educationType, grade, endYear, gradingType: "PERCENTAGE", max: "100",
});
const required = [
  row("10th", "81", "2015"),
  row("12th", "84", "2017"),
  row("UG", "78", "2021"),
];

describe("T-S2-09 verified academic snapshot parity", () => {
  it("keeps the latest endYear per level regardless of array order", () => {
    const parsed = parseAcademicSnapshot({education: [
      row("UG", "91", "2023"), ...required, row("UG", "67", "2020"),
    ]});
    expect(parsed.filter(x => x.level === "UG")).toEqual([{
      level:"UG",grade:"91",endYear:"2023",scale:"PERCENTAGE",max:"100",
    }]);
  });

  it("ignores ungraded optional entries and duplicate blank grades", () => {
    const parsed = parseAcademicSnapshot({education: [
      ...required, row("PG", " ", "2025"), row("UG", "", "2028"),
      row("Other", "", "2022"),
    ]});
    expect(parsed).toHaveLength(3);
    expect(parsed.find(x=>x.level==="UG")?.grade).toBe("78");
  });

  it("selects the last record on equal graduation years", () => {
    const parsed = parseAcademicSnapshot({education: [
      ...required,row("UG","82","2021"),
    ]});
    expect(parsed.find(x=>x.level==="UG")?.grade).toBe("82");
  });

  it("never verifies an incomplete set of core graded milestones", () => {
    expect(() => parseAcademicSnapshot({education: [
      row("10th","80","2015"), row("12th"," ","2017"), row("UG","85","2021"),
    ]})).toThrowError(VerificationStateError);
  });

  it("rejects malformed snapshot entries without accepting untrusted values", () => {
    expect(() => parseAcademicSnapshot({education:[...required, null]}))
      .toThrowError(VerificationStateError);
  });
});
