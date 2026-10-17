import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";
import {tpoDriveTabs,tpoDriveTabHref} from "@/modules/placements/tpo-drive-tab-model";
const code=(path:string)=>readFileSync(path,"utf8");
const id="11111111-1111-4111-8111-111111111111";
describe("TPO drive discussion parity",()=>{
 it("TPO-drive-workspace-59 provides real Discussion navigation and scoped message data",()=>{
  expect(tpoDriveTabs(id).some(tab=>tab.label==="Discussion"&&tab.href.endsWith("/discussion"))).toBe(true);
  expect(tpoDriveTabHref(id,"discussion")).toContain("/discussion");
  const reader=code("src/modules/placements/tpo-drive-discussion-service.ts");
  expect(reader).toContain("eq(placementTpoMessageThreads.collegeId,collegeId)");
  expect(reader).toContain("eq(placementTpoMessageThreads.jobId,jobId)");
  expect(reader).toContain("requirePlacementManageScope(context,collegeId)");
  const page=code("src/app/(authenticated)/tpo/placements/jobs/[jobId]/discussion/page.tsx");
  expect(page).toContain("Recruiter conversations");
  expect(page).toContain('"/tpo/messages/"+encodeURIComponent(thread.id)');
 });
 it("TPO-drive-workspace-64 keeps recruiter follow-up accessible after closing a drive",()=>{
  const reader=code("src/modules/placements/tpo-drive-discussion-service.ts");
  expect(reader).not.toContain('eq(placementJobs.status,"PUBLISHED")');
  const page=code("src/app/(authenticated)/tpo/placements/jobs/[jobId]/discussion/page.tsx");
  expect(page).toContain("Open conversation");
  expect(page).toContain("Recruiter Messages");
 });
 it("GR-71 shows a plain unavailable state without hiding the rest of the drive",()=>{
  const page=code("src/app/(authenticated)/tpo/placements/jobs/[jobId]/discussion/page.tsx");
  expect(page).toContain("Other drive work is still available");
  expect(page).toContain("No recruiter conversation is attached");
 });
 it("GR-90 and GR-91 keep the Discussion list navigable without a fragile modal",()=>{
  const page=code("src/app/(authenticated)/tpo/placements/jobs/[jobId]/discussion/page.tsx");
  expect(page).toContain('aria-label="Recruiter conversations"');
  expect(page).toContain("min-h-10");
  expect(page).toContain('role="status"');
 });
});
