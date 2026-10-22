import {describe,it,expect} from "vitest";
import {relativeHrBellTime,HR_BELL_EMPTY,HR_BELL_EMPTY_HELP} from "@/modules/placements/hr-recruiter-bell-model";
import {readFileSync} from "node:fs";
describe("REC-calendar-messages-profile-21 recruiter notification bell",()=>{
 it("shows relative time and correct empty copy",()=>{
  const now=new Date("2026-10-16T12:00:00Z").getTime();
  expect(relativeHrBellTime("2026-10-16T11:58:00Z",now)).toBe("2m ago");
  expect(HR_BELL_EMPTY).toBe("Nothing yet");
  expect(HR_BELL_EMPTY_HELP).toContain("Replies and drive decisions");
 });
 it("polls every 30 s, and scopes mark-read to caller and employer grants",()=>{
  const bell=readFileSync(new URL("../../src/components/hr/hr-recruiter-bell.tsx",import.meta.url),"utf8");
  const svc=readFileSync(new URL("../../src/modules/placements/hr-recruiter-bell-service.ts",import.meta.url),"utf8");
  expect(bell).toContain("30000");
  expect(bell).toContain("setNow(Date.now())");
  expect(bell).toContain('<Skeleton label="Loading recruiter notifications"');
  expect(bell).toContain('document.visibilityState==="visible"');
  expect(bell).toContain('Mark all read');
  expect(svc).toContain("eq(inAppNotifications.userId,ctx.user.id)");
  // The explicit college selector is mandatory for a scoped recruiter bell.
  expect(svc).toContain("listOwnRecruiterPlacementJobs(ctx,feed.collegeId)");
  expect(svc).toContain("x.companyId===ctx.recruiter!.companyId && x.collegeId===feed.collegeId");
 });
});
