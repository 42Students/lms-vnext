import {readFileSync} from "node:fs";
import {join} from "node:path";
import {describe,expect,it} from "vitest";
/** Source regression coverage; CI and browser acceptance are separate. */
const source=(path:string)=>readFileSync(join(process.cwd(),path),"utf8");
describe("chat-3 final sprint TPO Companies",()=>{
 it("TPO-companies-07 confirmed yearly hiring history is computed from records",()=>{
  const code=source("src/app/(authenticated)/tpo/companies/[companyId]/page.tsx");
  expect(code).toContain("hiringPulse.hiredPerYear");
  expect(code).toContain("hiringPulse.yearsHiring");
  expect(code).toContain("Repeat hiring relationship");
 });
 it("TPO-companies-08 company drives include applied/offers, search and CSV",()=>{
  const code=source("src/components/tpo/tpo-company-memory-workspace.tsx");
  expect(code).toContain("drive.applied");
  expect(code).toContain("drive.offers");
  expect(code).toContain("companyDriveCsv");
  expect(code).toContain("driveSearch");
 });
 it("TPO-companies-10 company drilldown targets the real job detail route",()=>{
  const code=source("src/components/tpo/tpo-company-memory-workspace.tsx");
  expect(code).toContain("/tpo/placements/jobs/");
 });
 it("TPO-companies-11 company shares show documented history or truthful empty state",()=>{
  const code=source("src/components/tpo/tpo-company-memory-workspace.tsx");
  expect(code).toContain("company.documents");
  expect(code).toContain("Nothing shared yet");
 });
 it("TPO-companies-12 contact stage labels are human readable",()=>{
  const code=source("src/components/tpo/tpo-company-memory-workspace.tsx");
  expect(code).toContain("Drive planned");
  expect(code).toContain("person.stage");
  expect(code).toContain("Invited");
 });
 it("TPO-companies-13 canonical company has create-drive action with employer prefill",()=>{
  const code=source("src/app/(authenticated)/tpo/companies/[companyId]/page.tsx");
  expect(code).toContain("/tpo/placements/new?company=");
  expect(code).toContain("Create drive");
 });
 it("TPO-companies-14 company-aware New action offers lead, drive and followup",()=>{
  const code=source("src/components/tpo/tpo-company-memory-workspace.tsx");
  expect(code).toContain("New recruiter lead for ");
  expect(code).toContain("New drive for ");
  expect(code).toContain("Follow-up");
 });
 it("TPO-companies-15 company communication status has optimistic and rollback semantics",()=>{
  const code=source("src/components/tpo/recruiter-leads-workspace.tsx");
  expect(code).toContain("changeCompanyCommunication");
  expect(code).toContain("companyCommunicationFilter");
  expect(code).toContain("Couldn't save. Retry this company status.");
 });
 it("TPO-companies-16 company list has search, contact, history and alias filters",()=>{
  const code=source("src/components/tpo/recruiter-leads-workspace.tsx");
  expect(code).toContain("companySearch");
  expect(code).toContain("companyContacts");
  expect(code).toContain("companyHistory");
  expect(code).toContain("companyAliases");
 });
 it("TPO-companies-17 company list shows named people and contact action",()=>{
  const code=source("src/components/tpo/recruiter-leads-workspace.tsx");
  expect(code).toContain("company.people");
  expect(code).toContain("Add a contact");
  expect(code).toContain("Drives that ran");
 });
 it("TPO-companies-18 Engage Companies tab includes filtered export and count",()=>{
  const code=source("src/components/tpo/recruiter-leads-workspace.tsx");
  expect(code).toContain("exportCompanies");
  expect(code).toContain("tpoCompanyDirectoryCsv");
  expect(code).toContain("Companies (");
 });
 it("TPO-companies-24 TPO company route retains parent navigation highlight",()=>{
  const code=source("src/components/shell/legacy-sidebar-active-model.ts");
  expect(code).toContain("companies");
 });
 it("TPO-companies-26 create-company confirmation provides dialog Escape and keyboard focus trap",()=>{
  const code=source("src/components/tpo/tpo-company-create-form.tsx");
  expect(code).toContain("e.key===\"Escape\"");
  expect(code).toContain("aria-modal");
  expect(code).toContain("modalRef");
 });
 it("TPO-companies-27 canonical directory offers export, sort and create-drive action",()=>{
  const code=source("src/app/(authenticated)/tpo/companies/page.tsx");
  expect(code).toContain("Export companies CSV");
  expect(code).toContain("Create drive");
  expect(code).toContain("name=\"sort\"");
 });
 it("TPO-companies-28 canonical hiring history uses scoped hiring-pulse evidence",()=>{
  const code=source("src/app/(authenticated)/tpo/companies/[companyId]/page.tsx");
  expect(code).toContain("learner");
  expect(code).toContain("hiringPulse");
 });
 it("TPO-companies-R02 link card has employer domain registration and error state",()=>{
  const code=source("src/components/tpo/tpo-public-join-link-card.tsx");
  expect(code).toContain("Add domain");
  expect(code).toContain("Email domains: @");
  expect(code).toContain("Couldn't load the company link");
 });
 it("TPO-companies-R05 canonical company drives order newest first",()=>{
  const code=source("src/modules/placements/tpo-companies-view-service.ts");
  expect(code).toContain("desc(placementJobs.createdAt)");
 });
 it("TPO-companies-05 does not misrepresent private pairwise TPO threads as a shared company conversation",()=>{
  const service=source("src/modules/placements/tpo-team-conversation-service.ts");
  expect(service).toContain("startedByMembershipId");
  expect(service).toContain("invitedMembershipId");
  expect(service).toContain("hasPlacementTeamMembership");
  expect(service).toContain('eq(placementTpoInternalThreads.collegeId, college.id)');
  expect(service).not.toContain('companyRelationshipId:placementTpoInternalThreads.companyRelationshipId');
  // This remains OPEN until a new verified object-scoped company thread exists.
 });
 it("TPO-companies-R02 failed join link creation explains missing domain and permits Retry",()=>{
  const card=source("src/components/tpo/tpo-public-join-link-card.tsx");
  expect(card).toContain("Add the company's email domain first, so only its people can join.");
  expect(card).toContain("router.refresh()");
  expect(card).toContain("companyName??status.domain");
  expect(card).toContain("Retry");
 });
 it("TPO-companies-28 canonical hiring cards never display candidate names in company summary",()=>{
  const page=source("src/app/(authenticated)/tpo/companies/[companyId]/page.tsx");
  expect(page).not.toContain("offer.candidateName");
  expect(page).not.toContain("offer.learnerName");
  expect(page).toContain("Company hiring cards");
  expect(page).toContain("Joining");
  expect(page).toContain("Confirmed joined learners");
 });
 it("TPO-companies-13 company identity prefill is consumed by authorized create workspace",()=>{
  const detail=source("src/app/(authenticated)/tpo/companies/[companyId]/page.tsx");
  const create=source("src/app/(authenticated)/tpo/placements/new/page.tsx");
  const form=source("src/components/placements/placement-job-create-form.tsx");
  expect(detail).toContain('/tpo/placements/new?company=');
  expect(create).toContain('initialCompanyName');
  expect(form).toContain('initialCompanyName');
  expect(form).toContain('companyRelationshipId');
 });
});
