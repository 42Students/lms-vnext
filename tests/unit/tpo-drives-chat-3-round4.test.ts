import {readFileSync} from "node:fs";
import {join} from "node:path";
import {describe,it,expect} from "vitest";
import {defaultTpoDriveView} from "@/modules/placements/tpo-drive-lifecycle-list-model";
import {driveDeadlineIstToIso} from "@/modules/placements/tpo-drive-deadline-ist";
import {driveEligibilityPresetValue} from "@/modules/placements/tpo-drive-eligibility-presets";
const source=(path:string)=>readFileSync(join(process.cwd(),path),"utf8");
describe("chat-3 Drives round 4",()=>{
 it("TPO-drives-04 review-first default and persistent badge counts",()=>{
  expect(defaultTpoDriveView(2)).toBe("REQUESTS");
  expect(defaultTpoDriveView(0)).toBe("LIVE");
  expect(defaultTpoDriveView(2,"ALL")).toBe("ALL");
  const service=source("src/modules/placements/tpo-drive-lifecycle-list-service.ts");
  const page=source("src/app/(authenticated)/tpo/placements/lifecycle/page.tsx");
  expect(service).toContain("needsReviewCount");
  expect(service).toContain("statusCounts");
  expect(page).toContain("data.statusCounts.drafts");
  expect(page).toContain("data.needsReviewCount");
  expect(page).toContain('aria-current={data.view===view?"page":undefined}');
 });
 it("TPO-drives-45 IST wall time is not the browser local time",()=>{
  expect(driveDeadlineIstToIso("2099-11-05T23:59")).toBe("2099-11-05T18:29:00.000Z");
  expect(driveDeadlineIstToIso("2099-01-01T00:00")).toBe("2098-12-31T18:30:00.000Z");
  expect(source("src/components/placements/placement-job-create-form.tsx")).toContain("applicationDeadline: deadlineIso");
 });
 it("TPO-drives-45 malformed and impossible local deadlines are rejected",()=>{
  for(const input of ["2099-02-29T10:00","2099-13-01T10:00","2099-01-32T10:00","2099-01-01T24:00","garbage"])
   expect(()=>driveDeadlineIstToIso(input)).toThrow("Enter a valid application deadline in IST.");
 });
 it("TPO-drives-37 fields retired in legacy are not reintroduced in new drive create",()=>{
  const body=source("src/components/placements/placement-job-create-form.tsx");
  for(const field of ["maxActiveBacklogs","maxPastBacklogs","maxGapYears"])expect(body).not.toContain(field);
 });
 it("TPO-drives-49 non-editable drive points to safe clone recovery",()=>{
  const body=source("src/app/(authenticated)/tpo/placements/jobs/[jobId]/edit/page.tsx");
  expect(body).toContain("This drive is not editable");
  expect(body).toContain("open Create drive");
 });
 it("TPO-drives-35 percentage throughout and verified marks are persisted from Create",()=>{
  const body=source("src/components/placements/placement-job-create-form.tsx");
  expect(body).toContain("minPctThroughout:nullableDecimal");
  expect(body).toContain("requireVerifiedEvidence:data.get");
 });
 it("TPO-drives-36 legacy presets set real eligibility form values",()=>{
  expect(driveEligibilityPresetValue("CGPA_6","minCgpa")).toBe("6");
  expect(driveEligibilityPresetValue("CGPA_7","minCgpa")).toBe("7");
  expect(driveEligibilityPresetValue("PCT_60","minPctThroughout")).toBe("60");
  expect(driveEligibilityPresetValue("PCT_70","minPctThroughout")).toBe("70");
  expect(driveEligibilityPresetValue("OPEN","minCgpa")).toBe("");
  expect(source("src/components/placements/placement-job-create-form.tsx")).toContain('key={eligibilityPreset+":"+name}');
 });
 it("TPO-drives-R02 publish path opens workspace review instead of silently publishing",()=>{
  const body=source("src/components/placements/placement-job-create-form.tsx");
  expect(body).toContain('?publish=1#drive-lifecycle-publish');
  expect(body).not.toContain('"/api/placements/jobs/"+jobId+"/status"');
 });
 it("TPO-drives-R03 preflight shows nonblocking rounds and eligibility warnings",()=>{
  const body=source("src/components/placements/placement-job-create-form.tsx");
  expect(body).toContain("No interview rounds added yet");
  expect(body).toContain("No eligibility rules set - every registered student will see this drive");
  expect(body).toContain("selectedProgramIds.length===0");
  expect(body).toContain("These are warnings, not publication blockers.");
 });
 it("TPO-drives-R05 numeric validation has correct client upper bounds",()=>{
  const body=source("src/components/placements/placement-job-create-form.tsx");
  expect(body).toContain("max={1000}");
  expect(body).toContain("Minimum CGPA");
  expect(body).toContain("Percentage throughout");
 });
 it("TPO-drives-44 broken internal create responses do not expose implementation details",()=>{
  const body=source("src/components/placements/placement-job-create-form.tsx");
  expect(body).not.toContain("Created job id was not returned");
  expect(body).not.toContain("Company relationship was not returned");
  expect(body).toContain("Check your drafts before trying again.");
 });
 it("TPO-drives-25 Company Memory uses scoped historical drive facts",()=>{
  const workspace=source("src/components/placements/placement-job-create-workspace.tsx");
  const form=source("src/components/placements/placement-job-create-form.tsx");
  expect(workspace).toContain("eq(placementJobs.collegeId,collegeId)");
  expect(workspace).toContain("joined.status='JOINED'");
  expect(workspace).toContain("memoryByRelationship.get(company.relationshipId)");
  expect(form).toContain('aria-label="Company Memory"');
  expect(form).toContain("A drive for {selectedEmployer.name}");
 });
 it("TPO-drives-R03 selected eligibility preset suppresses false unrestricted warning",()=>{
  const form=source("src/components/placements/placement-job-create-form.tsx");
  expect(form).toContain('!hasEnteredEligibilityRule&&eligibilityPreset==="OPEN"');
 });
 it("TPO-drives-43 retry reuses a partial draft and refuses changed form payload",()=>{
  const body=source("src/components/placements/placement-job-create-form.tsx");
  expect(body).toContain("createdJobRef.current?{id:createdJobRef.current.jobId}");
  expect(body).toContain("createdJobRef.current.fingerprint!==fingerprint");
  expect(body).toContain("createdJobRef.current={jobId,relationshipId,fingerprint}");
  expect(body).toContain("open the existing draft");
  expect(body).toContain("if (companyMode === \"NEW\" && !createdJobRef.current)");
 });
 it("TPO-drives-15 first deadline is writable and explains the consequence",()=>{
  const service=source("src/modules/placements/tpo-drive-deadline-service.ts");
  const form=source("src/components/placements/tpo-drive-deadline-form.tsx");
  expect(service).toContain('extendable:job.status==="PUBLISHED"&&season?.status==="ACTIVE"');
  expect(service).toContain('action:job.applicationDeadline===null?"SET":"EXTEND"');
  expect(form).toContain("Set first application deadline?");
 });
 it("TPO-drives-45 deadline edit uses same IST validator as creation",()=>{
  const form=source("src/components/placements/tpo-drive-deadline-form.tsx");
  expect(form).toContain('driveDeadlineIstToIso(String(values.get("newDeadline")??""))');
 });
 it("GR-04 TPO-drives-15 deadline mutation handles non-JSON and 5xx responses",()=>{
  const form=source("src/components/placements/tpo-drive-deadline-form.tsx");
  expect(form).toContain("await apiFetch(");
  expect(form).not.toContain("body?.error");
 });
 it("GR-30 TPO-drives-15 deadline mutation uses guarded pending lock",()=>{
  const form=source("src/components/placements/tpo-drive-deadline-form.tsx");
  expect(form).toContain("useGuardedAction");
  expect(form).toContain("await run(async()=>");
 });
 it("GR-35 TPO-drives-15 deadline consequences use accessible ConfirmDialog",()=>{
  const form=source("src/components/placements/tpo-drive-deadline-form.tsx");
  expect(form).toContain("<ConfirmDialog");
  expect(form).not.toContain("window.confirm");
 });
 it("TPO-drives-46 legacy direct publish notifies eligible users before counting new debarments",()=>{
  const body=source("src/modules/placements/job-service.ts");
  const start=body.indexOf("export async function publishPlacementJob");
  const published=body.slice(start,body.indexOf("export async function closePlacementJob",start));
  expect(published).toContain("notifyEligiblePublishedDrive(tx,context,published,publishedEvent.id)");
  expect(published.indexOf("notifyEligiblePublishedDrive(tx,context,published,publishedEvent.id)"))
   .toBeLessThan(published.indexOf("const localDateParts"));
  expect(source("src/modules/placements/tpo-drive-publish-effects.ts")).toContain("tx.insert(inAppNotifications)");
 });
 it("TPO-drives-R01 direct job publish validates deadline and pay in server path",()=>{
  const service=source("src/modules/placements/job-service.ts");
  expect(service).toContain("!current.applicationDeadline||current.applicationDeadline<=new Date()");
  expect(service).toContain("current.stipendPerMonthInr===null");
 });
 it("TPO-drives-51 college administrator has a real separate create flow",()=>{
  const college=source("src/app/(authenticated)/college/placements/new/page.tsx");
  expect(college).toContain('hasMembershipRole(\n      context,\n      "COLLEGE_ADMIN"');
  expect(college).toContain("<PlacementJobCreateWorkspace");
  expect(college).toContain('basePath="/college/placements"');
 });
 it("TPO-drives-26 Create drive now provides a scoped clone-past picker",()=>{
  const body=source("src/components/placements/placement-job-create-workspace.tsx");
  expect(body).toContain("Clone a past drive");
  expect(body).toContain("inArray(placementJobs.status");
  expect(body).toContain("eq(placementJobs.collegeId,collegeId)");
  expect(body).toContain("<TpoDriveCloneAction jobId={job.id}");
  const service=source("src/modules/placements/tpo-drive-clone-service.ts");
  expect(service).toContain("sourceJobId:source.id");
  expect(service).toContain("cleared:[");
 });
 it("TPO-drives-41 long Create draft is restored only within the actor and college scope",()=>{
  const body=source("src/components/placements/placement-job-create-form.tsx");
  const workspace=source("src/components/placements/placement-job-create-workspace.tsx");
  expect(body).toContain('const backupKey="lms:drive-create:"+userId+":"+collegeId');
  expect(workspace).toContain("userId={context.user.id}");
  expect(body).toContain("localStorage.setItem(backupKey");
  expect(body).toContain("localStorage.getItem(backupKey)");
  expect(body).toContain("localStorage.removeItem(backupKey)");
  expect(body).toContain("Discard saved browser backup");
  expect(body).toContain("useGuardedAction");
 });
 it("GR-60 TPO-drives-41 autosave restoration uses stable guards without lint suppression",()=>{
  const body=source("src/components/placements/placement-job-create-form.tsx");
  const guard=source("src/components/placements/use-unsaved-drive-guard.ts");
  expect(body).not.toContain("eslint-disable");
  expect(body).toContain("const saveBrowserDraft=useCallback");
  expect(guard).toContain("const markDirty=useCallback");
 });
 it("TPO-drives-26 cloning requires an accessible confirmation and safe JSON response",()=>{
  const action=source("src/components/placements/tpo-drive-clone-action.tsx");
  expect(action).toContain("<ConfirmDialog");
  expect(action).toContain("await apiFetch<");
  expect(action).toContain("useGuardedAction");
  expect(action).toContain("Check your drives before trying again.");
 });
 it("GR-35 TPO-drives-26 clone confirmation does not use window.confirm",()=>{
  const action=source("src/components/placements/tpo-drive-clone-action.tsx");
  expect(action).not.toContain("window.confirm");
  expect(action).toContain("<ConfirmDialog");
 });
});
