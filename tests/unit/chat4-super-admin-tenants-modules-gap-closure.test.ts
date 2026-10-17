import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {join} from "node:path";
import {superAdminCollegeBroadcastSchema} from "@/modules/announcements/super-admin-college-broadcast-model";
const source=(p:string)=>readFileSync(join(process.cwd(),p),"utf8");

describe("chat-4 Super Admin Tenants and Modules verified source contracts",()=>{
 it("SA-tenants-modules-41 preserves the audited admin workflow",()=>{
  const s=source("src/app/(authenticated)/activity/page.tsx");
  expect(s).toContain("name:\"Important\"");
  expect(s).toContain("name:\"Academic setup\"");
  expect(s).toContain("name:\"People & access\"");
  expect(s).toContain("name:\"Teaching\"");
  expect(s).toContain("name:\"Projects\"");
  expect(s).toContain("name:\"Everything\"");
 });
 it("SA-tenants-modules-42 preserves the audited admin workflow",()=>{
  const s=source("src/app/(authenticated)/activity/page.tsx");
  expect(s).toContain("label:\"Today\"");
  expect(s).toContain("label:\"7 days\"");
  expect(s).toContain("label:\"30 days\"");
  expect(s).toContain("label:\"All time\"");
  expect(s).toContain("defaultFrom");
 });
 it("SA-tenants-modules-51 preserves the audited admin workflow",()=>{
  const s=source("src/components/admin/inbound-mail-list.tsx");
  expect(s).toContain("Mark done");
  expect(s).toContain("Move back to To read");
  expect(s).toContain("/api/admin/inbound-mail/status");
 });
 it("SA-tenants-modules-52 preserves the audited admin workflow",()=>{
  const s=source("src/app/(authenticated)/admin/inbound-mail/page.tsx");
  expect(s).toContain("label:\"To read\"");
  expect(s).toContain("label:\"Done\"");
  expect(s).toContain("label:\"All\"");
  expect(s).toContain("toReadCount");
 });
 it("SA-tenants-modules-55 preserves the audited admin workflow",()=>{
  const s=source("src/modules/inbound-mail/admin-service.ts");
  expect(s).toContain("isSuperAdmin(context)");
  expect(s).toContain("admin-scope.select");
  expect(s).not.toContain("context.adminScope?.collegeId");
 });
 it("SA-tenants-modules-56 preserves the audited admin workflow",()=>{
  const s=source("src/modules/inbound-mail/admin-service.ts");
  expect(s).toContain("ilike(t.bodyPlain,pattern)");
  expect(s).toContain(".limit(51)");
  expect(s).toContain(".offset((input.page-1)*50)");
 });
 it("SA-tenants-modules-58 preserves the audited admin workflow",()=>{
  const s=source("src/components/announcements/super-admin-college-broadcast-form.tsx");
  expect(s).toContain("Button (optional)");
  expect(s).toContain("buttonLabel");
  expect(s).toContain("buttonUrl");
  expect(s).toContain("maxLength={60}");
  expect(s).toContain("maxLength={500}");
 });
 it("SA-tenants-modules-59 preserves the audited admin workflow",()=>{
  const s=source("src/app/(authenticated)/admin/announcements/page.tsx");
  expect(s).toContain("getSuperAdminBroadcastReceiptCounts");
  expect(s).toContain("Placement-cell read receipts");
  expect(s).toContain("<progress");
  expect(s).toContain("receipt.cellRead");
 });
 it("SA-tenants-modules-61 preserves the audited admin workflow",()=>{
  const s=source("src/modules/announcements/super-admin-college-broadcast-model.ts");
  expect(s).toContain(".max(200)");
  expect(s).toContain(".max(8000)");
  expect(s).toContain(".max(60)");
  expect(s).toContain(".max(500)");
  const values={audienceMode:"ALL_COLLEGES",collegeIds:[],title:"T",message:"M",
   scheduledAt:null,expiresAt:null,isPinned:false,publishConsent:true};
  expect(superAdminCollegeBroadcastSchema.safeParse(values).success).toBe(true);
  expect(superAdminCollegeBroadcastSchema.safeParse({...values,title:"T".repeat(201)}).success).toBe(false);
  expect(superAdminCollegeBroadcastSchema.safeParse({...values,message:"M".repeat(8001)}).success).toBe(false);
 });
 it("SA-tenants-modules-62 preserves the audited admin workflow",()=>{
  const s=source("src/modules/announcements/super-admin-college-broadcast-service.ts");
  expect(s).toContain("deliverInAppNotificationInTransaction");
  expect(s).toContain("From 42: ");
 });
 it("SA-tenants-modules-63 preserves the audited admin workflow",()=>{
  const s=source("src/app/(authenticated)/admin/colleges/[collegeId]/verification/page.tsx");
  expect(s).toContain("TpoVerificationSwitch");
  expect(s).toContain("tpoCanVerifyProfiles");
 });
 it("SA-tenants-modules-65 preserves the audited admin workflow",()=>{
  const s=source("src/components/verification/SuperAdminVerificationPanel.tsx");
  expect(s).toContain("Verify without opening");
  expect(s).toContain("Send back");
  expect(s).toContain("/api/admin/verification/bulk-review");
  expect(s).toContain("acknowledged");
 });
 it("SA-tenants-modules-66 preserves the audited admin workflow",()=>{
  const s=source("src/components/verification/SuperAdminVerificationPanel.tsx");
  expect(s).toContain("Review one by one");
  expect(s).toContain("setSequence");
  expect(s).toContain("setSequenceIndex");
  expect(s).toContain("nextInSequence");
 });
 it("SA-tenants-modules-67 presents exact section-specific verification reasons and success copy",async()=>{
  const {tpoVerificationSectionReasons}=await import("@/modules/verification/review-reasons");
  expect(tpoVerificationSectionReasons("EDUCATION")).toEqual([
   "The marksheet is unclear or cropped","The marks do not match the marksheet","A marksheet is missing",
  ]);
  expect(tpoVerificationSectionReasons("IDENTITY")).toEqual([
   "The document does not match the number","Wrong document uploaded","The document is unclear or cropped",
  ]);
  const drawer=source("src/components/verification/VerificationReviewDrawer.tsx");
  expect(drawer).toContain("tpoVerificationSectionReasons(row.section)");
  expect(drawer).toContain('apiBase==="/api/admin/verification"');
  expect(drawer).toContain('"Send "+(row.section==="EDUCATION"?"Education":"Identity")+" back"');
  expect(drawer).toContain("The student sees your reason and fixes it on their profile.");
  for(const panelPath of [
   "src/components/verification/TpoVerificationPanel.tsx",
   "src/components/verification/SuperAdminVerificationPanel.tsx",
  ]){
   const panel=source(panelPath);
   expect(panel).toContain("Education");
   expect(panel).toContain(" verified. The student has been told.");
   expect(panel).toContain("Sent back. The student sees your reason.");
  }
 });
 it("SA-tenants-modules-43 shows actor sentences and sanitized event details",async()=>{
  const {activityEventSentence}=await import("@/components/activity/activity-center");
  expect(activityEventSentence({eventType:"academics.batch.promoted",subjectType:"cohort",subjectLabel:"Cohort 2027"},
    {displayName:"Ananya",email:null})).toBe("Ananya promoted cohort Cohort 2027");
  const center=source("src/components/activity/activity-center.tsx");
  expect(center).toContain("Object.entries(item.event.metadata)");
  expect(center).toContain('"Today"');
  expect(center).toContain('"Yesterday"');
  expect(source("src/app/(authenticated)/activity/page.tsx")).toContain("sanitizeActivityMetadata(group.latest.event.metadata)");
 });
 it("SA-tenants-modules-45 shows 50 events with older matching count",()=>{
  expect(source("src/app/(authenticated)/activity/page.tsx")).toContain("limit: 50");
  expect(source("src/modules/activity/service.ts")).toContain("remainingCount:hasMore?Math.max");
  expect(source("src/components/activity/activity-center.tsx")).toContain("Load more ({nextRemaining} older)");
 });
 it("SA-tenants-modules-44 tells Super Admin the current activity scope",()=>{
  const s=source("src/app/(authenticated)/activity/page.tsx");
  expect(s).toContain('aria-label="Activity scope"');
  expect(s).toContain("Platform-wide activity.");
  expect(s).toContain("Organization-wide activity.");
  expect(s).toContain("Activity restricted to the selected college.");
 });

 it("SA-tenants-modules-50 remembers filters across visits and clears them without redirecting elsewhere",()=>{
  const memory=source("src/components/tracker/audit-finding-filter-memory.tsx");
  const page=source("src/app/(authenticated)/tracker/audit-findings/page.tsx");
  expect(memory).toContain("42tracker_audit_findings_filters_v1");
  expect(memory).toContain("window.localStorage.setItem");
  expect(memory).toContain("window.localStorage.getItem");
  expect(memory).toContain("new URLSearchParams(saved)");
  expect(memory).toContain('router.replace("/tracker/audit-findings?"');
  expect(memory).toContain("allowed.has(key)");
  expect(page).toContain("<AuditFindingFilterMemory/>");
  expect(page).toContain('href="/tracker/audit-findings?view=OPEN"');
 });
});
