import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

function read(path: string) {
  return readFileSync(new URL(`../../${path}`, import.meta.url), "utf8");
}
describe("Learner published placement Job Detail", () => {
  it("does not disclose unpublished/other-college jobs on arbitrary job IDs", () => {
    const page = read("src/app/(authenticated)/learn/my-placements/jobs/[jobId]/page.tsx");
    expect(page).toContain("listLearnerPlacementJobs(context)");
    expect(page).toContain("row.job.id===jobId");
    expect(page).toContain("notFound()");
    expect(page).toContain("initialSaved={savedJobs.some(row=>row.jobId===jobId)}");
    // Own historical applications remain readable after a drive is closed or
    // cancelled; an arbitrary unowned unpublished job still returns not-found.
    expect(page).toContain("getOwnLearnerDriveJourney(context,jobId)");
    expect(page).toContain("if(rows.length===0&&!journey)notFound()");
    expect(page).toContain("<LearnerPlacementJobDetail items={rows.map(toItem)}");
    expect(page).toContain("returnHref={back} initialSaved={savedJobs.some(row=>row.jobId===jobId)}");
    const historical=read("src/modules/placements/learner-historical-drive-service.ts");
    expect(historical).toContain("requireLearnerPlacementAccess(context)");
    expect(historical).toContain("eq(placementJobs.collegeId,member.collegeId)");
    expect(historical).toContain("eq(placementApplications.membershipId,member.id)");
  });
  it("uses a dedicated detail instead of generic uncontextualized cards", () => {
    const source = read("src/components/placements/learner-placement-job-detail.tsx");
    expect(source).toContain("Placement breadcrumbs");
    expect(source).toContain("Eligibility breakdown");
    expect(source).toContain("check.actual");
    expect(source).toContain("check.required");
    expect(source).toContain("LearnerPlacementJobs items={items} savedJobIds={initialSaved?[item.job.id]:[]}");
    expect(source).toContain("learnerJobAvailabilityBanner(items)");
    expect(source).toContain("Application availability");
    const cards = read("src/components/placements/learner-placement-jobs.tsx");
    const hrefs = read("src/modules/placements/learner-drives-return-model.ts");
    expect(hrefs).toContain("/learn/my-placements/jobs/");
    expect(cards).toContain("learnerJobDetailFromDrivesHref(item.job.id,returnQuery)");
  });
  it("preserves existing application API actions but guards employer URLs", () => {
    const source = read("src/components/placements/learner-placement-jobs.tsx");
    expect(source).toContain("safeLearnerPlacementUrl(job.externalApplicationUrl)");
    expect(source).toContain("rel=\"noopener noreferrer\"");
    expect(source).toContain("/api/placements/jobs/");
    expect(source).toContain('requestType:');
  });
  it("distinguishes loading/failure from not-found and allows retry", () => {
    expect(read("src/app/(authenticated)/learn/my-placements/jobs/[jobId]/loading.tsx"))
      .toContain('aria-busy="true"');
    expect(read("src/app/(authenticated)/learn/my-placements/jobs/[jobId]/error.tsx"))
      .toContain("reset");
  });
});
