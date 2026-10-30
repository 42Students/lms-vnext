import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";
const source=(path:string)=>readFileSync(path,"utf8");

describe("chat-14 recruiter ownership and private review gap closure",()=>{
 it("REC-home-drives-38 shares enrolled branch/phone only when college columns allow each",()=>{
   const service=source("src/modules/placements/hr-job-read-service.ts");
   const page=source("src/app/(authenticated)/hr/placements/jobs/[jobId]/page.tsx");
   expect(service).toContain('share?.columns?.includes("branch")');
   expect(service).toContain('share?.columns?.includes("phone")');
   expect(service).toContain('eq(learnerProgramEnrollments.status,"ACTIVE")');
   expect(service).toContain("eq(departments.collegeId,workspace.college.id)");
   expect(service).toContain("branchSet.get(membershipId)?.size===1");
   expect(service).toContain("phone:active && sharePhone?row.phone:null");
   expect(service).toContain('const active = row.status === "SUBMITTED"');
   expect(page).toContain("selectedApplicant.branch");
   expect(page).toContain("selectedApplicant.phone");
 });
 it("REC-home-drives-45 filters historical milestones only within TPO-shared applicants",()=>{
   const model=source("src/modules/placements/hr-job-applicants-model.ts");
   const service=source("src/modules/placements/hr-job-read-service.ts");
   const page=source("src/app/(authenticated)/hr/placements/jobs/[jobId]/page.tsx");
   for(const label of ["APPLIED","SHORTLISTED","ASSESSMENT","INTERVIEW",
      "OFFERED","HIRED","REJECTED","WITHDRAWN"]){
     expect(model).toContain('value:"'+label+'"');
   }
   expect(service).toContain('eq(placementApplicationScreenings.status, "SHORTLISTED")');
   expect(service).toContain('eq(placementRoundResults.status,"APPLIED")');
   expect(service).toContain('eq(placementRoundResults.applicationId,placementApplications.id)');
   expect(service).toContain('eq(placementJoiningOutcomes.status,"JOINED")');
   expect(service).toContain('const stageCondition=and(where,filters.stage==="ALL"?undefined:stageConditions[filters.stage],');
   expect(service).toContain('activeMilestoneStage?eq(placementApplications.status,"SUBMITTED"):undefined');
   expect(service).toContain('const selectedTotal = stageCounts[filters.stage]');
   expect(page).toContain("HR_RECRUITER_STAGES.map");
   expect(page).toContain("stageCounts[stage]");
   expect(page).toContain("unshared or privately rejected applicants remain hidden");
 });

 it("REC-home-drives-41 typecheck restores authorized companyRelationshipId for private rating reads and writes",()=>{
   const workspace=source("src/modules/placements/recruiter-workspace-service.ts");
   const service=source("src/modules/placements/recruiter-private-rating-service.ts");
   expect(workspace).toContain("companyRelationshipId: scope.relationshipId");
   expect(service).toContain("workspace.job.companyRelationshipId");
   expect(service).toContain("eq(placementRecruiterCollegeGrants.companyRelationshipId,placementJobs.companyRelationshipId)");
   expect(service).toContain("eq(placementJobs.id,placementApplications.jobId)");
   expect(service).toContain("recruiterOwnJobPredicate(ctx.user.id)");
 });
 it("REC-home-drives-46 records confirmed slot totals on both overview and round detail",()=>{
  const code=source("src/modules/placements/hr-job-read-service.ts");
  expect(code).toContain('filters.tab==="rounds"||filters.tab==="overview"');
  expect(code).toContain("placementRoundCandidateSlots.confirmedAt");
 });
 it("REC-home-drives-52 pages all selection statuses instead of hiding older records",()=>{
  const code=source("src/modules/placements/hr-job-read-service.ts");
  const page=source("src/app/(authenticated)/hr/placements/jobs/[jobId]/page.tsx");
  expect(code).toContain('(filters.offerPage-1)*HR_OFFER_PAGE_SIZE');
  expect(code).toContain('hrOfferPageBounds(filters.offerPage,selectionTotal)');
  expect(code).not.toContain('filters.offerState==="ALL"?0:filters.offerPage-1');
  expect(page).toContain('<nav aria-label="Selection history pages"');
  expect(page).not.toContain('selectionTotal>selectionRows.length?<Link');
  expect(page).toContain("Previous selections");
  expect(page).toContain("Next selections");
 });
 it("REC-home-drives-52 separates pre-issue selections and cancellations from real issued offers",()=>{
   const code=source("src/modules/placements/hr-job-read-service.ts");
   const page=source("src/app/(authenticated)/hr/placements/jobs/[jobId]/page.tsx");
   expect(code).toContain("placementDriveSelections");
   expect(code).toContain('eq(placementApplicationScreenings.status, "SHORTLISTED")');
   expect(code).toContain('filters.offerState==="PENDING_VERIFICATION"?"VERIFIED"');
   expect(code).toContain('filters.offerState==="REVOKED"?"CANCELLED"');
   expect(code).toContain('inArray(placementDriveSelections.status,["SELECTED","VERIFIED","CANCELLED"])');
   expect(code).toContain("limit(HR_OFFER_PAGE_SIZE)");
   expect(code).toContain("selectionTotal");
   expect(page).toContain('aria-label="Placement-cell selection history"');
   expect(page).toContain("Selections are not issued offers.");
   expect(page).toContain("Selection cancelled");
   expect(page).toContain("Next selections");
 });
 it("REC-home-drives-46 shows only placement-cell confirmed slot counts, not recruiter internal bookings",()=>{
   const code=source("src/modules/placements/hr-job-read-service.ts");
   const page=source("src/app/(authenticated)/hr/placements/jobs/[jobId]/page.tsx");
   expect(code).toContain("placementRoundCandidateSlots.confirmedAt");
   expect(code).toContain("roundSlotCounts");
   expect(code).toContain("eq(placementRoundCandidateSlots.jobId,workspace.job.id)");
   expect(page).toContain("slots confirmed by the placement cell");
   expect(page).toContain("roundSlotCounts[round.id]?.confirmed");
 });

 it("REC-home-drives-R03 counts and lists only jobs authored by this recruiter or approved from their own request",()=>{
  const owner=source("src/modules/placements/recruiter-job-ownership.ts");
  expect(owner).toContain("eq(placementJobs.createdByUserId,recruiterUserId)");
  expect(owner).toContain("eq(placementRecruiterDriveRequests.recruiterUserId,recruiterUserId)");
  expect(owner).toContain("eq(placementRecruiterDriveRequests.approvedJobId,placementJobs.id)");
  expect(owner).toContain("eq(placementRecruiterDriveRequests.collegeId,placementJobs.collegeId)");
  expect(owner).toContain("eq(placementRecruiterDriveRequests.companyRelationshipId,placementJobs.companyRelationshipId)");
  for(const path of [
   "src/modules/placements/recruiter-service.ts",
   "src/modules/placements/recruiter-drive-search-service.ts",
  ]){
   expect(source(path),path).toContain("recruiterOwnJobPredicate(context.user.id)");
  }
  expect(source("src/modules/placements/recruiter-drive-search-service.ts"))
   .toContain("const scope=and(");
 });
 it("REC-home-drives-R03 denies a colleague's direct workspace, rounds, slots and results",()=>{
  for(const path of [
   "src/modules/placements/recruiter-workspace-service.ts",
   "src/modules/placements/hr-round-editor-service.ts",
   "src/modules/placements/hr-interview-slot-service.ts",
   "src/modules/placements/recruiter-drive-request-service.ts",
   "src/modules/placements/applicant-notes-service.ts",
  ]){
   expect(source(path),path).toContain("recruiterOwnJobPredicate(");
  }
  const results=source("src/modules/placements/result-service.ts");
  expect(results).toContain("if(recruiterCanStage && !(await recruiterOwnJobExists(context.user.id,job.id)))");
  expect(results).toContain('new PlacementsServiceError("PLACEMENT_JOB_NOT_FOUND")');
 });
 it("REC-home-drives-38 never exposes roll number or email without an active relationship share column",()=>{
  const code=source("src/modules/placements/hr-job-read-service.ts");
  expect(code).toContain('eq(placementCompanyRelationships.status,"ACTIVE")');
  expect(code).toContain('share?.columns?.includes("roll")');
  expect(code).toContain('share?.columns?.includes("email")');
  expect(code).toContain("rollNumber:active && shareRoll?row.rollNumber:null");
  expect(code).toContain("email:active && shareEmail?row.email:null");
  expect(code).toContain('eq(placementCompanyRelationships.collegeId,workspace.college.id)');
  expect(code).toContain('eq(placementApplicationScreenings.status, "SHORTLISTED")');
 });
 it("REC-home-drives-38 only projects verified college-authorized academic marks",()=>{
  const sourceCode=source("src/modules/placements/hr-job-read-service.ts");
  expect(sourceCode).toContain('share?.columns?.includes("cgpa")');
  expect(sourceCode).toContain('share?.columns?.includes("tenth")');
  expect(sourceCode).toContain('share?.columns?.includes("twelfth")');
  expect(sourceCode).toContain("profileVerificationAcademicMarks");
  expect(sourceCode).toContain('eq(profileVerifications.section,"EDUCATION")');
  expect(sourceCode).toContain('inArray(profileVerifications.status,["VERIFIED","UPDATE_PENDING"])');
  expect(sourceCode).toContain("ugPercentage:active && shareUg?percentage(");
  expect(sourceCode).toContain('share?.columns?.includes("cgpa") && visibility?.cgpa');
  expect(sourceCode).toContain("tenthPercentage:active && shareTenth?percentage(");
  expect(sourceCode).toContain('share?.columns?.includes("tenth") && visibility?.academic');
  expect(sourceCode).toContain("twelfthOrDiplomaPercentage:active && shareTwelfth?");
  expect(sourceCode).toContain('share?.columns?.includes("twelfth") && visibility?.academic');
  expect(sourceCode).toContain("projectRecruiterProfileLinks(profileDocument");
  expect(sourceCode).toContain("applications.map(({membershipId,profileDocument,...row})");
  expect(sourceCode).toContain("placementCompanyVisibilitySettings.showCgpaExact");
  expect(sourceCode).toContain("placementCompanyVisibilitySettings.showTenthTwelfth");
  expect(sourceCode).toContain('visibility?.cgpa');
  expect(sourceCode).toContain('visibility?.academic');
  const page=source("src/app/(authenticated)/hr/placements/jobs/[jobId]/page.tsx");
  expect(page).toContain("selectedApplicant.ugPercentage");
  expect(page).toContain("selectedApplicant.tenthPercentage");
  expect(page).toContain("selectedApplicant.twelfthOrDiplomaPercentage");
 });
 it("REC-home-drives-46 keeps inline legacy round controls and counts stage decisions",()=>{
  const editor=source("src/components/hr/recruiter-round-inline-editor.tsx");
  expect(editor).toContain("Company talk");
  expect(editor).toContain('["TEST","Test"]');
  expect(editor).toContain('["VENDOR_TEST","Vendor test"]');
  expect(editor).toContain("Round added. The placement cell will set its date.");
  expect(editor).toContain("Round updated");
  expect(editor).toContain("Round removed");
  expect(editor).toContain('onClick={()=>edit(row)}>Change</Button>');
  expect(editor).toContain('edit(row);setConfirmRemove(true);');
  expect(editor).toContain('title="Remove this round?"');
  const page=source("src/app/(authenticated)/hr/placements/jobs/[jobId]/page.tsx");
  expect(page).toContain('person.result?.status==="STAGED"');
  expect(page).toContain('person.result?.status==="APPLIED"');
  expect(page).toContain("Date to be set by the placement cell");
 });
 it("REC-home-drives-47 permits recruiter-owned unpublished rounds without reopening closed drives",()=>{
  const service=source("src/modules/placements/hr-round-editor-service.ts");
  expect(service.match(/inArray\(placementJobs.status,\["DRAFT","PUBLISHED"\]\)/g)?.length).toBe(2);
  expect(service).toContain("recruiterOwnJobPredicate(context.user.id)");
  expect(service).toContain("placements.recruiter.round.manage");
  expect(service).not.toContain('eq(placementJobs.status,"CLOSED")');
  const page=source("src/app/(authenticated)/hr/drives/[jobId]/rounds/editor/page.tsx");
  expect(page).toContain('href="/hr/drives"');
 });
 it("REC-home-drives-41 never reads or writes a withdrawn applicant's private rating",()=>{
  const service=source("src/modules/placements/recruiter-private-rating-service.ts");
  expect(service.split('eq(placementApplications.status,"SUBMITTED")').length-1).toBe(2);
  expect(service).toContain('eq(placementRecruiterCollegeGrants.verificationStatus,"VERIFIED")');
  expect(service).toContain('gt(placementRecruiterCollegeGrants.validUntil,sql`clock_timestamp()`)');
 });
 it("REC-home-drives-41 stores 1–5 reviews individually by recruiter and applicant",()=>{
  const schema=source("src/db/schema/placement-recruiter-candidate-ratings.ts");
  expect(schema).toContain("prpr_recruiter_application_uq");
  expect(schema).toContain("t.recruiterUserId,t.applicationId");
  expect(schema).toContain("prpr_rating_ck");
  expect(schema).toContain("prpr_note_ck");
  expect(source("src/db/schema/index.ts")).toContain('export * from "./placement-recruiter-candidate-ratings"');
  const migration=source("drizzle/0134_lanes_round_2.sql");
  expect(migration).toContain("CREATE TABLE IF NOT EXISTS placement_recruiter_private_reviews");
  expect(migration).toContain("UNIQUE (recruiter_user_id, application_id)");
 });
 it("REC-home-drives-41 degrades safely when the proposed private-review table is not installed",()=>{
  const route=source("src/app/api/placements/recruiter/jobs/[jobId]/applicants/[applicationId]/private-rating/route.ts");
  expect(route).toContain('placementTableExists("placement_recruiter_applicant_notes")');
  expect(route).toContain('RecruiterPrivateReviewMigrationPending');
  expect(route).toContain('error:"SERVICE_UNAVAILABLE"');
  expect(route).toContain('status:503,headers');
  expect(route).toContain('if(!hasActiveRecruiter(context)||context.recruiter?.userId!==context.user.id)');
  expect(route).toContain('status:404,headers');
  expect(route).toContain('"Cache-Control":"private, no-store"');
 });
 it("REC-home-drives-41 validates and authorizes private reviews without company-wide notes",()=>{
  const service=source("src/modules/placements/recruiter-private-rating-service.ts");
  expect(service).toContain("rating:z.number().int().min(1).max(5).nullable()");
  expect(service).toContain("note:z.string().trim().max(1000)");
  expect(service).toContain('eq(placementApplicationScreenings.status,"SHORTLISTED")');
  expect(service).toContain("ctx.user.id");
  expect(service).toContain("getRecruiterPlacementWorkspace(ctx,jobId)");
  expect(service).toContain("recruiterOwnJobPredicate(ctx.user.id)");
  expect(service).toContain("new RecruiterPrivateReviewConflict()");
  const route=source("src/app/api/placements/recruiter/jobs/[jobId]/applicants/[applicationId]/private-rating/route.ts");
  expect(route).toContain("isSameOriginRequest(request)");
  expect(route).toContain("private, no-store");
  expect(route).toContain("status:409");
 });
 it("REC-home-drives-41 renders an editable self-only rating and preserves edits on conflict",()=>{
  const editor=source("src/components/hr/recruiter-private-rating-editor.tsx");
  expect(editor).toContain("Only you can read or change this rating and note.");
  expect(editor).toContain("Clear rating and note");
  expect(editor).toContain("Your edits are kept here.");
  expect(editor).toContain("expectedUpdatedAt:saved.updatedAt");
  expect(editor).toContain("useGuardedAction(");
  const page=source("src/app/(authenticated)/hr/placements/jobs/[jobId]/page.tsx");
  expect(page).toContain("<RecruiterPrivateRatingEditor");
  expect(page).toContain("applicationId={selectedApplicant.id}");
 });
 it("REC-calendar-messages-profile-12 confirms in-app draft navigation rather than discarding it silently",()=>{
  const component=source("src/components/hr/recruiter-conversation-reply-form.tsx");
  expect(component).toContain('document.addEventListener("click",intercept,true)');
  expect(component).toContain('title="Discard this unsent message?"');
  expect(component).toContain('description="Your draft reply will be lost."');
  expect(component).toContain('if(href)router.push(href)');
  expect(component).toContain('runGuarded(()=>fetch(');
 });
 it("REC-calendar-messages-profile-27 confirms dirty in-app profile navigation and guards save",()=>{
  const component=source("src/components/hr/recruiter-profile-details-editor.tsx");
  expect(component).toContain('document.addEventListener("click",intercept,true)');
  expect(component).toContain('title="Discard your unsaved profile changes?"');
  expect(component).toContain('consequence="Your changes have not been saved."');
  expect(component).toContain('runGuarded(()=>fetch(');
  expect(component).toContain("Unsaved changes");
 });
});
