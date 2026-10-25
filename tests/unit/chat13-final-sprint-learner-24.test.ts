import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
const source=(p:string)=>readFileSync(p,"utf8");
describe("LEARNER-placements-24 cancelled/closed drive history",()=>{
 it("LEARNER-placements-24 preserves own historical applied drives instead of returning notFound",()=>{
  const route=source("src/app/(authenticated)/learn/my-placements/jobs/[jobId]/page.tsx");
  expect(route).toContain("getOwnLearnerDriveJourney(context,jobId)");
  expect(route).toContain("if(rows.length===0&&!journey)return");
  expect(route).toMatch(/<EmptyState\s+title="This drive can't be shown"/);
  expect(route).toContain("<LearnerOwnDriveJourney journey={journey}/>");
 });
 it("LEARNER-placements-24 protects historical application rows by current persisted learner membership and college",()=>{
  const code=source("src/modules/placements/learner-historical-drive-service.ts");
  expect(code).toContain("requireLearnerPlacementAccess(context)");
  expect(code).toContain("eq(placementApplications.membershipId,member.id)");
  expect(code).toContain("eq(placementJobs.collegeId,member.collegeId)");
  expect(code).toContain('eq(activityEvents.eventType,"PLACEMENTS_TPO_DRIVE_CANCELLED")');
  expect(code).toContain("orderBy(asc(placementJobRounds.sequence))");
 });
 it("LEARNER-placements-24 shows the learner selection track and cancellation reason without inventing results",()=>{
  const ui=source("src/components/placements/learner-own-drive-journey.tsx");
  for(const heading of ["Your progress","Selection process","This drive was cancelled","This drive is closed","View my application"])
   expect(ui).toContain(heading);
  expect(ui).not.toContain("You passed this round");
 });
});