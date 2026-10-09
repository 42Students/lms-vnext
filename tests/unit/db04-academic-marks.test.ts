import { describe, expect, it } from "vitest";
import {
  calculateComparableMarks,
  convertedPercentageBasisPoints,
  normaliseCgpaRule,
  normaliseMarkScale,
} from "@/modules/profile-verification/academic-marks";

const grade = {grade: "9.2", scale: "CGPA", max: "10"};
describe("DB04 original academic marks and current college conversion rule", () => {
  it("replicates each 10-point CGPA policy from legacy MarksConversion.java", () => {
    expect(convertedPercentageBasisPoints(grade, "X9_5")).toBe(8740);
    expect(convertedPercentageBasisPoints(grade, "MINUS_0_5_X10")).toBe(8700);
    expect(convertedPercentageBasisPoints(grade, "MINUS_0_75_X10")).toBe(8450);
    expect(convertedPercentageBasisPoints(grade, "X10")).toBe(9200);
    expect(convertedPercentageBasisPoints(grade, null)).toBe(8740);
    expect(normaliseCgpaRule("unknown")).toBe("X9_5");
  });

  it("honors GPA out of 4/5, percentage scale, and percent out of a non-100 max", () => {
    expect(convertedPercentageBasisPoints({grade: "3.7", scale: "GPA", max: "4"}, "X9_5")).toBe(9250);
    expect(convertedPercentageBasisPoints({grade: "4.5", scale: "CGPA", max: "5"}, "X9_5")).toBe(9000);
    expect(convertedPercentageBasisPoints({grade: "86", scale: "Percentage", max: null}, "X9_5")).toBe(8600);
    expect(convertedPercentageBasisPoints({grade: "934", scale: "Percentage", max: "1000"}, "X9_5")).toBe(9340);
  });

  it("handles legacy numeric Grade, CPI, decimal comma and half-up rounding", () => {
    expect(convertedPercentageBasisPoints({grade: "9,2", scale: "CGPA", max: "10"})).toBe(8740);
    expect(convertedPercentageBasisPoints({grade: "9.2", scale: "CPI", max: null})).toBe(8740);
    expect(convertedPercentageBasisPoints({grade: "9.2", scale: "Grade", max: "10"})).toBe(8740);
    expect(convertedPercentageBasisPoints({grade: "99.995", scale: "Percentage", max: "100"})).toBe(10000);
    expect(normaliseMarkScale("SGPA")).toBe("CGPA");
  });

  it("does not manufacture a numeric percentage for letters, impossible marks or negatives", () => {
    expect(convertedPercentageBasisPoints({grade: "A1", scale: "Grade", max: null})).toBeNull();
    expect(convertedPercentageBasisPoints({grade: "-0.1", scale: "Percentage", max: null})).toBeNull();
    expect(convertedPercentageBasisPoints({grade: "86", scale: "CGPA", max: "10"})).toBeNull();
    expect(convertedPercentageBasisPoints({grade: "934", scale: "Percentage", max: null})).toBeNull();
  });

  it("recomputes comparable percentages without rewriting raw verified marks", () => {
    const input = {"10TH": grade, UG: {grade: "3.7", scale: "GPA", max: "4"}};
    const before = calculateComparableMarks(input, "X9_5");
    const after = calculateComparableMarks(input, "X10");
    expect(before["10TH"].percentageBasisPoints).toBe(8740);
    expect(after["10TH"].percentageBasisPoints).toBe(9200);
    expect(after.UG.percentageBasisPoints).toBe(9250);
    expect(after["10TH"].raw).toEqual(grade);
    expect(input["10TH"]).toEqual(grade);
    expect(after["10TH"].appliedRule).toBe("X10");
  });
});
