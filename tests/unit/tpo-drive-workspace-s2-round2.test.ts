import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";
import {cloneTpoEligibilityAudience} from "@/modules/placements/tpo-drive-clone-eligibility-model";
import {evaluateTpoDriveLifecycle,tpoDriveReadinessMessage,type TpoDriveReadinessFacts} from "@/modules/placements/tpo-drive-lifecycle-model";
import {evaluateTpoDriveDeadline} from "@/modules/placements/tpo-drive-deadline-model";
import {projectTpoDriveApplicationsExport,tpoApplicantExportSearchPattern} from "@/modules/placements/tpo-drive-applications-export-model";
import {bulkTpoRoundResultSchema,summarizeBulkRoundResults,resolveBulkRoundLearnerTokens} from "@/modules/placements/tpo-bulk-round-result-model";
import {projectOfferRegister,offerRulesCheck,offerRegisterQuery} from "@/modules/placements/tpo-drive-offer-register-model";
import {projectTpoRoundFacts} from "@/modules/placements/tpo-round-facts-model";
import {tpoDriveRequestDecisionSchema,TPO_DRIVE_REQUEST_DECISION_COPY} from "@/modules/placements/tpo-drive-request-decision-model";
import {tpoDriveTabs,tpoDriveMoreTabs,tpoDriveTabHref} from "@/modules/placements/tpo-drive-tab-model";
import {projectTpoDriveScheduleWarnings} from "@/modules/placements/tpo-drive-schedule-warnings-model";
import {tpoApplicantPipelineParams} from "@/modules/placements/tpo-applicant-pipeline-model";
const jobId="11111111-1111-4111-8111-111111111111";
const applicationId="22222222-2222-4222-8222-222222222222";
const source=(path:string)=>readFileSync(path,"utf8");
const baseline:TpoDriveReadinessFacts={jobStatus:"DRAFT",seasonActive:true,companyActive:true,
 roleCount:1,evaluativeRoundCount:1,policyPersisted:true,deadlineValid:true,
 deadlinePresent:true,payPresent:true,externalUrlPresent:true,
 appliedResultCount:0,acceptedOfferCount:0};
