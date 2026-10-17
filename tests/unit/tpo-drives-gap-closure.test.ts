import {readFileSync} from "node:fs";
import {join} from "node:path";
import {describe,expect,it} from "vitest";
import {
 projectTpoDriveLifecycle,tpoDriveLifecycleQuerySchema,tpoDriveStatusLabel,tpoDriveStatusTone,driveRequestStatusTone,
 tpoDriveWhereItIs,tpoDriveEmploymentLabel,tpoDriveWorkModeLabel,
 driveRequestStatusLabel,TPO_REQUESTS_COPY,
} from "@/modules/placements/tpo-drive-lifecycle-list-model";

const source=(name:string)=>readFileSync(join(process.cwd(),name),"utf8");
const page=()=>source("src/app/(authenticated)/tpo/placements/lifecycle/page.tsx");
const service=()=>source("src/modules/placements/tpo-drive-lifecycle-list-service.ts");
const create=()=>source("src/components/placements/placement-job-create-form.tsx");
const cancelled={id:"c",title:"Engineering",company:"College Partner",status:"CANCELLED",
 workMode:"ONSITE",employmentType:"FULL_TIME",applicationDeadline:null};
const live={...cancelled,id:"l",status:"PUBLISHED",applicationDeadline:"2099-12-19T00:00:00.000Z"};
const clock="2099-12-16T00:00:00.000Z";
describe("TPO Drives independently inspected legacy gap contracts",()=>{
 it("TPO-drives-01 sidebar Drives resolves to real list, not operations dashboard",()=>{
  expect(source("src/app/(authenticated)/tpo/placements/page.tsx")).toContain('redirect("/tpo/placements/lifecycle")');
  expect(source("src/app/(authenticated)/tpo/placements/overview/page.tsx")).toContain("PlacementOperationsWorkspace");
 });
 it("TPO-drives-03 is NOT-A-GAP: cancelled drives belong to Closed, distinct from rejected requests",()=>{
  const result=projectTpoDriveLifecycle([cancelled,live],"CLOSED",clock);
  expect(result.rows.map(item=>item.id)).toEqual(["c"]);
  expect(result.counts.closed).toBe(1);
  expect(driveRequestStatusLabel("REJECTED")).toBe("Declined");
 });
 it("TPO-drives-05 displays Where it is from persisted status/round/deadline facts",()=>{
  expect(tpoDriveWhereItIs({...live,roundCount:0,roundsCompleted:0,nextRoundAt:null,offersMade:0},clock)).toBe("Taking applications");
  expect(tpoDriveWhereItIs({...cancelled,roundCount:0,roundsCompleted:0,nextRoundAt:null,offersMade:0},clock)).toBe("Cancelled");
  expect(page()).toContain("tpoDriveWhereItIs(job,data.asOf)");
 });
 it("TPO-drives-06 Applied is sourced from application rows and displayed per drive",()=>{
  expect(service()).toContain("appliedCount:");
  expect(page()).toContain("{job.appliedCount}");
 });
 it("TPO-drives-07 pay is formatted from annual CTC and stipend evidence",()=>{
  expect(page()).toContain("job.minimumAnnualCtcInr");
  expect(page()).toContain("job.stipendPerMonthInr");
  expect(page()).toContain("job.isDream");
 });
 it("TPO-drives-08 recorded job owner, job type and mode are visible in detailed list",()=>{
  expect(page()).toContain("job.createdBy");
  expect(page()).toContain("tpoDriveEmploymentLabel(job.employmentType)");
  expect(page()).toContain("tpoDriveWorkModeLabel(job.workMode)");
 });
 it("TPO-drives-09 legacy-friendly lifecycle statuses do not expose raw job enums",()=>{
  expect(tpoDriveStatusLabel("PUBLISHED")).toBe("Live");
  expect(tpoDriveStatusLabel("DRAFT")).toBe("Draft");
  expect(tpoDriveStatusLabel("CLOSED")).toBe("Closed");
  expect(tpoDriveStatusLabel("CANCELLED")).toBe("Cancelled");
  expect(driveRequestStatusLabel("REQUEST")).toBe(TPO_REQUESTS_COPY.needsReview);
  expect(tpoDriveEmploymentLabel("FULL_TIME")).toBe("Full-time");
  expect(tpoDriveWorkModeLabel("HYBRID")).toBe("Hybrid");
  expect(tpoDriveStatusTone("PUBLISHED")).toBe("success");
  expect(tpoDriveStatusTone("CANCELLED")).toBe("error");
  expect(driveRequestStatusTone("REQUEST")).toBe("warning");
  expect(driveRequestStatusTone("SENT_BACK")).toBe("info");
  expect(page()).toContain("<StatusBadge tone={tpoDriveStatusTone(job.status)}");
 });
 it("TPO-drives-10 rejects invalid drive ranges and preserves scoped filters",()=>{
  expect(tpoDriveLifecycleQuerySchema.safeParse({minApplied:"4",maxApplied:"2"}).success).toBe(false);
  expect(tpoDriveLifecycleQuerySchema.parse({minOffers:"1",maxOffers:"3",payCategory:"DREAM"}))
   .toMatchObject({minOffers:1,maxOffers:3,payCategory:"DREAM"});
  expect(page()).toContain('name="companyId"');
  expect(page()).toContain('name="cohortId"');
 });
 it("TPO-drives-11 five real Needs doing categories link to filtered drives and review requests",()=>{
  const pageSource=page();
  const list=source("src/modules/placements/tpo-drive-lifecycle-list-service.ts");
  expect(pageSource).toContain('aria-label="Needs doing"');
  for(const label of ["Waiting for your review","Nobody has applied","Live with no deadline",
    "Close in the next 7 days","Deadline passed, still open"])
    expect(pageSource).toContain(label);
  for(const key of ["data.attentionCounts.noApplicants","data.attentionCounts.noDeadline",
    "data.attentionCounts.dueSoon","data.attentionCounts.overdue"])
    expect(pageSource).toContain(key);
  expect(list).toContain('noApplicants:sql<number>');
  expect(list).toContain('noDeadline:sql<number>');
  expect(list).toContain('dueSoon:sql<number>');
  expect(list).toContain('overdue:sql<number>');
 });
 it("TPO-drives-12 row More menu links to applicants, rounds and offers",()=>{
  expect(page()).toContain("More ···");
  expect(page()).toContain('>Applicants</Link>');
  expect(page()).toContain('>Rounds and schedule</Link>');
  expect(page()).toContain('>Offers</Link>');
 });
 it("TPO-drives-14 reminder flow requires preview token and explicit confirmation",()=>{
  const panel=source("src/components/placements/tpo-remind-non-applicants.tsx");
  expect(panel).toContain("expectedPreviewToken:preview.previewToken");
  expect(panel).toContain("!confirmed");
  expect(panel).toContain('method:"POST"');
 });
 it("TPO-drives-15 list exposes the extended-deadline action only on published drives",()=>{
  expect(page()).toContain('job.status==="PUBLISHED"?<Link');
  expect(page()).toContain("/extend-deadline");
 });
 it("TPO-drives-16 published list rows can open guarded close-preview",()=>{
  expect(page()).toContain("/close-preview");
  expect(page()).toContain("Review and close drive");
 });
 it("TPO-drives-17 CSV exports respect all/page/selected subsets",()=>{
  expect(page()).toContain('exportHref("ALL")');
  expect(page()).toContain('exportHref("PAGE")');
  expect(page()).toContain('name="scope" value="SELECTED"');
  expect(source("src/app/api/placements/tpo/drives/export/route.ts")).toContain("exportTpoDriveLifecycle");
 });
 it("TPO-drives-18 locally saved drive view links stay scoped to an actor and college",()=>{
  expect(page()).toContain("scopeKey={savedViewScope}");
  expect(page()).toContain("context.user.id+");
  expect(source("src/components/placements/tpo-drive-saved-views.tsx")).toContain("tpo-drive-views:");
 });
 it("TPO-drives-19 empty lifecycle view shows a create action",()=>{
  expect(page()).toContain("No live drives yet");
  expect(page()).toContain("No draft drives yet");
  expect(page()).toContain('>Create drive</Link>');
 });
 it("TPO-drives-20 a missing season selector does not hide college history",()=>{
  expect(service()).toContain("// TPO-drives-20: default to all college seasons");
  expect(service()).toContain("filters.seasonId");
  expect(page()).toContain("All college seasons");
 });
 it("TPO-drives-21 heading and subtitle reproduce the legacy list copy",()=>{
  expect(page()).toContain('title="Drives"');
  expect(page()).toContain("Review requests, prepare drafts and run every placement drive from one workspace.");
 });
 it("TPO-drives-22 create and edit pages use exact Create drive and Edit drive names",()=>{
  expect(source("src/components/placements/placement-job-create-workspace.tsx")).toContain('title="Create drive"');
  expect(source("src/app/(authenticated)/tpo/placements/jobs/[jobId]/edit/page.tsx")).toContain('title="Edit drive"');
  expect(source("src/components/placements/placement-job-create-workspace.tsx")).toContain("Back to drives");
  expect(create()).toContain('aria-label="Publish after reviewing the drive"');
 });
 it("TPO-drives-23 company picker filters named trusted college relationships",()=>{
  expect(create()).toContain("companySearch");
  expect(create()).toContain("No matching college employer");
 });
 it("TPO-drives-24 potential existing employer conflicts are surfaced before submit",()=>{
  expect(create()).toContain("matchingEmployer");
  expect(create()).toContain("This may already be");
 });
 it("TPO-drives-26 clone creates a NEW draft after explicit consequence notice",()=>{
  const clone=source("src/components/placements/tpo-drive-clone-action.tsx");
  expect(clone).toContain("/clone");
  expect(clone).toContain("Dates, candidates, rounds, results, offers and external links are cleared");
  expect(clone).toContain("confirmed:true");
 });
 it("TPO-drives-32 CTC fixed variable and stipend facts appear in the creation form",()=>{
  expect(create()).toContain('name="fixedLpa"');
  expect(create()).toContain('name="variableLpa"');
  expect(create()).toContain('name="stipendPerMonthInr"');
 });
 it("TPO-drives-33 dream category is visible from persisted drive flag",()=>{
  expect(create()).toContain('name="isDream"');
  expect(page()).toContain('job.isDream ? " · Dream" : " · Regular"');
 });
 it("TPO-drives-40 setup review rail has four steps",()=>{
  expect(create()).toContain("Drive setup review");
  expect(create()).toContain("Step {index+1} of 4");
  expect(create()).toContain("Eligibility reach is checked");
 });
 it("TPO-drives-R05 validation explicitly identifies the offending field",()=>{
  expect(create()).toContain("apiFetch<Record<string,unknown>>");
  expect(create()).toContain("Minimum CGPA");
  expect(create()).toContain('max={name === "minCgpa" ? 10');
 });
 it("TPO-drives-42 future deadline pay and HTTPS preflight happen before creating a company",()=>{
  const body=create();
  expect(body).toContain("if(reviewPublish){");
  expect(body).toContain("Set a future application deadline before publishing.");
  expect(body).toContain("Add a CTC figure or stipend for at least one role before publishing.");
  expect(body).toContain("Add a valid HTTPS employer application link before publishing.");
  expect(body).toContain('if(companyMode==="EXISTING"&&!companies.some(company=>company.relationshipId===companyRelationshipId))');
   expect(body).toContain('if(companyMode==="NEW"&&String(data.get("companyName")??"").trim().length<2)');
   expect(body.indexOf("if(reviewPublish){")).toBeLessThan(body.indexOf('if (companyMode === "NEW" && !createdJobRef.current)'));
 });
 it("TPO-drives-43 JSON provider errors and network failures cannot display machine codes during draft creation",()=>{
  const body=create();
  expect(body).toContain("apiFetch<Record<string,unknown>>");
  expect(body).not.toContain('code.toLowerCase().replaceAll("_", " ")');
 });
 it("TPO-drives-R06 empty-state and header both link to Create drive",()=>{
  expect(page()).toContain('href="/tpo/placements/new"');
  expect(page().match(/Create drive/g)?.length).toBeGreaterThanOrEqual(2);
 });
});
