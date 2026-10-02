import { describe, expect, it } from "vitest";
import {
  listCollegePeopleQuerySchema,
  onboardPersonInputSchema,
} from "@/modules/people/validation";

const collegeId = "7f8e7b00-8503-4a2d-a222-fdfe8eb55ac0";

describe("people onboarding validation", () => {
  it("normalizes E.164 formatting, email casing, display name and roles", () => {
    expect(
      onboardPersonInputSchema.parse({
        collegeId,
        phoneE164: " +91 93976-62127 ",
        email: " PHANI@EXAMPLE.COM ",
        displayName: "  Phanindra  ",
        roles: ["FACULTY", "MENTOR", "FACULTY"],
      }),
    ).toEqual({
      collegeId,
      phoneE164: "+919397662127",
      email: "phani@example.com",
      displayName: "Phanindra",
      roles: ["FACULTY", "MENTOR"],
    });
  });

  it("requires an international country code and at least one membership role", () => {
    expect(() =>
      onboardPersonInputSchema.parse({
        collegeId,
        phoneE164: "9397662127",
        displayName: "Phanindra",
        roles: ["FACULTY"],
      }),
    ).toThrow();

    expect(() =>
      onboardPersonInputSchema.parse({
        collegeId,
        phoneE164: "+919397662127",
        displayName: "Phanindra",
        roles: [],
      }),
    ).toThrow();
  });

  it("rejects system roles in membership role input", () => {
    expect(() =>
      onboardPersonInputSchema.parse({
        collegeId,
        phoneE164: "+919397662127",
        displayName: "Phanindra",
        roles: ["SUPER_ADMIN"],
      }),
    ).toThrow();
  });

  it("bounds college people list pagination", () => {
    expect(
      listCollegePeopleQuerySchema.parse({
        collegeId,
      }),
    ).toEqual({
      collegeId,
      limit: 50,
      offset: 0,
    });

    expect(() =>
      listCollegePeopleQuerySchema.parse({
        collegeId,
        limit: 101,
      }),
    ).toThrow();

    expect(() =>
      listCollegePeopleQuerySchema.parse({
        collegeId,
        offset: -1,
      }),
    ).toThrow();
  });
});
