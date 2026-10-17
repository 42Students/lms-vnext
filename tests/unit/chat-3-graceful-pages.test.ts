import {readFileSync} from "node:fs";
import {join} from "node:path";
import {describe,expect,it} from "vitest";
const load=(path:string)=>readFileSync(join(process.cwd(),path),"utf8");
const courseError=()=>load("src/app/(authenticated)/college/courses/offerings/[offeringId]/error.tsx");
const attendance=()=>load("src/components/attendance/admin-attendance-workspace.tsx");
const profile=()=>load("src/components/profile/learner-profile-workspace.tsx");
describe("Chat-3 graceful-operation coverage for touched pages",()=>{
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
  expect(attendance()).toContain("Attendance could not be corrected. Check the record and retry.");
  expect(courseError()).toContain('role="alert"');
  expect(courseError()).not.toContain("{error.message}");
 });
 it("GR-91 Retry is keyboard-accessible in all three role error screens",()=>{
  expect(courseError()).toContain("<Button onClick={reset}>Retry</Button>");
  expect(load("src/app/(authenticated)/college/attendance/error.tsx")).toContain("onClick={reset}");
  expect(load("src/app/(authenticated)/learn/profile/error.tsx")).toContain("onClick={reset}");
 });
});
