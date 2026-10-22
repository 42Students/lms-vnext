import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

function read(path: string) {
  return readFileSync(new URL(`../../${path}`, import.meta.url), "utf8");
}

describe("Learner Applications list and detail route", () => {
  it("preserves tenant-scoped journey data and explicit details deep link", () => {
    const page = read("src/app/(authenticated)/learn/my-placements/applications/page.tsx");
    expect(page).toContain("getLearnerPlacementJourney(context)");
    expect(page).toMatch(/<LearnerApplicationsBrowse items={items} interviewLinks={interviewLinks} assessmentLinks={assessmentLinks}/);
    expect(page).toContain("getLearnerPlacementRequestWorkspace(context)");

    const cards = read("src/components/placements/learner-placement-journey.tsx");
    expect(cards).toContain("View application details");
    expect(cards).toContain("encodeURIComponent(item.applicationId)");
  });
  it("supports shareable filters and an application-id detail drawer", () => {
    const browse = read("src/components/placements/learner-applications-browse.tsx");
    expect(browse).toContain("popstate");
    expect(browse).toContain("PAGE_SIZE = 20");
    expect(browse).toContain("browseLearnerApplications(items, filters)");
    expect(browse).toContain("item.applicationId===url.applicationId");
    expect(browse).toContain("readLearnerApplicationUrl(params.toString())");
    expect(browse).toContain("router.push");
    expect(browse).toContain("learnerApplicationMobileSummary(filters)");
    expect(browse).toContain("<Drawer open={selected!==null}");
    expect(browse).toContain("Round history");
    expect(browse).toContain("learnerApplicationAttention(items)");
    expect(browse).toContain("Application screening updates");
    expect(browse).toContain("learnerApplicationStageCounts(items)");
    expect(browse).toContain("Screening stage filter chips");
    expect(browse).toContain("selectedInterview?.href");
    expect(browse).toContain("selectedAssessment?.href");
  });
});
