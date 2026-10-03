import {
  describe,
  expect,
  it,
} from "vitest";
import { placementScreeningDecisionInputSchema } from "@/modules/placements/validation";

describe("Placement screening validation", () => {
  it("requires an internal reason when placing a candidate on hold", () => {
    expect(() =>
      placementScreeningDecisionInputSchema.parse({
        decision: "HOLD",
      }),
    ).toThrow();

    expect(
      placementScreeningDecisionInputSchema.parse({
        decision: "HOLD",
        internalReason:
          "Recruiter requested a manual profile review",
      }),
    ).toMatchObject({
      decision: "HOLD",
    });
  });

  it("requires candidate-safe wording for rejection", () => {
    expect(() =>
      placementScreeningDecisionInputSchema.parse({
        decision: "REJECTED",
        internalReason:
          "Internal recruiter assessment",
      }),
    ).toThrow();

    expect(
      placementScreeningDecisionInputSchema.parse({
        decision: "REJECTED",
        candidateMessage:
          "Not shortlisted for this opportunity",
        internalReason:
          "Internal recruiter assessment",
      }),
    ).toMatchObject({
      decision: "REJECTED",
    });
  });

  it("allows shortlist without inventing a reason", () => {
    expect(
      placementScreeningDecisionInputSchema.parse({
        decision: "SHORTLISTED",
      }),
    ).toEqual({
      decision: "SHORTLISTED",
    });
  });
});