describe("TPO drive workspace S2 verification round 2",()=>{
 it("TPO-drive-workspace-05 drops old cohorts and passing years from cloned drafts",()=>{
  const r=cloneTpoEligibilityAudience({allowedCohortIds:["old"],
   allowedPassingYears:[2090,2098,2099,2100,2100,2109]},2099);
  expect(r.allowedCohortIds).toEqual([]);
  expect(r.allowedPassingYears).toEqual([2099,2100,2109]);
  expect(r.requiresCohortReview).toBe(true);
 });
 it("TPO-drive-workspace-14 requires a future deadline, package, and external link",()=>{
  expect(evaluateTpoDriveLifecycle("PUBLISH",baseline).allowed).toBe(true);
  const r=evaluateTpoDriveLifecycle("PUBLISH",{...baseline,deadlinePresent:false,
   deadlineValid:false,payPresent:false,externalUrlPresent:false});
  expect(r.blockers).toContain("APPLICATION_DEADLINE_MISSING");
  expect(r.blockers).toContain("PACKAGE_MISSING");
  expect(r.blockers).toContain("EXTERNAL_APPLICATION_LINK_MISSING");
  expect(tpoDriveReadinessMessage("PACKAGE_MISSING")).toContain("package");
 });
 it("TPO-drive-workspace-16 permits a first deadline but rejects past or backwards changes",()=>{
  expect(evaluateTpoDriveDeadline("PUBLISHED","ACTIVE",null,
   "2099-07-01T12:00:00Z","2099-06-01T00:00:00Z")).toBe("ALLOW");
  expect(evaluateTpoDriveDeadline("PUBLISHED","ACTIVE",null,
   "2099-05-01T12:00:00Z","2099-06-01T00:00:00Z")).toBe("IN_PAST");
  expect(evaluateTpoDriveDeadline("PUBLISHED","ACTIVE",
   "2099-08-01T12:00:00Z","2099-07-01T12:00:00Z","2099-06-01T00:00:00Z")).toBe("NOT_LATER");
 });
 it("TPO-drive-workspace-29 carries request, no-show and college inclusion flags to CSV",()=>{
  const row={applicationId,studentName:"A",roleTitle:"Intern",status:"SUBMITTED",
   screeningStatus:"PENDING",screeningUpdatedAt:null,eligibilityStatus:"ELIGIBLE",
   channel:"INTERNAL",submittedAt:"2099-01-01T12:00:00Z",
   pendingWithdrawal:true,noShow:true,placedElsewhere:true,addedByCollege:true};
  const r=projectTpoDriveApplicationsExport([row],"Intern drive",{exportAll:true});
  for(const label of ["Withdrawal requested","No-show","Accepted offer elsewhere","Added by college"])
   expect(r.csv).toContain(label);
  expect(r.rows[0]).toMatchObject({noShow:true,pendingWithdrawal:true});
 });
 it("TPO-drive-workspace-41 validates distinct waitlist outcomes and honest staging counts",()=>{
  const r={confirmed:true,entries:[{expectedCurrentResultId:null,result:{
   applicationId,outcome:"HOLD",waitlistRank:3,candidateMessage:"Please stand by"}}]};
  expect(bulkTpoRoundResultSchema.safeParse(r).success).toBe(true);
  expect(bulkTpoRoundResultSchema.safeParse({...r,confirmed:false}).success).toBe(false);
  expect(bulkTpoRoundResultSchema.safeParse({...r,entries:[...r.entries,...r.entries]}).success).toBe(false);
  expect(summarizeBulkRoundResults([{applicationId,status:"staged"},{applicationId:"x",status:"ineligible"}]))
   .toEqual({staged:1,ineligible:1});
 });
 it("TPO-drive-workspace-49 filters registered offers by CTC range, type and branch",()=>{
  const asOf=new Date("2099-04-01T00:00:00Z");
  const offer={id:jobId,status:"ISSUED",roleTitle:"Intern",kind:"OFFER",annualCtcInr:900000,
   issuedAt:asOf,respondedAt:null,expiresAt:new Date("2099-04-03T00:00:00Z")};
  const candidate={membershipId:applicationId,displayName:"Arun",email:"arun@example.edu",
   phone:null,rollNumber:"A123",batch:"2099",branch:"CSE"};
  const facts=[{offer,candidate,joining:null}];
  expect(projectOfferRegister(facts,"ALL",1,"CSE","ALL",asOf,"OFFER","DUE_SOON",8,10).rows).toHaveLength(1);
  expect(projectOfferRegister(facts,"ALL",1,"","ALL",asOf,"OFFER","ALL",10,20).rows).toHaveLength(0);
  expect(offerRegisterQuery.safeParse({jobId,minCtcLpa:12,maxCtcLpa:10}).success).toBe(false);
 });
 it("TPO-drive-workspace-50 never infers verified placement from an unaccepted LOI",()=>{
  expect(offerRulesCheck("ISSUED","LOI")).toContain("placement count not established");
  expect(offerRulesCheck("ACCEPTED","OFFER")).toContain("review college");
  expect(offerRulesCheck("WITHDRAWN","OFFER")).toContain("not held");
 });
 it("TPO-drive-workspace-68 limits the drive audit reader to a scoped 100 events",()=>{
  const code=source("src/modules/placements/tpo-drive-about-service.ts");
  expect(code).toContain("eq(activityEvents.subjectId,jobId)");
  expect(code).toContain("limit(100)");
  expect(code).toContain("feed:feed.map");
 });
 it("TPO-drive-workspace-R02 treats applicant-search SQL wildcard characters literally",()=>{
  expect(tpoApplicantExportSearchPattern("a_b%")).toBe("%a\\_b\\%%");
  expect(tpoApplicantPipelineParams.safeParse({jobId,search:"student"}).success).toBe(true);
  expect(tpoApplicantPipelineParams.safeParse({jobId,search:"a".repeat(101)}).success).toBe(false);
 });
 it("TPO-drive-workspace-R03 rejects duplicated learners and identical waitlist ranks",()=>{
  const a={expectedCurrentResultId:null,result:{applicationId,outcome:"HOLD",
   waitlistRank:1,candidateMessage:"Please await your turn"}};
  const b={expectedCurrentResultId:null,result:{...a.result,
   applicationId:"33333333-3333-4333-8333-333333333333",waitlistRank:2}};
  expect(bulkTpoRoundResultSchema.safeParse({confirmed:true,entries:[a,b]}).success).toBe(true);
  expect(bulkTpoRoundResultSchema.safeParse({confirmed:true,entries:[a,
   {...b,result:{...b.result,waitlistRank:1}}]}).success).toBe(false);
 });
 it("TPO-drive-workspace-12 enforces confirmed recruiter request decisions",()=>{
  expect(TPO_DRIVE_REQUEST_DECISION_COPY.approve).toBe("Approve for later");
  expect(tpoDriveRequestDecisionSchema.safeParse({requestId:jobId,action:"APPROVE_LATER",
   expectedStatus:"REQUEST",reason:"Checked by placement cell",confirmed:true}).success).toBe(true);
  expect(tpoDriveRequestDecisionSchema.safeParse({requestId:jobId,action:"DECLINE",
   expectedStatus:"REQUEST",reason:"No",confirmed:false}).success).toBe(false);
 });
 it("TPO-drive-workspace-20 counts persisted scoped application journey stages",()=>{
  const code=source("src/modules/placements/tpo-drive-journey-service.ts");
  for(const label of ["Registered & eligible","Applied","Shortlisted","Interviewed","Offered","Placed"])
   expect(code).toContain(label);
  expect(code).toContain("eq(placementApplications.jobId,jobId)");
 });
 it("TPO-drive-workspace-45 displays staged and applied result counts with a safe venue fallback",()=>{
  const r=projectTpoRoundFacts({id:jobId,name:"Interview",sequence:1,status:"SCHEDULED",
   mode:"ON_CAMPUS",scheduledAt:null,resultsDueAt:null,venue:"",
   meetingUrl:null,platform:null,testUrl:null,durationMinutes:null,whatToBring:null,
   participants:[{result:{status:"STAGED"}},{result:{status:"APPLIED"}},{result:null}]});
  expect(r.status).toBe("Scheduled");
  expect(r.place).toBe("Venue to be told");
  expect(r.students).toBe(3);
  expect(r.results).toContain("waiting to apply");
 });
 it("TPO-drive-workspace-52 retains the audited cascade-undo service",()=>{
  const code=source("src/modules/placements/offer-cascade-undo-service.ts");
  expect(code).toContain("undoPlacementOfferCascade");
  expect(code).toContain("transaction(");
 });
 it("TPO-drive-workspace-01 navigates the existing scoped drive subpages",()=>{
  const tabs=tpoDriveTabs(jobId);
  for(const label of ["Applicants","Rounds","Offers","Drive day","About this drive"])
   expect(tabs.map(x=>x.label)).toContain(label);
  expect(tpoDriveTabHref(jobId,"offers")).toContain("/offers");
  expect(tpoDriveMoreTabs(jobId).map(x=>x.label)).toContain("Change requests");
 });
 it("TPO-drive-workspace-38 never claims a conflict-free venue without an assessment",()=>{
  const projected=projectTpoDriveScheduleWarnings(null,[jobId]);
  expect(projected.state).toBe("UNAVAILABLE");
  expect(projected.warnings).toEqual([]);
 });
 it("TPO-drive-workspace-41 resolves exact roll-number paste only when identity is unique",()=>{
  const roster=[{applicationId,rollNumber:"CSE-123"},
   {applicationId:"33333333-3333-4333-8333-333333333333",rollNumber:"ECE-124"}];
  expect(resolveBulkRoundLearnerTokens("CSE-123,ECE-124",roster).ids)
   .toEqual([applicationId,"33333333-3333-4333-8333-333333333333"]);
  expect(resolveBulkRoundLearnerTokens("CSE-123 "+applicationId,roster).error).toContain("more than once");
  expect(resolveBulkRoundLearnerTokens("UNKNOWN",roster).error).toContain("ambiguous");
  expect(resolveBulkRoundLearnerTokens("CSE-123",[
   ...roster,{applicationId:"44444444-4444-4444-8444-444444444444",rollNumber:"CSE-123"}]).ids)
   .toEqual([]);
 });

});
