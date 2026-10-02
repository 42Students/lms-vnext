import { describe, expect, it } from "vitest";
import {
  facultyProfileInputSchema,
  learnerProfileInputSchema,
} from "@/modules/people/profile-validation";

describe("people profile validation", () => {
  it("keeps learner profile minimal and normalizes identifiers", () => {
    expect(
      learnerProfileInputSchema.parse({
        rollNumber: "  22CE001  ",
        registrationNumber: "  REG-001  ",
      }),
    ).toEqual({
      rollNumber: "22CE001",
      registrationNumber: "REG-001",
    });
  });

  it("keeps faculty employment and title separate from authorization", () => {
    expect(
      facultyProfileInputSchema.parse({
        primaryDepartmentId:
          "7f8e7b00-8503-4a2d-a222-fdfe8eb55ac0",
        employmentType: "  FULL_TIME  ",
        academicTitle: "  Assistant Professor  ",
        role: "COLLEGE_ADMIN",
      }),
    ).toEqual({
      primaryDepartmentId:
        "7f8e7b00-8503-4a2d-a222-fdfe8eb55ac0",
      employmentType: "FULL_TIME",
      academicTitle: "Assistant Professor",
    });
  });

  it("rejects blank profile text instead of storing ambiguous empty strings", () => {
    expect(() =>
      learnerProfileInputSchema.parse({
        rollNumber: "   ",
      }),
    ).toThrow();

    expect(() =>
      facultyProfileInputSchema.parse({
        academicTitle: "   ",
      }),
    ).toThrow();
  });
});
