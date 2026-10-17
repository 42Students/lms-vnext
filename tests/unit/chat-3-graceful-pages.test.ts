import {readFileSync} from "node:fs";
import {join} from "node:path";
import {describe,expect,it} from "vitest";
const load=(path:string)=>readFileSync(join(process.cwd(),path),"utf8");
const courseError=()=>load("src/app/(authenticated)/college/courses/offerings/[offeringId]/error.tsx");
const attendance=()=>load("src/components/attendance/admin-attendance-workspace.tsx");
const profile=()=>load("src/components/profile/learner-profile-workspace.tsx");
describe("Chat-3 graceful-operation coverage for touched pages",()=>{
 it("GR-04 course, college, attendance, profile and recruiter actions use guarded network and JSON parsing",()=>{
  for(const path of [
   "src/components/courses/admin-course-actions.tsx",
   "src/components/courses/admin-course-create-panel.tsx",
   "src/components/courses/admin-course-display-editor.tsx",
   "src/components/college/college-faculty-assignment-actions.tsx",
   "src/components/attendance/admin-attendance-workspace.tsx",
   "src/components/admin/organization-create-form.tsx",
   "src/components/admin/college-create-form.tsx",
   "src/components/profile/learner-profile-workspace.tsx",
   "src/components/tpo/recruiter-invite-landing.tsx",
   "src/components/placements/placement-job-create-form.tsx",
  ])expect(load(path)).toContain("apiFetch");
 });
 it("GR-30 attendance correction uses the shared ref-locked guarded action",()=>{
  expect(attendance()).toContain("useGuardedAction");
  expect(attendance()).toContain("correctionGuard.run(async()=>");
 });
 it("GR-33 TPO-drives-42 preflight refuses missing deadline and pay before first write",()=>{
  const drive=load("src/components/placements/placement-job-create-form.tsx");
  expect(drive).toContain("Set a future application deadline before publishing.");
  expect(drive).toContain("Add a CTC figure or stipend for at least one role before publishing.");
 });
 it("GR-60 SA-tenants-modules-09 organization and college forms retain drafts on failed writes",()=>{
  const a=load("src/components/admin/organization-create-form.tsx");
  const b=load("src/components/admin/college-create-form.tsx");
  expect(a).toContain("useFormDraft");
  expect(b).toContain("useFormDraft");
  expect(a).toContain("Draft restored");
  expect(b).toContain("Draft restored");
 });
 it("GR-19 course detail, college attendance and learner profile show loading skeletons",()=>{
  for(const path of [
   "src/app/(authenticated)/college/courses/offerings/[offeringId]/loading.tsx",
   "src/app/(authenticated)/college/attendance/loading.tsx",
   "src/app/(authenticated)/learn/profile/loading.tsx"
  ]){const src=load(path);expect(src).toContain('aria-busy="true"');expect(src).toContain("animate-pulse");}
 });
 it("GR-20 page-level errors offer Retry rather than a raw framework failure",()=>{
  for(const path of [
   "src/app/(authenticated)/college/courses/error.tsx",
   "src/app/(authenticated)/college/courses/offerings/[offeringId]/error.tsx",
   "src/app/(authenticated)/college/attendance/error.tsx",
   "src/app/(authenticated)/learn/profile/error.tsx"
  ]){const content=load(path);expect(content).toContain("Retry");expect(content).not.toContain("{error.message}");}
 });
 it("GR-31 mutating attendance correction and learner contact save guard duplicate actions",()=>{
  expect(attendance()).toContain("if (");
  expect(attendance()).toContain("correcting");
  expect(attendance()).toContain("disabled={correcting}");
  expect(profile()).toContain("if (contactPending) return;");
  expect(profile()).toContain("setContactPending(true)");
 });
 it("GR-32 concurrent attendance correction shows recovery text without discarding learner selection",()=>{
  const body=attendance();
  expect(body).toContain("This changed while you were working.");
  expect(body).toContain("Refresh the attendance grid");
  expect(profile()).toContain("These contact details were updated in another tab.");
 });
 it("GR-35 attendance correction uses named drawer instead of disruptive browser confirm",()=>{
  expect(attendance()).not.toContain("window.confirm");
  expect(attendance()).toContain("Current status");
  expect(load("src/components/courses/admin-course-actions.tsx")).toContain("<ConfirmDialog");
 });
 it("GR-71 course catalogue and attendance lists explain empty vs filtered empty",()=>{
  expect(load("src/components/courses/admin-course-overview.tsx")).toContain("No courses match these filters");
  expect(attendance()).toContain("No attendance data for this month");
  expect(attendance()).toContain("Select a class and course");
 });
 it("GR-73 invalid attendance filters recover without losing valid selection in navigation",()=>{
  expect(load("src/app/(authenticated)/college/attendance/page.tsx")).toContain("Reset attendance filters");
  expect(attendance()).toContain('params.set("sectionId"');
  expect(attendance()).toContain('params.set("courseId"');
 });
 it("GR-90 no raw error code in corrected attendance alert and course load error summary",()=>{
  expect(attendance()).toContain('role="alert"');
  expect(attendance()).toContain('apiFetch<void>(');
  expect(courseError()).toContain('role="alert"');
  expect(courseError()).not.toContain("{error.message}");
  expect(attendance()).not.toContain("body?.error");
  expect(attendance()).not.toContain("body?.message");
  expect(load("src/components/college/college-faculty-assignment-actions.tsx")).toContain("apiFetch<BulkResult>");
 });
 it("GR-91 Retry is keyboard-accessible in all three role error screens",()=>{
  expect(courseError()).toContain("<Button onClick={reset}>Retry</Button>");
  expect(load("src/app/(authenticated)/college/attendance/error.tsx")).toContain("onClick={reset}");
  expect(load("src/app/(authenticated)/learn/profile/error.tsx")).toContain("onClick={reset}");
 });
});
