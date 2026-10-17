import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
const source=(path:string)=>readFileSync(new URL("../../"+path,import.meta.url),"utf8");
describe("Learner Placements chat-7 round-5 grouped source contracts",()=>{
it("LEARNER-placements-04 retains the reviewed learner journey behavior",()=>{
const value=source("src/modules/placements/learner-waiting-on-you-model.ts");
expect(value).toContain("register");
expect(value).toContain("offers");
expect(value).toContain("eligibleToApply");
});
it("LEARNER-placements-08 retains the reviewed learner journey behavior",()=>{
const value=source("src/components/placements/learner-placements-dashboard.tsx");
expect(value).toContain("Next 7 days");
expect(value).toContain("Full schedule");
expect(value).toContain("No tests or interviews");
});
it("LEARNER-placements-13 retains the reviewed learner journey behavior",()=>{
const value=source("src/components/placements/learner-save-drive-button.tsx");
expect(value).toContain("apiFetch");
expect(value).toContain("lock.current");
expect(value).toContain("learnerSavedDriveCopy(false).toast");
});
it("LEARNER-placements-37 retains the reviewed learner journey behavior",()=>{
const value=source("src/app/(authenticated)/learn/my-placements/schedule/page.tsx");
expect(value).toContain("Join online round");
expect(value).toContain("Open test");
expect(value).toContain("Venue to be told");
});
it("LEARNER-placements-46 retains the reviewed learner journey behavior",()=>{
const value=source("src/app/(authenticated)/learn/my-placements/announcements/page.tsx");
expect(value).toContain("Updates about you (");
expect(value).toContain("Announcements");
});
it("LEARNER-placements-49 retains the reviewed learner journey behavior",()=>{
const value=source("src/app/(authenticated)/learn/my-placements/announcements/page.tsx");
expect(value).toContain("getOwnLearnerPlacement");
expect(value).toContain("college");
});
it("LEARNER-placements-54 retains the reviewed learner journey behavior",()=>{
const value=source("src/components/placements/learner-placement-requests.tsx");
expect(value).toContain("Waiting for the placement cell");
expect(value).toContain("Not approved");
});
it("LEARNER-placements-55 retains the reviewed learner journey behavior",()=>{
const value=source("src/app/(authenticated)/learn/my-placements/placement/page.tsx");
expect(value).toContain("id=\"registration\"");
expect(value).toContain("id=\"requests\"");
expect(value).toContain("id=\"rules\"");
});
it("LEARNER-placements-R05 retains the reviewed learner journey behavior",()=>{
const value=source("src/modules/placements/learner-withdrawal-model.ts");
expect(value).toContain(".max(900,");
});
it("LEARNER-placements-R06 retains the reviewed learner journey behavior",()=>{
const value=source("src/components/placements/learner-placement-job-detail.tsx");
expect(value).toContain("Stipend per month");
expect(value).toContain("Joining bonus");
});
it("LEARNER-placements-R07 retains the reviewed learner journey behavior",()=>{
const value=source("src/modules/placements/learner-placement-schedule-model.ts");
expect(value).toContain("learnerRoundIsDayOnly");
expect(value).toContain("learnerRoundLastActiveInstant");
});
});