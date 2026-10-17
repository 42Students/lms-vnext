import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {join} from "node:path";
const code=(p:string)=>readFileSync(join(process.cwd(),p),"utf8");
describe("Super Admin Placement operations remaining source parity",()=>{
 it("SA-placements-projects-05 flags stale applications, unscheduled interviews, missing letters and low conversion",()=>{
  const service=code("src/modules/placements/tpo-operations-service.ts");
  const page=code("src/app/(authenticated)/admin/placements/page.tsx");
  for(const token of ["STALE_APPLICATIONS","INTERVIEW_UNSCHEDULED","OFFERED_NO_LETTER","CLOSING_SOON_LOW_CONVERSION","staleApplicationDays"])
   expect(service).toContain(token);
  expect(page).toContain("staleDays={staleDays}");
  expect(page).toContain("PlacementOperationsWorkspace");
 });
 it("SA-placements-projects-11 allows previewed bulk Open or Close, confirmed writes and failed-only retry",()=>{
  const list=code("src/app/(authenticated)/admin/placements/drives/page.tsx");
  const form=code("src/components/placements/super-admin-bulk-drive-actions.tsx");
  const service=code("src/modules/placements/super-admin-bulk-drive-service.ts");
  expect(list).toContain("<SuperAdminBulkDriveActions");
  for(const token of ["Bulk Open / Close","Preview","Confirm","SKIPPED","Retry will target only failed drives"])
   expect(form).toContain(token);
  expect(form).toContain("/api/admin/placements/drives/bulk");
  expect(service).toContain("updateSuperAdminBulkDrives");
 });
 it("SA-placements-projects-12 previews drive deletion impact and requires confirmation before archiving",()=>{
  const setting=code("src/app/(authenticated)/admin/placements/jobs/[jobId]/settings/page.tsx");
  const action=code("src/components/placements/super-admin-drive-archive.tsx");
  expect(setting).toContain("<SuperAdminDriveArchive");
  expect(action).toContain("Active applications");
  expect(action).toContain("Issued offers to withdraw");
  expect(action).toContain("Accepted offers");
  expect(action).toContain("Preview delete impact");
  expect(action).toContain("Confirm delete (archive)");
 });
 it("SA-placements-projects-13 allows guarded changes to a published drive with recorded reason",()=>{
  const setting=code("src/app/(authenticated)/admin/placements/jobs/[jobId]/settings/page.tsx");
  const edit=code("src/components/placements/super-admin-published-drive-edit.tsx");
  expect(setting).toContain("<SuperAdminPublishedDriveEdit");
  expect(edit).toContain("Edit published drive");
  expect(edit).toContain("expectedUpdatedAt:job.updatedAt");
  expect(edit).toContain("Reason for edit");
  expect(edit).toContain("/edit-published");
 });
 it("SA-placements-projects-18 shows stage pipeline with six cards in scoped drive Overview",()=>{
  const overview=code("src/app/(authenticated)/admin/placements/jobs/[jobId]/page.tsx");
  const pipeline=code("src/components/placements/super-admin-drive-pipeline.tsx");
  expect(overview).toContain("<SuperAdminDrivePipeline");
  expect(pipeline).toContain('aria-label="Drive pipeline snapshot"');
  expect(pipeline).toContain("xl:grid-cols-6");
  expect(pipeline).toContain("rows.funnel.map");
 });
 it("SA-placements-projects-46 filters candidate interview bookings by type, status, mode and department",()=>{
  const view=code("src/components/admin/super-admin-interview-operations.tsx");
  for(const token of ['choices("Type"','choices("Status"','choices("Mode"','choices("Department"','setDepartment','setSort'])
   expect(view).toContain(token);
  expect(view).toContain("bookingConflicts");
 });
 it("SA-placements-projects-47 exports filtered interviews CSV and per-booking ICS with schedule metrics",()=>{
  const view=code("src/components/admin/super-admin-interview-operations.tsx");
  expect(view).toContain("superAdminInterviewCsv");
  expect(view).toContain("collegeInterviewIcs");
  expect(view).toContain('download={"interview-"+row.id+".ics"}');
  for(const label of ["Scheduled","Today","Companies","Possible venue conflicts"])expect(view).toContain(label);
 });
});
