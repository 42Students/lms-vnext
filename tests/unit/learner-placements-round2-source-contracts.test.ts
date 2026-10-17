import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
const source=(path:string)=>readFileSync(new URL("../../"+path,import.meta.url),"utf8");
describe("Chat-7 learner placement verified-closure source contracts",()=>{
  it("LEARNER-placements-06 source behavior or reviewed disposition",()=>{
    const text=source("src/app/(authenticated)/learn/my-placements/page.tsx");
    expect(text).toContain("You are barred from drives for now");
    expect(text).toContain("Think this is wrong? Tell the placement cell");
  });
  it("LEARNER-placements-07 source behavior or reviewed disposition",()=>{
    const text=source("src/components/placements/learner-placement-journey.tsx");
    expect(text).toContain("Where your applications stand");
    expect(text).toContain("applicationStanding(item)");
  });
  it("LEARNER-placements-08 source behavior or reviewed disposition",()=>{
    const text=source("src/components/placements/learner-placements-dashboard.tsx");
    expect(text).toContain("Next 7 days");
    expect(text).toContain("No tests or interviews in the next 7 days");
  });
  it("LEARNER-placements-10 source behavior or reviewed disposition",()=>{
    const text=source("src/components/placements/learner-placements-dashboard.tsx");
    expect(text).toContain("aria-label=\"Placement snapshot\"");
  });
  it("LEARNER-placements-11 source behavior or reviewed disposition",()=>{
    const text=source("src/app/(authenticated)/learn/my-placements/page.tsx");
    expect(text).toContain("Latest from the placement cell");
    expect(text).toContain("No notices yet.");
  });
  it("LEARNER-placements-12 source behavior or reviewed disposition",()=>{
    const text=source("src/components/placements/learner-placement-partial-alert.tsx");
    expect(text).toContain("We could not load your placements");
    expect(text).toContain("Your data is safe. Check your connection and try again.");
    expect(text).toContain("Retry");
  });
  it("LEARNER-placements-14 source behavior or reviewed disposition",()=>{
    const text=source("src/components/placements/learner-jobs-browse.tsx");
    expect(text).toContain("Search by title, company, location…");
    expect(text).toContain("Highest CTC");
    expect(text).toContain("Eligible only");
    expect(text).toContain("Closing in 7 days");
  });
  it("LEARNER-placements-17 source behavior or reviewed disposition",()=>{
    const text=source("src/modules/placements/learner-drives-empty-state-model.ts");
    expect(text).toContain("No open jobs right now");
    expect(text).toContain("New opportunities are added regularly. Check back soon or contact your placement cell.");
  });
  it("LEARNER-placements-18 source behavior or reviewed disposition",()=>{
    const text=source("src/components/placements/learner-jobs-browse.tsx");
    expect(text).toContain("All published drives summary");
  });
  it("LEARNER-placements-19 source behavior or reviewed disposition",()=>{
    const text=source("src/modules/placements/learner-drive-pagination-model.ts");
    expect(text).toContain("pageSize=20");
  });
  it("LEARNER-placements-21 source behavior or reviewed disposition",()=>{
    const text=source("src/components/placements/learner-placement-jobs.tsx");
    expect(text).toContain("Ready to apply?");
    expect(text).toContain("What exactly gets shared?");
    expect(text).toContain("Confirm & apply");
  });
  it("LEARNER-placements-22 source behavior or reviewed disposition",()=>{
    const text=source("src/components/placements/learner-placement-jobs.tsx");
    expect(text).toContain("Apply to this role");
    expect(text).toContain("Withdraw Application");
    expect(text).toContain("3–900 characters");
  });
  it("LEARNER-placements-23 source behavior or reviewed disposition",()=>{
    const text=source("src/modules/placements/learner-withdrawal-model.ts");
    expect(text).toContain(".min(3,");
    expect(text).toContain(".max(900,");
  });
  it("LEARNER-placements-27 source behavior or reviewed disposition",()=>{
    const text=source("src/components/placements/learner-placement-journey.tsx");
    expect(text).toContain("Selection process");
    expect(text).toContain("round.booked?");
  });
  it("LEARNER-placements-29 source behavior or reviewed disposition",()=>{
    const text=source("src/components/placements/learner-applications-browse.tsx");
    expect(text).toContain("learnerWithdrawalMode");
    expect(text).toContain("APPLICATION_WITHDRAWAL");
  });
  it("LEARNER-placements-31 source behavior or reviewed disposition",()=>{
    const text=source("src/components/placements/learner-placement-journey.tsx");
    expect(text).toContain("This drive was cancelled");
  });
  it("LEARNER-placements-32 source behavior or reviewed disposition",()=>{
    const text=source("src/components/placements/learner-applications-browse.tsx");
    expect(text).toContain("label:\"In progress\"");
    expect(text).toContain("label:\"Finished\"");
    expect(text).toContain("placeholder=\"Search company or role\"");
  });
  it("LEARNER-placements-34 source behavior or reviewed disposition",()=>{
    const text=source("src/components/placements/learner-applications-browse.tsx");
    expect(text).toContain("View drive");
    expect(text).toContain("See in schedule");
    expect(text).toContain("What the company sees");
  });
  it("LEARNER-placements-36 source behavior or reviewed disposition",()=>{
    const text=source("src/components/placements/learner-schedule-reschedule.tsx");
    expect(text).toContain("Can't make it? Ask to reschedule");
    expect(text).toContain("Reason (3–900 characters)");
  });
  it("LEARNER-placements-37 source behavior or reviewed disposition",()=>{
    const text=source("src/app/(authenticated)/learn/my-placements/schedule/page.tsx");
    expect(text).toContain("Join online round");
    expect(text).toContain("Take online assessment");
    expect(text).toContain("Venue to be told");
  });
  it("LEARNER-placements-38 source behavior or reviewed disposition",()=>{
    const text=source("src/app/(authenticated)/learn/my-placements/schedule/page.tsx");
    expect(text).toContain("[\"coming\",\"Coming up\"]");
    expect(text).toContain("[\"past\",\"Past\"]");
    expect(text).toContain("[\"calendar\",\"Calendar\"]");
  });
  it("LEARNER-placements-42 source behavior or reviewed disposition",()=>{
    const text=source("src/components/placements/learner-placement-offers.tsx");
    expect(text).toContain("Decline offer");
    expect(text).toContain("Yes, accept");
    expect(text).toContain("Congratulations! You accepted");
  });
  it("LEARNER-placements-44 source behavior or reviewed disposition",()=>{
    const text=source("src/app/(authenticated)/learn/my-placements/offers/page.tsx");
    expect(text).toContain("How offers work at your college");
    expect(text).toContain("Need more time? Send a request to the placement cell");
  });
  it("LEARNER-placements-47 source behavior or reviewed disposition",()=>{
    const text=source("src/app/(authenticated)/learn/my-placements/announcements/page.tsx");
    expect(text).toContain(">Updated</span>");
    expect(text).toContain(">New</span>");
    expect(text).toContain(" · For ");
  });
  it("LEARNER-placements-48 source behavior or reviewed disposition",()=>{
    const text=source("src/modules/placements/learner-notice-empty-label-model.ts");
    expect(text).toContain("No announcements from your placement cell yet.");
  });
  it("LEARNER-placements-56 source behavior or reviewed disposition",()=>{
    const text=source("docs/audit/owner-decisions-resolved.md");
    expect(text).toContain("Keep concrete time and mode on learner placement requests");
  });
  it("LEARNER-placements-57 source behavior or reviewed disposition",()=>{
    const text=source("src/app/(authenticated)/learn/my-placements/schedule/page.tsx");
    expect(text).toContain("LearnerCareerCalendar");
  });
  it("LEARNER-placements-58 source behavior or reviewed disposition",()=>{
    const text=source("docs/audit/pages/learner/placements-review.md");
    expect(text).toContain("no learner UI");
  });
  it("LEARNER-placements-R02 source behavior or reviewed disposition",()=>{
    const text=source("src/components/placements/learner-placement-offers.tsx");
    expect(text).toContain("/accept-preview");
    expect(text).toContain("What accepting this offer changes");
    expect(text).toContain("Other offers declined");
    expect(text).toContain("You stay in");
  });
  it("LEARNER-placements-R05 source behavior or reviewed disposition",()=>{
    const text=source("src/components/placements/learner-applications-browse.tsx");
    expect(text).toContain("learnerWithdrawalMode");
    expect(text).toContain("withdrawReason.trim()");
  });
  it("LEARNER-placements-R06 source behavior or reviewed disposition",()=>{
    const text=source("src/components/placements/learner-placement-job-detail.tsx");
    expect(text).toContain("learnerDrivePayFacts");
    expect(text).toContain("Stipend per month");
    expect(text).toContain("Joining bonus");
  });
  it("LEARNER-placements-R07 source behavior or reviewed disposition",()=>{
    const text=source("src/modules/placements/learner-placement-schedule-model.ts");
    expect(text).toContain("learnerRoundIsDayOnly");
    expect(text).toContain("learnerRoundLastActiveInstant");
  });
});
