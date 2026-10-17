import {readFileSync} from "node:fs";
import {join} from "node:path";
import {describe,expect,it} from "vitest";
const codeOf=(path:string)=>readFileSync(join(process.cwd(),path),"utf8");

describe("chat-3 final six round13 audited functional closures",()=>{
 it("TPO-drives-05 displays real persisted lifecycle stages rather than static placeholder",()=>{
  const page=codeOf("src/app/(authenticated)/tpo/placements/lifecycle/page.tsx");
  const model=codeOf("src/modules/placements/tpo-drive-lifecycle-list-model.ts");
  expect(page).toContain("Where it is: {tpoDriveWhereItIs(job,data.asOf)}");
  for(const value of ["Taking applications","Applications closed","Offers · ",
    'job.status==="CANCELLED"','job.status==="CLOSED"'])
    expect(model).toContain(value);
 });
 it("TPO-drives-08 exposes owner, employment and mode with preserved status",()=>{
  const page=codeOf("src/app/(authenticated)/tpo/placements/lifecycle/page.tsx");
  for(const value of ["job.createdBy","tpoDriveEmploymentLabel(job.employmentType)",
    "tpoDriveWorkModeLabel(job.workMode)","tpoDriveStatusLabel(job.status)"])
    expect(page).toContain(value);
 });
 it("TPO-drives-17 exports scoped shown/matching/selected CSV subsets",()=>{
  const page=codeOf("src/app/(authenticated)/tpo/placements/lifecycle/page.tsx");
  for(const value of ['exportHref("ALL")','exportHref("PAGE")',
    'name="scope" value="SELECTED"',"Export selected drives (CSV)"])
    expect(page).toContain(value);
  const route=codeOf("src/app/api/placements/tpo/drives/export/route.ts");
  expect(route).toContain("exportTpoDriveLifecycle");
 });
 it("LEARNER-learning-misc-09 unsent work guards both tab exit and in-app route dismiss",()=>{
  const source=codeOf("src/components/courses/assignment-submission-control.tsx");
  for(const token of ['addEventListener("beforeunload",guard)',"setDiscardHref",
    'title="Discard this submission?"',"Keep editing","Discard</Button>"])
    expect(source).toContain(token);
 });
 it("LEARNER-learning-misc-33 distinguishes unassigned, empty week and retriable error",()=>{
  const page=codeOf("src/components/academics/learner-class-schedule.tsx");
  const error=codeOf("src/app/(authenticated)/learn/calendar/error.tsx");
  expect(page).toContain("You are not assigned to a class yet");
  expect(page).toContain("No scheduled classes this week.");
  expect(error).toContain("Unable to load class schedule. Please try again.");
  expect(error).toContain("Retry");
 });
 it("LEARNER-learning-misc-38 preserves separate no-course/no-record/error messages",()=>{
  const page=codeOf("src/components/attendance/learner-attendance-workspace.tsx");
  const error=codeOf("src/app/(authenticated)/learn/attendance/error.tsx");
  expect(page).toContain('deliveryId ? "No attendance records" : "Select a course"');
  expect(page).toContain("No classes scheduled for this month. Try selecting a different period.");
  expect(error).toContain("Something went wrong loading attendance for this month.");
  expect(error).toContain("Retry");
 });
});
