import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

const read = (path: string) => readFileSync(path, "utf8");

describe("Chat-6 learner profile intentional safety enhancements", () => {
  it("LEARNER-profile-misc-08 NOT-A-GAP preserves explicit profile/identity verification separation and approved helpful sections", () => {
    const decisions = read("docs/audit/owner-decisions-resolved.md");
    const audit = read("docs/audit/pages/learner/profile-misc.md");
    const page = read("src/app/(authenticated)/learn/profile/page.tsx");
    const workspace = read("src/components/profile/learner-profile-workspace.tsx");
    expect(decisions).toContain("OD-38");
    expect(audit).toContain("career-coverage checklist");
    expect(page).toContain("Academic identity");
    expect(page).toContain("Education and identity verification");
    expect(page).toContain("Saved profile details are not verification.");
    expect(workspace).toContain("Sensitive identity information is optional");
    expect(workspace).toContain("Saved profile data refreshes when you return to this tab.");
  });
});
