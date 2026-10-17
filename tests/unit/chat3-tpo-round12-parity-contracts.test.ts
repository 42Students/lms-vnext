import {readFileSync} from "node:fs";
import {join} from "node:path";
import {describe,expect,it} from "vitest";

/** Source contracts are guardrails, NOT evidence of full legacy gap closure. */
function src(path:string){return readFileSync(join(process.cwd(),path),"utf8");}

describe("chat-3 TPO Drives source parity audit, 18 distinct gap IDs",()=>{
 it("TPO-drives-05 keeps lifecycle cue derives from current persisted drive facts",()=>{
  const code=src("src/app/(authenticated)/tpo/placements/lifecycle/page.tsx");
  expect(code).toContain("tpoDriveWhereItIs(job,data.asOf)");
 });
 it("TPO-drives-06 keeps applied count is displayed per drive",()=>{
  const code=src("src/app/(authenticated)/tpo/placements/lifecycle/page.tsx");
  expect(code).toContain("{job.appliedCount}");
 });
 it("TPO-drives-07 keeps pay and dream flags are displayed",()=>{
  const code=src("src/app/(authenticated)/tpo/placements/lifecycle/page.tsx");
  expect(code).toContain("job.isDream");
  expect(code).toContain("job.stipendPerMonthInr");
 });
 it("TPO-drives-08 keeps mode and employment labels remain explicit",()=>{
  const code=src("src/app/(authenticated)/tpo/placements/lifecycle/page.tsx");
  expect(code).toContain("tpoDriveEmploymentLabel(job.employmentType)");
  expect(code).toContain("tpoDriveWorkModeLabel(job.workMode)");
 });
 it("TPO-drives-10 keeps scoped company and cohort filters remain shareable",()=>{
  const code=src("src/app/(authenticated)/tpo/placements/lifecycle/page.tsx");
  expect(code).toContain("name=\"companyId\"");
  expect(code).toContain("name=\"cohortId\"");
 });
 it("TPO-drives-15 keeps deadline entry is gated on published jobs",()=>{
  const code=src("src/app/(authenticated)/tpo/placements/lifecycle/page.tsx");
  expect(code).toContain("/extend-deadline");
  expect(code).toContain("job.status===\"PUBLISHED\"");
 });
 it("TPO-drives-17 keeps export UI exposes all and page scopes",()=>{
  const code=src("src/app/(authenticated)/tpo/placements/lifecycle/page.tsx");
  expect(code).toContain("exportHref(\"ALL\")");
  expect(code).toContain("exportHref(\"PAGE\")");
 });
 it("TPO-drives-18 keeps saved views are scoped to an actor",()=>{
  const code=src("src/app/(authenticated)/tpo/placements/lifecycle/page.tsx");
  expect(code).toContain("scopeKey={savedViewScope}");
 });
 it("TPO-drives-19 keeps empty states distinguish lifecycle tabs",()=>{
  const code=src("src/app/(authenticated)/tpo/placements/lifecycle/page.tsx");
  expect(code).toContain("No live drives yet");
  expect(code).toContain("No draft drives yet");
 });
 it("TPO-drives-23 keeps employer picker explains no results",()=>{
  const code=src("src/components/placements/placement-job-create-form.tsx");
  expect(code).toContain("companySearch");
  expect(code).toContain("No matching college employer");
 });
 it("TPO-drives-24 keeps potential duplicate employer is flagged before submit",()=>{
  const code=src("src/components/placements/placement-job-create-form.tsx");
  expect(code).toContain("matchingEmployer");
  expect(code).toContain("This may already be");
 });
 it("TPO-drives-32 keeps compensation breakdown inputs exist",()=>{
  const code=src("src/components/placements/placement-job-create-form.tsx");
  expect(code).toContain("name=\"fixedLpa\"");
  expect(code).toContain("name=\"variableLpa\"");
  expect(code).toContain("name=\"stipendPerMonthInr\"");
 });
 it("TPO-drives-33 keeps persisted dream exception is explicit",()=>{
  const code=src("src/components/placements/placement-job-create-form.tsx");
  expect(code).toContain("name=\"isDream\"");
 });
 it("TPO-drives-40 keeps the four-step preflight summary is shown",()=>{
  const code=src("src/components/placements/placement-job-create-form.tsx");
  expect(code).toContain("Drive setup review");
  expect(code).toContain("Step {index+1} of 4");
 });
 it("TPO-drives-R05 keeps numeric validation has field-specific limits",()=>{
  const code=src("src/components/placements/placement-job-create-form.tsx");
  expect(code).toContain("Minimum CGPA");
  expect(code).toContain("max={name === \"minCgpa\" ? 10");
 });
 it("TPO-drives-25 keeps company memory is tenant scoped and scans beyond highlights",()=>{
  const code=src("src/components/placements/placement-job-create-workspace.tsx");
  expect(code).toContain("eq(placementJobs.collegeId,collegeId)");
  expect(code).toContain("existingRoles:sql<");
 });
 it("TPO-drives-43 keeps confirmed partial draft resumes without a duplicate POST",()=>{
  const code=src("src/components/placements/placement-job-create-form.tsx");
  expect(code).toContain("partialDraft:createdJobRef.current");
  expect(code).toContain("createdJobRef.current=resume");
 });
 it("TPO-drives-44 keeps common server codes map to human-readable copy",()=>{
  const code=src("src/modules/placements/tpo-drive-form-error-copy.ts");
  expect(code).toContain("PLACEMENT_JOB_INVALID_DEADLINE");
  expect(code).toContain("PLACEMENT_JOB_STALE");
 });
});
