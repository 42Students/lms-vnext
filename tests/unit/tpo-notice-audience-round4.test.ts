import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {join} from "node:path";
import {tpoAudiencePreviewQuery} from "@/modules/announcements/tpo-audience-preview-query";
const text=(p:string)=>readFileSync(join(process.cwd(),p),"utf8");
describe("TPO notice audience selection and graceful preview",()=>{
 it("TPO-inbox-team-44 chooses actual college-scoped batch branch and published-drive IDs, not typed UUIDs by default",()=>{
  const service=text("src/modules/announcements/tpo-notice-target-options-service.ts");
  const picker=text("src/components/tpo/tpo-notice-audience-picker.tsx");
  const page=text("src/app/(authenticated)/tpo/announcements/page.tsx");
  expect(service).toContain("eq(departments.collegeId,college.id)");
  expect(service).toContain("eq(placementJobs.collegeId,college.id)");
  expect(service).toContain('eq(placementJobs.status,"PUBLISHED")');
  expect(service).not.toContain('inArray(placementJobs.status,["PUBLISHED","CLOSED"])');
  expect(service).toContain("assertPersistedPlatformPermission");
  expect(picker).toContain("No batch is in placements");
  expect(picker).toContain("No student in placements has a branch yet");
  expect(picker).toContain("No published drive yet");
  expect(page).toContain("<TpoNoticeAudiencePicker");
 });
 it("TPO-inbox-team-45 keeps live preview and zero-recipient guards while using truthful student reach",()=>{
  const page=text("src/app/(authenticated)/tpo/announcements/page.tsx");
  const preview=text("src/components/tpo/tpo-notice-live-preview.tsx");
  expect(preview).toContain('const count=(value as Record<string,unknown>)["potentiallyVisibleMemberships"]');
  expect(preview).toContain("Goes to <strong>{preview.count}");
  expect(preview).toContain("preview.count!==null&&preview.count>0");
  expect(page).toContain("<TpoNoticeLiveAudienceProvider");
  expect(preview).toContain('cache:"no-store"');
  expect(tpoAudiencePreviewQuery.safeParse({audience:"BATCHES"}).success).toBe(false);
 });
 it("GR-71 shows picker-specific empty copy rather than a blank selector",()=>{
  const picker=text("src/components/tpo/tpo-notice-audience-picker.tsx");
  expect(picker).toContain("available.length");
  expect(picker).toContain('role="status"');
 });
 it("GR-73 keeps typed fallback target and offers refresh when preview options fail",()=>{
  const picker=text("src/components/tpo/tpo-notice-audience-picker.tsx");
  expect(picker).toContain('!options?');
  expect(picker).toContain("Options could not load. Refresh to try again.");
  expect(picker).toContain("setTarget(event.target.value)");
 });
 it("GR-90 announces unavailable picker options without exposing a raw error code",()=>{
  const picker=text("src/components/tpo/tpo-notice-audience-picker.tsx");
  expect(picker).toContain('role="status"');
  expect(picker).not.toContain("throw error");
 });
});
