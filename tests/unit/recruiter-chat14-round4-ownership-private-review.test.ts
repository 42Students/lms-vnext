import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";
const source=(path:string)=>readFileSync(path,"utf8");

describe("chat-14 recruiter ownership and private review gap closure",()=>{
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
  expect(code).toContain("rollNumber:shareRoll?row.rollNumber:null");
  expect(code).toContain("email:shareEmail?row.email:null");
  expect(code).toContain('eq(placementApplicationScreenings.status, "SHORTLISTED")');
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
 it("REC-home-drives-41 stores 1–5 reviews individually by recruiter and applicant",()=>{
  const schema=source("src/db/schema/placement-recruiter-candidate-ratings.ts");
  expect(schema).toContain("prpr_recruiter_application_uq");
  expect(schema).toContain("t.recruiterUserId,t.applicationId");
  expect(schema).toContain("prpr_rating_ck");
  expect(schema).toContain("prpr_note_ck");
  expect(source("src/db/schema/index.ts")).toContain('export * from "./placement-recruiter-candidate-ratings"');
  const migration=source("docs/proposed-migrations/recruiter-private-candidate-ratings.sql");
  expect(migration).toContain("CREATE TABLE IF NOT EXISTS placement_recruiter_private_reviews");
  expect(migration).toContain("UNIQUE (recruiter_user_id, application_id)");
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
  expect(component).toContain('consequence="Your draft reply will be lost."');
  expect(component).toContain('if(href)router.push(href)');
  expect(component).toContain('runGuarded(()=>fetch(');
 });
 it("REC-calendar-messages-profile-27 confirms dirty in-app profile navigation and guards save",()=>{
  const component=source("src/components/hr/recruiter-profile-details-editor.tsx");
  expect(component).toContain('document.addEventListener("click",intercept,true)');
  expect(component).toContain('title="Discard your unsaved profile changes?"');
  expect(component).toContain('consequence="Your unsaved changes will be lost."');
  expect(component).toContain('runGuarded(()=>fetch(');
  expect(component).toContain("Unsaved changes");
 });
});
