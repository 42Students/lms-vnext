import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

function source(path: string) {
  return readFileSync(new URL(`../../${path}`, import.meta.url), "utf8");
}

describe("Learner placement dashboard route wiring", () => {
  it("feeds the dashboard from authorized real jobs, journeys and rounds", () => {
    const page = source("src/app/(authenticated)/learn/my-placements/page.tsx");
    expect(page).toContain("learnerPlacementDashboard({");
    expect(page).toContain("(rows ?? []).map((row)");
    expect(page).toContain("Promise.allSettled");
    expect(page).toContain("AuthorizationError");
    expect(page).toContain("journeyRows.map((row)");
    expect(page).toContain("(requestWorkspace?.rounds ?? []).map((row)");
    expect(page).toContain("row.exception.scheduledAt");
    expect(page).toContain("<LearnerPlacementsDashboard snapshot={dashboard} availability={availability}");
  });

  it("shows separate scheduled/attention and empty/error loading states", () => {
    const dash = source("src/components/placements/learner-placements-dashboard.tsx");
    expect(dash).toContain("Placement snapshot");
    expect(dash).toContain("Needs attention");
    expect(dash).toContain("Next 7 days");
    expect(dash).toContain("Browse drives");
    expect(source("src/app/(authenticated)/learn/my-placements/error.tsx"))
      .toContain("This is a loading problem");
    expect(source("src/app/(authenticated)/learn/my-placements/loading.tsx"))
      .toContain("aria-busy");
  });
});
