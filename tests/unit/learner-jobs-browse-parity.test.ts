import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

function read(path: string) {
  return readFileSync(new URL(`../../${path}`, import.meta.url), "utf8");
}

describe("Learner Drives browse integration", () => {
  it("keeps server-authorized jobs while filtering only the dedicated Drives route", () => {
    const page = read("src/app/(authenticated)/learn/my-placements/jobs/page.tsx");
    expect(page).toContain("getOwnLearnerDriveBrowse(context)");
    expect(page).toContain("savedJobIds={savedJobs.map(job=>job.jobId)}");
    expect(page).toContain("<LearnerJobsBrowse items={rows.map(toItem)} snapshotNowIso={snapshotNowIso}");
    const home = read("src/app/(authenticated)/learn/my-placements/page.tsx");
    expect(home).toContain("<LearnerPlacementJobs items={items} />");
  });

  it("preserves URL search/back navigation and does not mutate applications on filter", () => {
    const browse = read("src/components/placements/learner-jobs-browse.tsx");
    expect(browse).toContain("readLearnerDriveUrl(params.toString())");
    expect(browse).toContain("popstate");
    expect(browse).toContain("router.push");
    expect(browse).toContain("lastCommittedQuery");
    expect(browse).toContain("PAGE_SIZE = 20");
    expect(browse).toContain("filterLearnerPlacementJobs(matchingItems, filters, Date.parse(snapshotNowIso))");
    expect(browse).toContain("Eligible only");
    expect(browse).toContain("Not open to you");
    expect(browse).toContain("snapshotNowIso={snapshotNowIso}");
  });
});
