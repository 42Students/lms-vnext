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
  expect(show).toContain('rel="noopener noreferrer"');
 });
 it("TPO-drives-41 blocks both native unload and in-app navigation while unsaved",()=>{
  const guard=source("src/components/placements/use-unsaved-drive-guard.ts");
  expect(guard).toContain('window.addEventListener("beforeunload", beforeUnload)');
  expect(guard).toContain('document.addEventListener("click",onAnchorClick,true)');
  expect(guard).toContain("window.confirm");
  expect(guard).toContain("event.preventDefault()");
  expect(guard).toContain("event.stopPropagation()");
 });
 it("TPO-drives-41 exposes an honest IST local-save timestamp distinct from server persistence",()=>{
  const form=source("src/components/placements/placement-job-create-form.tsx");
  expect(form).toContain("setLastLocalSaveAt(Date.now())");
  expect(form).toContain("Local draft saved at ");
  expect(form).toContain("not yet submitted to the server.");
  expect(form).toContain("timeZone:\"Asia/Kolkata\"");
 });

 it("TPO-drives-43 stores an uncertain create outcome after timeout instead of retrying blindly",()=>{
  const form=source("src/components/placements/placement-job-create-form.tsx");
  expect(form).toContain('if(reason instanceof FriendlyFetchError&&[0,499,504].includes(reason.status))');
  expect(form).toContain('localStorage.setItem(uncertainKey,"1")');
  expect(form).toContain('disabled={pending || !activeSeason || uncertainCreate}');
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
  expect(page).toContain("Recorded: happened outside");
  expect(page).toContain("These are historical records, not live jobs.");
  expect(page).toContain("No outside-platform drives recorded for this college.");
  expect(drives).toContain('href="/tpo/placements/recorded-outside"');
 });

});
