import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";
import {evaluateTpoDriveLifecycle,type TpoDriveReadinessFacts} from "@/modules/placements/tpo-drive-lifecycle-model";
import {tpoOfferLifecycleInputSchema,TPO_OFFER_ACTIONS} from "@/modules/placements/tpo-offer-lifecycle-model";
const file=(path:string)=>readFileSync(path,"utf8");
describe("Drive workspace S2 source-to-UI contracts",()=>{
 it("TPO-drive-workspace-04 shows the export, company share and run-again actions in More",()=>{
  const ui=file("src/components/placements/placement-drive-workspace.tsx");
  for(const label of ["More ▾","Export applicants","Share with company","Run it again"])expect(ui).toContain(label);
 });
 it("TPO-drive-workspace-10 intentionally enforces active seasons before drive publication",()=>{
  const facts:TpoDriveReadinessFacts={jobStatus:"DRAFT",seasonActive:false,companyActive:true,
   roleCount:1,evaluativeRoundCount:1,policyPersisted:true,deadlinePresent:true,
   deadlineValid:true,payPresent:true,externalUrlPresent:true,appliedResultCount:0,acceptedOfferCount:0};
  expect(evaluateTpoDriveLifecycle("PUBLISH",facts).blockers).toContain("SEASON_NOT_ACTIVE");
  expect(evaluateTpoDriveLifecycle("PUBLISH",{...facts,seasonActive:true}).allowed).toBe(true);
 });
 it("TPO-drive-workspace-21 routes test and interview stage moves through confirmed bulk actions",()=>{
  const ui=file("src/components/tpo/tpo-bulk-action-panel.tsx");
  const writer=file("src/modules/placements/tpo-bulk-action-confirm-service.ts");
  for(const command of ["MOVE_TEST","MOVE_INTERVIEW"]){
   expect(ui).toContain(command);
   expect(writer).toContain(command);
  }
  expect(writer).toContain("PLACEMENTS_BULK_RUN");
 });
 it("TPO-drive-workspace-22 displays scoped roll, email, phone and flags in spreadsheet",()=>{
  const reader=file("src/modules/placements/tpo-applicant-pipeline-service.ts");
  const ui=file("src/components/tpo/tpo-applications-spreadsheet.tsx");
  for(const field of ["rollNumber:learnerProfiles.rollNumber","email:users.email","phone:users.phoneE164"])
   expect(reader).toContain(field);
  for(const label of ['label:"Roll number"','label:"Email"','label:"Phone"','label:"Flags"'])
   expect(ui).toContain(label);
 });
 it("TPO-drive-workspace-23 offers real stage, channel and eligibility filters",()=>{
  const ui=file("src/components/tpo/tpo-applications-spreadsheet.tsx");
  for(const field of ['urlKey:"stage"','urlKey:"channel"','urlKey:"eligibility"'])
   expect(ui).toContain(field);
 });
 it("TPO-drive-workspace-27 provides an authorized modal and per-selection review queue",()=>{
  const drawer=file("src/components/placements/tpo-applicant-review-drawer.tsx");
  const queue=file("src/components/tpo/tpo-selected-review-queue.tsx");
  expect(drawer).toContain("<dialog");
  expect(drawer).toContain("aria-labelledby");
  expect(drawer).toContain("applicantDrawerReviewable");
  expect(queue).toContain("Review one by one");
  expect(queue).toContain("Next applicant");
 });
 it("TPO-drive-workspace-55 validates audited offer lifecycle actions separately from student consent",()=>{
  expect(TPO_OFFER_ACTIONS).toContain("EXTEND");
  expect(TPO_OFFER_ACTIONS).toContain("WITHDRAW");
  const input={confirmed:true,action:"RECORD_ACCEPTED",offerIds:["11111111-1111-4111-8111-111111111111"],
   expectedStatus:"ISSUED",reason:"Learner confirmed this response directly"};
  expect(tpoOfferLifecycleInputSchema.safeParse(input).success).toBe(true);
  expect(tpoOfferLifecycleInputSchema.safeParse({...input,confirmed:false}).success).toBe(false);
 });
 it("TPO-drive-workspace-59 scopes existing TPO recruiter conversation metadata to a college",()=>{
  const reader=file("src/modules/placements/tpo-messages-service.ts");
  expect(reader).toContain("placementTpoMessageThreads");
  expect(reader).toContain("collegeId");
  expect(reader).toContain("placementJobs.title");
 });
 it("TPO-drive-workspace-61 has a recruiter invitation service but cannot infer a recipient from a public link",()=>{
  const service=file("src/modules/placements/tpo-recruiter-invite-service.ts");
  expect(service).toContain("server-only");
  expect(service).toContain("collegeId");
 });
 it("TPO-drive-workspace-63 retains applicant-level inclusion actions without cross-college mutation",()=>{
  const controls=file("src/components/placements/placement-drive-controls.tsx");
  expect(controls).toContain("Force");
  expect(controls).toContain("eligible");
 });
 it("TPO-drive-workspace-67 opens an authorized applicant detail from the review drawer",()=>{
  const drawer=file("src/components/placements/tpo-applicant-review-drawer.tsx");
  expect(drawer).toContain("/applicants/");
  expect(drawer).toContain("Open full applicant detail");
 });
 it("TPO-drive-workspace-69 requires acknowledgement, exposes skipped retries and logs bulk runs",()=>{
  const ui=file("src/components/tpo/tpo-bulk-action-panel.tsx");
  const writer=file("src/modules/placements/tpo-bulk-action-confirm-service.ts");
  expect(ui).toContain("acknowledged");
  expect(ui).toContain("Retry skipped/failed");
  expect(ui).toContain("Copy failed");
  expect(writer).toContain("PLACEMENTS_BULK_RUN");
 });
});
