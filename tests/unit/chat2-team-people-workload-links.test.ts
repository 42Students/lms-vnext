import {readFileSync} from "node:fs";
import {describe,it,expect} from "vitest";
const source=(p:string)=>readFileSync(p,"utf8");
describe("Team People persisted workload destinations",()=>{
 it("TPO-inbox-team-31 links each of five real workload categories to tenant-scoped list pages",()=>{
  const page=source("src/app/(authenticated)/tpo/team/page.tsx");
  for(const item of ['["Live drives",member.liveDrives,"/tpo/placements"]',
   '["Draft drives",member.draftDrives,"/tpo/placements"]',
   '["Companies",member.companies,"/tpo/recruiters?view=companies"]',
   '["Overdue follow-ups",member.overdueFollowups,"/tpo/recruiters?due=1"]',
   '["Waiting on teammates",member.waitingOnOthers,"/tpo/team?tab=conversations&filter=ASKS"]'
  ])expect(page).toContain(item);
  expect(page).toContain('label.includes("drives")&&!ownerWorkload.drivesReady?"Unavailable"');
  expect(page).toContain("ownerWorkload?.ready");
  expect(page).toContain("readTpoTeamOwnershipWorkload(context)");
 });
});