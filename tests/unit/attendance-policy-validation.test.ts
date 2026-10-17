import { describe, expect, it } from "vitest";
import {
  attendancePolicyUpdateSchema,
  DEFAULT_ATTENDANCE_POLICY,
} from "@/modules/attendance/policy-validation";

const COLLEGE_ID =
  "11111111-1111-4111-8111-111111111111";

const valid = {
  collegeId: COLLEGE_ID,
  eligibilityThresholdPercent: 75,
  correctionWindowHours: 24,
};

describe("attendance policy validation", () => {
  it("accepts the existing college defaults", () => {
    expect(
      attendancePolicyUpdateSchema.parse(valid),
    ).toEqual(valid);

    expect(DEFAULT_ATTENDANCE_POLICY).toEqual({
      eligibilityThresholdPercent: 75,
      correctionWindowHours: 24,
    });
  });

  it("accepts both ends of the database threshold range", () => {
    for (const value of [1, 100]) {
      expect(
        attendancePolicyUpdateSchema.safeParse({
          ...valid,
          eligibilityThresholdPercent: value,
        }).success,
      ).toBe(true);
    }
  });

  it("rejects threshold values outside 1 to 100", () => {
    for (const value of [
      -1,
      0,
      101,
      200,
      75.5,
      Number.NaN,
      Number.POSITIVE_INFINITY,
    ]) {
      expect(
        attendancePolicyUpdateSchema.safeParse({
          ...valid,
          eligibilityThresholdPercent: value,
        }).success,
      ).toBe(false);
    }
  });

  it("accepts both ends of the correction-window range", () => {
    for (const value of [1, 168, 8760]) {
      expect(
        attendancePolicyUpdateSchema.safeParse({
          ...valid,
          correctionWindowHours: value,
        }).success,
      ).toBe(true);
    }
  });

  it("rejects correction windows outside 1 to 8760 hours (legacy range)", () => {
    for (const value of [
      -1,
      0,
      8761,
      10000,
      24.5,
      Number.NaN,
      Number.POSITIVE_INFINITY,
    ]) {
      expect(
        attendancePolicyUpdateSchema.safeParse({
          ...valid,
          correctionWindowHours: value,
        }).success,
      ).toBe(false);
    }
  });

  it("rejects stringified numbers instead of coercing them", () => {
    expect(
      attendancePolicyUpdateSchema.safeParse({
        ...valid,
        eligibilityThresholdPercent: "75",
      }).success,
    ).toBe(false);

    expect(
      attendancePolicyUpdateSchema.safeParse({
        ...valid,
        correctionWindowHours: "24",
      }).success,
    ).toBe(false);
  });

  it("requires a valid college UUID", () => {
    expect(
      attendancePolicyUpdateSchema.safeParse({
        ...valid,
        collegeId: "not-a-uuid",
      }).success,
    ).toBe(false);

    expect(
      attendancePolicyUpdateSchema.safeParse({
        ...valid,
        collegeId: "",
      }).success,
    ).toBe(false);
  });

  it("requires both policy numbers", () => {
    expect(
      attendancePolicyUpdateSchema.safeParse({
        collegeId: COLLEGE_ID,
        eligibilityThresholdPercent: 75,
      }).success,
    ).toBe(false);

    expect(
      attendancePolicyUpdateSchema.safeParse({
        collegeId: COLLEGE_ID,
        correctionWindowHours: 24,
      }).success,
    ).toBe(false);
  });

  it("rejects unexpected properties", () => {
    expect(
      attendancePolicyUpdateSchema.safeParse({
        ...valid,
        updatedByUserId:
          "22222222-2222-4222-8222-222222222222",
      }).success,
    ).toBe(false);
  });

  it("does not permit changing college scope through a missing identifier", () => {
    expect(
      attendancePolicyUpdateSchema.safeParse({
        eligibilityThresholdPercent: 75,
        correctionWindowHours: 24,
      }).success,
    ).toBe(false);
  });
});
