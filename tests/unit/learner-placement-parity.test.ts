import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const pages = [
  ["assessments", "LearnerCareerRoundsWorkspace"],
  ["interviews", 'redirect("/learn/my-placements/schedule"'],
  ["calendar", 'redirect("/learn/my-placements/schedule?"'],
  ["placement", "LearnerPlacementOffers"],
  ["rules", "How eligibility works"],
] as const;

describe("learner placement route parity", () => {
  it("keeps every old learner placement sub-route materialized with real content", () => {
    for (const [route, marker] of pages) {
      const content = fs.readFileSync(
        path.join(process.cwd(), `src/app/(authenticated)/learn/my-placements/${route}/page.tsx`),
        "utf8",
      );
      expect(content).toContain(marker);
      expect(content).not.toContain('className="min-h-56 rounded-xl border border-border bg-surface"');
      if(route==="calendar")expect(content).toContain('new URLSearchParams({view:"calendar"})');
    }
  });

  it("keeps the old placement tab names and routes", () => {
    const tabs = fs.readFileSync(
      path.join(process.cwd(), "src/components/placements/learner-placements-tabs.tsx"),
      "utf8",
    );
    for (const label of ["Home", "Drives", "Applications", "Schedule", "Offers", "Notices", "Placement cell"]) {
      expect(tabs).toContain(label);
    }
  });
});
