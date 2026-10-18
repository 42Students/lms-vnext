import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";
import {tpoStudentNoticesOverview} from "@/modules/placements/tpo-student-notices-overview-model";

describe("TPO-settings-audit-NOTICES-04 college notice settings counts",()=>{
 it("distinguishes 0, exact counts, truncated pages and absent storage",()=>{
  expect(tpoStudentNoticesOverview({announcementsReady:true,noticeCount:0,prepReady:false}).publishedSummary)
   .toBe("0 recorded college notices");
  expect(tpoStudentNoticesOverview({announcementsReady:true,noticeCount:4,prepReady:true}).publishedSummary)
   .toBe("4 recorded college notices");
  expect(tpoStudentNoticesOverview({
   announcementsReady:true,noticeCount:100,prepReady:true,hasMore:true,
  }).publishedSummary).toBe("At least 101 recorded college notices");
  expect(tpoStudentNoticesOverview({
   announcementsReady:false,noticeCount:100,prepReady:true,hasMore:true,
  }).publishedSummary).toBe("College notices unavailable");
  expect(tpoStudentNoticesOverview({announcementsReady:true,noticeCount:-5,prepReady:true}).publishedSummary)
   .toBe("0 recorded college notices");
 });
 it("reads college-targeted notices rather than only the signed-in TPO's authored rows",()=>{
  const page=readFileSync("src/app/(authenticated)/tpo/settings/notices/page.tsx","utf8");
  const source=readFileSync("src/modules/announcements/tpo-placement-read-service.ts","utf8");
  expect(page).toContain('listTpoPlacementAnnouncements(ctx,"yours",new Date(),1,"COLLEGE")');
  expect(page).toContain('announcements.status==="READY"&&announcements.hasMore');
  expect(page).toContain("not confirmed individual delivery or read receipts");
  expect(source).toContain('scope:"MINE"|"COLLEGE"="MINE"');
  expect(source).toContain('tab!=="from-42"&&scope==="MINE"');
  expect(source).toContain(".limit(101).offset((safePage-1)*100)");
  expect(source).toContain("collegeId:college.id");
 });
});
