import {
  describe,
  expect,
  it,
} from "vitest";
import {
  formatTpoEligibilityThreshold,
  orderTpoSettingsSeasons,
  summarizeTpoSettingsSeasons,
  tpoSettingOrigin,
  TPO_FIXED_PLACEMENT_RULE_NOTES,
} from "@/modules/placements/tpo-settings-model";

const seasons = [
  {
    id: "older",
    name: "2024",
    code: "2024",
    startDate: "2024-01-01",
    endDate: "2024-12-31",
    status: "CLOSED",
    closedAt: null,
  },
  {
    id: "active",
    name: "2026",
    code: "2026",
    startDate: "2026-01-01",
    endDate: "2026-12-31",
    status: "ACTIVE",
    closedAt: null,
  },
  {
    id: "recent",
    name: "2025",
    code: "2025",
    startDate: "2025-01-01",
    endDate: "2025-12-31",
    status: "CLOSED",
    closedAt: null,
  },
] as const;

describe("TPO placement season presentation", () => {
  it("shows the active season first, then recent past seasons", () => {
    expect(
      orderTpoSettingsSeasons(seasons).map(
        (season) => season.id,
      ),
    ).toEqual([
      "active",
      "recent",
      "older",
    ]);
  });

  it("does not mutate the incoming seasons", () => {
    const original = [...seasons];

    orderTpoSettingsSeasons(seasons);

    expect(seasons).toEqual(original);
  });

  it("counts only actual persisted statuses", () => {
    expect(
      summarizeTpoSettingsSeasons(seasons),
    ).toEqual({
      total: 3,
      active: 1,
      closed: 2,
    });
  });

  it("does not infer an active season from dates", () => {
    expect(
      summarizeTpoSettingsSeasons([
        {
          status: "CLOSED",
        },
      ]),
    ).toEqual({
      total: 1,
      active: 0,
      closed: 1,
    });
  });
});

describe("TPO placement rule sources", () => {
  it("distinguishes a persisted row from a source fallback", () => {
    expect(
      tpoSettingOrigin(null),
    ).toBe("SOURCE_DEFAULT");

    expect(
      tpoSettingOrigin(undefined),
    ).toBe("SOURCE_DEFAULT");

    expect(
      tpoSettingOrigin(
        new Date("2026-10-14T00:00:00Z"),
      ),
    ).toBe("PERSISTED");
  });

  it("converts scaled stored thresholds without manufacturing a minimum", () => {
    expect(
      formatTpoEligibilityThreshold(825),
    ).toBe("8.25");

    expect(
      formatTpoEligibilityThreshold(6500),
    ).toBe("65.00");

    expect(
      formatTpoEligibilityThreshold(null),
    ).toBe("No minimum");
  });

  it("explains the source-configured participation rules", () => {
    const titles =
      TPO_FIXED_PLACEMENT_RULE_NOTES.map(
        (rule) => rule.title,
      );

    expect(titles).toContain(
      "Placement participation precedence",
    );
    expect(titles).toContain(
      "Missing job eligibility evidence",
    );
    expect(titles).toContain(
      "Registration window",
    );
  });
});
