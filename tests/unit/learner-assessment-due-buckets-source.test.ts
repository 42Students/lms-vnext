import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const read = (path: string) =>
  readFileSync(new URL("../../" + path, import.meta.url), "utf8");

describe("Learner assessment due bucket page wiring", () => {
  it("keeps canonical Assessments page authorized and mobile-friendly", () => {
    const page = read("src/app/(authenticated)/learn/my-placements/assessments/page.tsx");
    const service = read("src/modules/placements/learner-assessment-browse-service.ts");
    const ui = read("src/components/placements/learner-career-rounds-workspace.tsx");
    expect(page).toContain("getOwnLearnerAssessmentBrowse(context)");
    expect(page).toContain('kind="ASSESSMENT"');
    expect(service).toContain("requireLearnerPlacementAccess(context)");
    expect(service).toContain('requirePermission(context, "placements.read"');
    expect(ui).toContain("Assessment due buckets");
    expect(ui).toContain("Due today");
    expect(ui).toContain("Due this week");
    expect(ui).toContain("Scheduled time passed");
    expect(ui).toContain("Awaiting employer schedule");
    expect(ui).toContain("learnerAssessmentDueBucketSchema.safeParse");
    expect(ui).toContain("visibleRows.length === 0");
    expect(ui).toContain("md:grid-cols-3");
  });
  it("does not conflate failures with no assessments", () => {
    const loading = read("src/app/(authenticated)/learn/my-placements/assessments/loading.tsx");
    const error = read("src/app/(authenticated)/learn/my-placements/assessments/error.tsx");
    expect(loading).toContain("Loading");
    expect(error).toContain("Retry");
    expect(error).toContain("not proof that you have no assessments");
  });
});
