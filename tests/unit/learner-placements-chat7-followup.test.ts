import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

function source(path: string): string {
  return readFileSync(new URL("../../" + path, import.meta.url), "utf8");
}

describe("Chat-7 learner placements follow-up", () => {
  it("LEARNER-placements-54 request error safety and legacy-facing labels", () => {
    const requests = source("src/components/placements/learner-placement-requests.tsx");
    expect(requests).toContain("await apiFetch(url");
    expect(requests).not.toContain("PLACEMENT_REQUEST_FAILED");
    expect(requests).not.toContain("humanize(error.message)");
    expect(requests).toContain("New request");
    expect(requests).toContain('aria-label="What do you need?"');
    expect(requests).toContain("Tell the placement cell why");
    expect(requests).toContain("Sent to the placement cell");
  });

  it("LEARNER-placements-04 never masks missing actionable tasks", () => {
    const dashboard = source("src/components/placements/learner-placements-dashboard.tsx");
    const model = source("src/modules/placements/learner-waiting-on-you-model.ts");
    expect(dashboard).toContain('aria-label="Waiting on you"');
    expect(dashboard).toContain("learnerWaitingOnYou({");
    expect(model).toContain('key:"offers"');
    expect(model).toContain('key:"register"');
    expect(model).toContain('key:"apply"');
  });

  it("LEARNER-placements-33 retains vNext application summary as intentional design", () => {
    const page = source("src/app/(authenticated)/learn/my-placements/applications/page.tsx");
    expect(page).toContain("recorded applications");
    expect(page).toContain("still submitted");
    expect(page).toContain("withdrawn");
    const decisions = source("docs/audit/owner-decisions-resolved.md");
    expect(decisions).toContain('All "intentional differences" lists approved');
  });
});
