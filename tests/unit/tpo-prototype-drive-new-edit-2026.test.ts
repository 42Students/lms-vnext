import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";

const source=(path:string)=>readFileSync(path,"utf8");

describe("TPO original New drive / Edit drive code acceptance (screen 17)",()=>{
 it("authorizes the new-drive route and scopes clone sources to completed college jobs",()=>{
  const page=source("src/app/(authenticated)/tpo/placements/new/page.tsx");
  const workspace=source("src/components/placements/placement-job-create-workspace.tsx");
  expect(page).toContain('hasMembershipRole(context, "TPO")');
  expect(page).toContain("<PlacementJobCreateWorkspace");
  expect(page).toContain("invalidCompany");
  expect(workspace).toContain("require");
  expect(workspace).toContain('eq(placementJobs.collegeId,collegeId)');
  expect(workspace).toContain('inArray(placementJobs.status,["CLOSED","CANCELLED"])');
  expect(workspace).toContain("isNull(placementJobs.archivedAt)");
  expect(workspace).toContain("<TpoDriveClonePicker");
 });
 it("keeps past-drive copying, private JD attachment and fresh blank form available without claiming JD auto-extraction",()=>{
  const form=source("src/components/placements/placement-job-create-form.tsx");
  expect(form).toContain("Clone a past drive");
  expect(form).toContain("loadCloneSource");
  expect(form).toContain("Application and assessment deadlines, external links and rounds were cleared.");
  expect(form).toContain("Optional JD file (PDF or Word");
  expect(form).toContain("The attachment uses private signed storage");
  expect(form).toContain("No file selected. You can attach it after saving in Edit drive.");
  expect(form).toContain('name="title"');
  expect(form).toContain('name="description"');
 });
 it("requires save-then-publish review, not an unverified one-click student notification",()=>{
  const form=source("src/components/placements/placement-job-create-form.tsx");
  expect(form).toContain("Save as draft");
  expect(form).toContain("Review &amp; publish");
  expect(form).toContain('value="review-publish"');
  expect(form).toContain("No students are notified until you confirm publication.");
  expect(form).toContain("this preliminary count does not include marks, backlog, debarment or held-offer decisions.");
  expect(form).toContain("Round templates are saved as pending during draft setup");
  expect(form).toContain("The previous create request may have succeeded.");
 });
 it("uses audited versioned edit, saved policy reach and explicit applicant-notification consent",()=>{
  const page=source("src/app/(authenticated)/tpo/placements/jobs/[jobId]/edit/page.tsx");
  const form=source("src/components/placements/tpo-drive-edit-form.tsx");
  const service=source("src/modules/placements/tpo-drive-edit-service.ts");
  expect(page).toContain("getTpoDriveEditState(context,jobId)");
  expect(page).toContain("job.editable?<TpoDriveEditForm");
  expect(form).toContain("expectedUpdatedAt:version");
  expect(form).toContain("body:JSON.stringify({...proposal,notifyApplicants})");
  expect(form).toContain("setVersion(result.updatedAt)");
  expect(form).toContain("no automatic email is sent.");
  expect(form).toContain("Eligibility");
  expect(form).toContain("Manage selection rounds");
  expect(service).toContain("requireTpoJobCollege(context)");
  expect(service).toContain("requireTpoJobActor");
  expect(service).toContain("auditTpoJobChange");
 });
});
