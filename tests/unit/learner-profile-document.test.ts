import {
  describe,
  expect,
  it,
} from "vitest";
import {
  learnerProfileDocumentSchema,
} from "@/modules/people/profile-validation";

describe("learner profile document validation", () => {
  it("normalizes identity and deduplicates hobbies", () => {
    const value =
      learnerProfileDocumentSchema.parse({
        identity: {
          aadhaarNumber: "1234-1234-1234",
          panNumber: "abcde1234f",
        },
        hobbies: [
          "Reading",
          "reading",
          "Cycling",
        ],
      });

    expect(value.identity).toEqual({
      aadhaarNumber: "123412341234",
      panNumber: "ABCDE1234F",
    });
    expect(value.hobbies).toEqual([
      "Reading",
      "Cycling",
    ]);
  });

  it("rejects invalid URLs and date ranges", () => {
    expect(() =>
      learnerProfileDocumentSchema.parse({
        socialProfiles: {
          linkedinUrl: "javascript:alert(1)",
        },
      }),
    ).toThrow();

    expect(() =>
      learnerProfileDocumentSchema.parse({
        experiences: [
          {
            id: "11111111-1111-4111-8111-111111111111",
            organization: "Acme",
            designation: "Engineer",
            startDate: "2025-01-01",
            endDate: "2024-01-01",
          },
        ],
      }),
    ).toThrow();
  });
});
