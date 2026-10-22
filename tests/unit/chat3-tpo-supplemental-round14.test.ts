import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {join} from "node:path";
import {placementLegacyPostingDetailsSchema} from "@/modules/placements/placement-legacy-posting-model";
const source=(path:string)=>readFileSync(join(process.cwd(),path),"utf8");
const details={
 campusPool:{hostCollege:"City Engineering College",reportingTime:"2026-11-09T03:30:00.000Z",travelNote:"Use the main gate"},
 portal:{studentsRegisterSeparately:true,name:"Employer careers",url:"https://careers.example.com/register"},
 skillsWanted:["Java","PostgreSQL","TypeScript"],
};
describe("TPO supplemental job metadata",()=>{
 it("TPO-drives-29 saves optional college pool reporting and travel details without a new work-mode enum",()=>{
  const result=placementLegacyPostingDetailsSchema.parse(details);
  expect(result.campusPool).toEqual(details.campusPool);
  expect(placementLegacyPostingDetailsSchema.safeParse({
   ...details,campusPool:{...details.campusPool,hostCollege:"X".repeat(161)},
  }).success).toBe(false);
 });
 it("TPO-drives-29 requires an ISO reporting instant, not browser-local guessed timezone",()=>{
  expect(placementLegacyPostingDetailsSchema.safeParse({
   ...details,campusPool:{...details.campusPool,reportingTime:"2026-11-09 09:00"},
  }).success).toBe(false);
 });
 it("TPO-drives-30 records a separate HTTPS portal with a named employer registration action",()=>{
  const result=placementLegacyPostingDetailsSchema.parse(details);
  expect(result.portal).toEqual(details.portal);
  for(const portal of [
   {studentsRegisterSeparately:true,name:"",url:"https://careers.example.com"},
   {studentsRegisterSeparately:true,name:"Careers",url:""},
   {studentsRegisterSeparately:true,name:"Careers",url:"http://careers.example.com"},
   {studentsRegisterSeparately:true,name:"Careers",url:"https://user:password@careers.example.com/jobs"},
  ])expect(placementLegacyPostingDetailsSchema.safeParse({...details,portal}).success).toBe(false);
 });
 it("TPO-drives-38 skill tags reject duplicates, overlong tags and more than 30 skills",()=>{
  for(const skillsWanted of [["Java","java"],["J".repeat(51)],Array.from({length:31},(_,i)=>"Skill "+i)])
   expect(placementLegacyPostingDetailsSchema.safeParse({...details,skillsWanted}).success).toBe(false);
 });
 it("TPO-drives-29/30/38 read and write supplemental details in the scoped job JSONB",()=>{
  const schema=source("src/db/schema/placements.ts");
  const create=source("src/components/placements/placement-job-create-form.tsx");
  const show=source("src/components/placements/placement-drive-workspace.tsx");
  expect(schema).toContain("campusPool?:{hostCollege:");
  expect(schema).toContain("portal?:{studentsRegisterSeparately:");
  expect(schema).toContain("skillsWanted?:string[]");
  for(const field of ["poolHostCollege","poolReportingTime","poolTravelNote",
    "studentsRegisterSeparately","portalName","portalUrl","skillsWanted"])
   expect(create).toContain('name="'+field+'"');
  expect(show).toContain("job.legacyPostingDetails.skillsWanted");
  expect(show).toContain('<ThirdPartyLink href={job.legacyPostingDetails.portal.url} label="Open employer portal"/>');
  const safe=source("src/components/ui/third-party-link.tsx");
  expect(safe).toContain('url.protocol === "https:"');
  expect(safe).toContain('!url.username && !url.password');
  expect(safe).toContain('href={safeHref}');
  expect(safe).toContain('aria-label={ariaLabel ?');
  expect(safe).not.toContain('target="_blank"');
  expect(safe).toContain("Copy link");
 });
 it("TPO-drives-41 blocks both native unload and in-app navigation while unsaved",()=>{
  const guard=source("src/components/placements/use-unsaved-drive-guard.ts");
  expect(guard).toContain('window.addEventListener("beforeunload", beforeUnload)');
  expect(guard).toContain('document.addEventListener("click",onAnchorClick,true)');
  expect(guard).toContain("createElement(ConfirmDialog");
  expect(guard).toContain('confirmLabel:"Leave without saving"');
  expect(guard).toContain("router.push(url.pathname+url.search+url.hash)");
  expect(guard).toContain("event.preventDefault()");
  expect(guard).toContain("event.stopPropagation()");
 });
 it("TPO-drives-41 exposes an honest IST local-save timestamp distinct from server persistence",()=>{
  const form=source("src/components/placements/placement-job-create-form.tsx");
  expect(form).toContain("setLastLocalSaveAt(Date.now())");
  expect(form).toContain("Changes not saved to the server · Browser backup at ");
  expect(form).toContain("Not saved yet · Your changes are backed up locally");
  expect(form).toContain("timeZone:\"Asia/Kolkata\"");
 });

 it("TPO-drives-43 stores an uncertain create outcome after timeout instead of retrying blindly",()=>{
  const form=source("src/components/placements/placement-job-create-form.tsx");
  expect(form).toContain('if(reason instanceof FriendlyFetchError&&[0,499,504].includes(reason.status))');
  expect(form).toContain('localStorage.setItem(uncertainKey,"1")');
  expect(form).toContain('disabled={pending || !activeSeason || uncertainCreate || loadingCopy}');
  expect(form).toContain("The previous create request may have succeeded.");
  expect(form).toContain("I checked Drives — allow another attempt");
  expect(form).toContain('createDriveWithKnownResponse({');
 });

 it("TPO-drives-31 lists only the current college's outside records without publishing them as jobs",()=>{
  const service=source("src/modules/placements/recorded-outside-service.ts");
  const page=source("src/app/(authenticated)/tpo/placements/recorded-outside/page.tsx");
  const drives=source("src/app/(authenticated)/tpo/placements/lifecycle/page.tsx");
  expect(service).toContain("listTpoRecordedOutsideDrives");
  expect(service).toContain('eq(placementOutsideDriveRecords.collegeId,collegeId)');
  expect(service).toContain('eq(placementCompanyRelationships.collegeId,collegeId)');
  expect(service).toContain('eq(membershipRoles.role,"TPO")');
  expect(service).toContain(".limit(101)");
  expect(page).toContain("Recorded outside drives");
  expect(page).toContain("Add students and results");
  expect(page).toContain("These are historic records, not published jobs; they are excluded from learner application reminders.");
  expect(page).toContain("No outside-platform drives have been recorded yet.");
  expect(drives).toContain('/tpo/placements/recorded-outside');
  expect(page).toContain("listTpoOutsideDriveRecords(context)");
 });

 it("TPO-drives-52 quick draft shares strict IST parsing and safe errors with full create",()=>{
  const quick=source("src/components/tpo/tpo-draft-drive-step-one-form.tsx");
  expect(quick).toContain("driveDeadlineIstToIso(deadline)");
  expect(quick).toContain('apiFetch<{id:string;status:string}>');
  expect(quick).toContain("tpoDriveFormErrorMessage(cause)");
  expect(quick).toContain("title.trim().length < 3");
 });
 it("TPO-drives-43/52 quick create requires a duplicate check after unknown POST outcome",()=>{
  const quick=source("src/components/tpo/tpo-draft-drive-step-one-form.tsx");
  expect(quick).toContain("setUnknownCreate(true)");
  expect(quick).toContain('[0,499,504].includes(cause.status)');
  expect(quick).toContain('disabled={pending || unknownCreate || !companyRelationshipId || jobTypesState !== "ready" || !jobTypeLabel}');
  expect(quick).toContain("I checked for duplicates");
 });

 it("TPO-drives-39 persists actual pending preset rounds with readback dedupe",()=>{
  const form=source("src/components/placements/placement-job-create-form.tsx");
  const presets=source("src/modules/placements/tpo-drive-round-presets.ts");
  expect(presets).toContain("TALK_TEST_INTERVIEW");
  expect(presets).toContain("TEST_TECHNICAL_HR");
  expect(presets).toContain("TEST_GD_INTERVIEW");
  expect(form).toContain("plannedTpoRoundRows(roundPreset)");
  expect(form).toContain("saved.rounds.length");
  expect(form).toContain("planned.slice(saved.rounds.length)");
  expect(form).toContain('"POST",{kind:round.kind,name:round.name}');
 });
 it("TPO-drives-44 quick and full create both format safe API messages",()=>{
  const full=source("src/components/placements/placement-job-create-form.tsx");
  const quick=source("src/components/tpo/tpo-draft-drive-step-one-form.tsx");
  const messages=source("src/modules/placements/tpo-drive-form-error-copy.ts");
  expect(full).toContain("tpoDriveFormErrorMessage(error)");
  expect(quick).toContain("tpoDriveFormErrorMessage(cause)");
  expect(messages).toContain("PLACEMENT_JOB_INVALID_DEADLINE");
  expect(messages).toContain("PLACEMENT_COMPANY_RELATIONSHIP_NOT_FOUND");
  expect(messages).toContain('const FALLBACK = "We could not save this drive. Check your drafts and try again."');
 });

});
