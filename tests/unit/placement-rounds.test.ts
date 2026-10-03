import {
  describe,
  expect,
  it,
} from "vitest";
import { placementRoundActionInputSchema } from "@/modules/placements/validation";

describe("Placement round validation", () => {
  it("requires time-safe virtual scheduling", () => {
    const scheduledAt =
      "2026-10-20T04:30:00.000Z";

    expect(() =>
      placementRoundActionInputSchema.parse({
        action: "SCHEDULE",
        scheduledAt,
        timezone: "Not/A_Timezone",
        mode: "VIRTUAL",
        meetingUrl:
          "https://meet.example/round",
      }),
    ).toThrow();

    expect(() =>
      placementRoundActionInputSchema.parse({
        action: "SCHEDULE",
        scheduledAt,
        timezone: "Asia/Kolkata",
        mode: "VIRTUAL",
      }),
    ).toThrow();

    expect(
      placementRoundActionInputSchema.parse({
        action: "SCHEDULE",
        scheduledAt,
        timezone: "Asia/Kolkata",
        mode: "VIRTUAL",
        meetingUrl:
          "https://meet.example/round",
      }).timezone,
    ).toBe("Asia/Kolkata");
  });

  it("requires a venue on campus and keeps result deadlines ordered", () => {
    expect(() =>
      placementRoundActionInputSchema.parse({
        action: "SCHEDULE",
        scheduledAt:
          "2026-10-20T04:30:00.000Z",
        timezone: "Asia/Kolkata",
        mode: "ON_CAMPUS",
      }),
    ).toThrow();

    expect(() =>
      placementRoundActionInputSchema.parse({
        action: "SCHEDULE",
        scheduledAt:
          "2026-10-20T04:30:00.000Z",
        timezone: "Asia/Kolkata",
        mode: "ON_CAMPUS",
        venue: "Seminar Hall",
        resultsDueAt:
          "2026-10-20T03:30:00.000Z",
      }),
    ).toThrow();
  });

  it("requires a reason to cancel a round", () => {
    expect(() =>
      placementRoundActionInputSchema.parse({
        action: "CANCEL",
      }),
    ).toThrow();

    expect(
      placementRoundActionInputSchema.parse({
        action: "CANCEL",
        reason: "Recruiter removed the round",
      }),
    ).toMatchObject({
      action: "CANCEL",
    });
  });
});
