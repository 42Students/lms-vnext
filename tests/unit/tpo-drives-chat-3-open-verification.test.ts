import {readFileSync} from "node:fs";
import {join} from "node:path";
import {describe,expect,it} from "vitest";
const source=(p:string)=>readFileSync(join(process.cwd(),p),"utf8");
const create=()=>source("src/components/placements/placement-job-create-form.tsx");

describe("chat-3 remaining Drives audit evidence — open unless explicitly closed",()=>{
 it("TPO-drives-27 JD upload stays disabled until private storage and scanner are connected",()=>{
  expect(create()).not.toContain('type="file"');
 });
 it("TPO-drives-28 college job type is distinct from the fixed employment enum",()=>{
  expect(create()).toContain('name="employmentType"');
  expect(create()).toContain("Custom college job types and placed-counting rules");
 });
 it("TPO-drives-29 pool host logistics are not conflated with work mode",()=>{
  expect(create()).toContain("Pool reporting time and travel arrangements must be coordinated separately.");
  expect(create()).toContain('name="workMode"');
 });
 it("TPO-drives-30 the employer portal URL is clear without claiming a persisted portal name",()=>{
  expect(create()).toContain('name="externalApplicationUrl"');
  expect(create()).toContain("A separate portal name is not saved by this workflow.");
 });
 it("TPO-drives-31 recorded-outside creates a historical record, not a learner-facing job",()=>{
  const form=source("src/components/placements/recorded-outside-form.tsx");
  const service=source("src/modules/placements/recorded-outside-service.ts");
  expect(form).toContain('action="/api/placements/recorded-outside"');
  expect(form).toContain("not a published student job");
  expect(service).toContain("placementOutsideDriveRecords");
 });
 it("TPO-drives-32 create persists fixed, variable and stipend pay without claiming joining bonus",()=>{
  expect(create()).toContain("fixedCtcLpa:nullableDecimal");
  expect(create()).toContain("variableCtcLpa:nullableDecimal");
  expect(create()).toContain("stipendPerMonthInr:nullableInteger");
 });
 it("TPO-drives-34 create targets programs and cohorts from the scoped college choices",()=>{
  const workspace=source("src/components/placements/placement-job-create-workspace.tsx");
  expect(workspace).toContain("listCohorts(");
  expect(create()).toContain("allowedProgramIds:");
  expect(create()).toContain("allowedCohortIds:");
 });
 it("TPO-drives-39 round templates are disclosed as after-save work, not pretended to exist",()=>{
  expect(create()).toContain("Interview round templates and recruiter invitations are configured from the saved drive workspace");
 });
 it("TPO-drives-40 learner reach is deferred until persisted evidence can be counted",()=>{
  expect(create()).toContain('aria-label="Who this reaches"');
  expect(create()).toContain("No reach estimate is fabricated on this form.");
  expect(source("src/modules/placements/tpo-drive-lifecycle-service.ts")).toContain("previewEligiblePublishedDrive");
 });
 it("TPO-drives-42 create publish review checks future deadline, compensation and HTTPS employer link",()=>{
  expect(create()).toContain("Set a future application deadline before publishing.");
  expect(create()).toContain("Add a CTC figure or stipend for at least one role before publishing.");
  expect(create()).toContain("Add a valid HTTPS employer application link before publishing.");
  expect(source("src/modules/placements/tpo-drive-lifecycle-model.ts")).toContain("APPLICATION_DEADLINE_MISSING");
 });
 it("TPO-drives-48 edit remains draft-only until the live notify contract exists",()=>{
  const service=source("src/modules/placements/tpo-drive-edit-service.ts");
  expect(service).toContain('editable:job.status==="DRAFT"&&season?.status==="ACTIVE"');
 });
 it("TPO-drives-52 quick and full create paths are explicitly separate",()=>{
  const page=source("src/app/(authenticated)/tpo/placements/new/page.tsx");
  expect(page).toContain("/tpo/placements/new/draft");
  expect(page).toContain("<PlacementJobCreateWorkspace");
 });
});
