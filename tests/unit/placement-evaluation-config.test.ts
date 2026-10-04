import {
  describe,
  expect,
  it,
} from "vitest";
import { placementEvaluationConfigInputSchema } from "@/modules/placements/validation";

const firstId =
  "11111111-1111-4111-8111-111111111111";
const secondId =
  "22222222-2222-4222-8222-222222222222";

describe("Placement evaluation config validation", () => {
  it("accepts stable client-owned round IDs and an empty direct-selection plan", () => {
    expect(
      placementEvaluationConfigInputSchema.parse({
        rounds: [],
      }),
    ).toEqual({ rounds: [] });

    expect(
      placementEvaluationConfigInputSchema.parse({
        rounds: [
          {
            id: firstId,
            kind: "TEST",
            name: "Aptitude test",
            durationMinutes: 60,
          },
        ],
      }).rounds[0],
    ).toMatchObject({
      id: firstId,
      kind: "TEST",
      name: "Aptitude test",
    });
  });

  it("rejects duplicate round IDs so replacement stays deterministic", () => {
    expect(() =>
      placementEvaluationConfigInputSchema.parse({
        rounds: [
          {
            id: firstId,
            kind: "TEST",
            name: "Aptitude test",
          },
          {
            id: firstId,
            kind: "INTERVIEW",
            name: "Technical interview",
          },
        ],
      }),
    ).toThrow();
  });

  it("keeps the canonical round field validation", () => {
    expect(() =>
      placementEvaluationConfigInputSchema.parse({
        rounds: [
          {
            id: secondId,
            kind: "VENDOR_TEST",
            name: "",
            testUrl: "ftp://invalid.example/test",
          },
        ],
      }),
    ).toThrow();
  });
});
