import {
  describe,
  expect,
  it,
} from "vitest";
import {
  createPlacementApplicationInputSchema,
  createPlacementJobInputSchema,
} from "@/modules/placements/validation";

describe("Placement application validation", () => {
  it("keeps channel optional at the request boundary and defaults external confirmation safely", () => {
    expect(
      createPlacementApplicationInputSchema.parse({}),
    ).toEqual({
      externalConfirmation: false,
    });

    expect(
      createPlacementApplicationInputSchema.parse({
        channel: "EXTERNAL",
        externalConfirmation: true,
      }),
    ).toEqual({
      channel: "EXTERNAL",
      externalConfirmation: true,
    });
  });

  it("requires an external URL for hybrid and external-only jobs", () => {
    const common = {
      collegeId:
        "20000000-0000-4000-8000-000000000001",
      companyRelationshipId:
        "60000000-0000-4000-8000-000000000001",
      title: "Software Engineer",
      description: "Role description",
      employmentType: "FULL_TIME" as const,
      workMode: "HYBRID" as const,
    };

    expect(() =>
      createPlacementJobInputSchema.parse({
        ...common,
        applicationMode: "HYBRID",
      }),
    ).toThrow();

    expect(() =>
      createPlacementJobInputSchema.parse({
        ...common,
        applicationMode: "EXTERNAL_ONLY",
      }),
    ).toThrow();

    expect(
      createPlacementJobInputSchema.parse({
        ...common,
        applicationMode: "HYBRID",
        externalApplicationUrl:
          "https://jobs.example/apply",
      }).externalApplicationUrl,
    ).toBe("https://jobs.example/apply");
  });
});
