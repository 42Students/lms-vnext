import {
  describe,
  expect,
  it,
} from "vitest";
import { stagePlacementRoundResultInputSchema, mapHistoricalRoundResultSource } from "@/modules/placements/validation";

describe("Placement round result validation", () => {
  it("maps historical provenance without permitting a client-defined live source",()=>{
    expect(mapHistoricalRoundResultSource("recruiter")).toBe("RECRUITER");
    expect(mapHistoricalRoundResultSource("PANELIST")).toBe("PANELIST");
    expect(mapHistoricalRoundResultSource("DRIVE_DAY")).toBe("DRIVE_DAY");
    expect(mapHistoricalRoundResultSource("EXCEL")).toBe("IMPORT");
    expect(mapHistoricalRoundResultSource("TPO")).toBe("TPO");
    expect(()=>mapHistoricalRoundResultSource("SUPER_ADMIN")).toThrow();
  });

  it("requires ranked holds", () => {
    expect(() =>
      stagePlacementRoundResultInputSchema.parse({
        applicationId:
          "70000000-0000-4000-8000-000000000001",
        outcome: "HOLD",
        candidateMessage:
          "You are currently waitlisted",
      }),
    ).toThrow();

    expect(
      stagePlacementRoundResultInputSchema.parse({
        applicationId:
          "70000000-0000-4000-8000-000000000001",
        outcome: "HOLD",
        waitlistRank: 2,
        candidateMessage:
          "You are currently waitlisted",
      }),
    ).toMatchObject({
      outcome: "HOLD",
      waitlistRank: 2,
    });
  });

  it("does not accept waitlist ranks for non-hold outcomes", () => {
    expect(() =>
      stagePlacementRoundResultInputSchema.parse({
        applicationId:
          "70000000-0000-4000-8000-000000000001",
        outcome: "PASS",
        waitlistRank: 1,
      }),
    ).toThrow();
  });

  it("requires candidate-safe wording for non-pass outcomes", () => {
    for (const outcome of [
      "FAIL",
      "HOLD",
      "ABSENT",
    ] as const) {
      expect(() =>
        stagePlacementRoundResultInputSchema.parse({
          applicationId:
            "70000000-0000-4000-8000-000000000001",
          outcome,
          waitlistRank:
            outcome === "HOLD" ? 1 : undefined,
          internalComment:
            "Private recruiter note",
        }),
      ).toThrow();
    }
  });

  it("accepts fractional legacy scores while rejecting out-of-range values", () => {
    expect(() =>
      stagePlacementRoundResultInputSchema.parse({
        applicationId:
          "70000000-0000-4000-8000-000000000001",
        outcome: "PASS",
        scorePercent: 101,
      }),
    ).toThrow();

    expect(
      stagePlacementRoundResultInputSchema.parse({
        applicationId:
          "70000000-0000-4000-8000-000000000001",
        outcome: "PASS",
        scorePercent: 87,
      }).scorePercent,
    ).toBe(87);
    expect(stagePlacementRoundResultInputSchema.parse({
      applicationId:"70000000-0000-4000-8000-000000000001",
      outcome:"PASS",scorePercent:87.125,
    }).scorePercent).toBe(87.125);
    expect(stagePlacementRoundResultInputSchema.safeParse({
      applicationId:"70000000-0000-4000-8000-000000000001",
      outcome:"PASS",scorePercent:50,source:"PANELIST",
    }).success).toBe(false);
  });
});
