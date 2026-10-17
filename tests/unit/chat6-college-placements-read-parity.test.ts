import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
const src=(name:string)=>readFileSync(name,"utf8");
describe("College Admin placement register and drive parity",()=>{
 it("COL-placements-07 College pipeline table exposes legacy email college source applied date age and match score",()=>{
  const pipeline=src("src/components/placements/college-application-pipeline-controls.tsx");
  for(const col of ["Email","College","Source","Applied Date","Age","Match Score"]){
   expect(pipeline).toContain("<th className=\"p-3\">"+col+"</th>");
  }
  const page=src("src/app/(authenticated)/college/placements/jobs/[jobId]/applications/page.tsx");
  expect(page).toContain("CollegeApplicationPipelineControls");
 });
 it("COL-placements-08 College drive table has legacy columns mobile cards bulk lifecycle and row actions",()=>{
  const page=src("src/app/(authenticated)/college/placements/drives/page.tsx");
  for(const col of ['"Type"','"Location"','"Deadline"','"Posted"','"Applicants"'])expect(page).toContain(col);
  expect(page).toContain('aria-label="Drives mobile cards"');
  expect(page).toContain("CollegeDriveBulkActions");
  expect(page).toContain("CollegeDriveRowLifecycleAction");
  const bulk=src("src/components/placements/college-drive-bulk-actions.tsx");
  expect(bulk).toContain('value="OPEN"');
  expect(bulk).toContain('value="CLOSE"');
  expect(bulk).toContain("Preview change");
 });
 it("COL-placements-09 College Admin can duplicate a drive or extend the published application deadline",()=>{
  const overview=src("src/app/(authenticated)/college/placements/jobs/[jobId]/overview/page.tsx");
  const drives=src("src/app/(authenticated)/college/placements/drives/page.tsx");
  expect(overview).toContain("CollegeDriveDuplicateAction");
  expect(drives).toContain("CollegeDriveDeadlineAction");
  const duplicate=src("src/components/placements/college-drive-duplicate-action.tsx");
  const extend=src("src/components/placements/college-drive-deadline-action.tsx");
  expect(duplicate).toContain("Duplicate as new drive");
  expect(extend).toContain("Extend deadline");
  const route=src("src/app/api/placements/college/jobs/[jobId]/extend-deadline/route.ts");
  expect(route).toContain("isSameOriginRequest(req)");
 });
 it("COL-placements-21 College drive overview shows pipeline stages attention badges and deep links",()=>{
  const ui=src("src/components/placements/college-drive-pipeline-overview.tsx");
  const overview=src("src/app/(authenticated)/college/placements/jobs/[jobId]/overview/page.tsx");
  for(const stage of ["APPLIED","ASSESSMENT","INTERVIEW","WAITLISTED","OFFERED","HIRED"]){
   expect(ui).toContain(stage);
  }
  expect(ui).toContain('aria-label="College application pipeline"');
  expect(ui).toContain('aria-label="Drive needs attention"');
  expect(ui).toContain("/applications?stage=");
  expect(overview).toContain("CollegeDrivePipelineOverview");
 });
});
