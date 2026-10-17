import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";
const read=(p:string)=>readFileSync(p,"utf8");
const job=()=>read("src/app/(authenticated)/hr/placements/jobs/[jobId]/page.tsx");
describe("chat-14 recruiter reassigned batch 3",()=>{
 it("REC-home-drives-34 retains scoped returnTo and job title, status and applicant-count framing",()=>{
  const code=job();
  expect(code).toContain("safeDriveReturnTo(");
  expect(code).toContain('← Back to Drives');
  expect(code).toContain("title={workspace.job.title}");
  expect(code).toContain('"Sent for review"');
  expect(code).toContain("applicants.counts.all+");
  expect(code).toContain("offersTotal+");
 });
 it("REC-home-drives-46 represents persisted round status and schedule without inventing slots",()=>{
  const code=job();
  expect(code).toContain("Not scheduled");
  expect(code).toContain("Scheduled");
  expect(code).toContain("Completed");
  expect(code).toContain("Added by you");
  expect(code).toContain("Date to be decided");
  expect(code).toContain("Change or remove");
  expect(code).toContain("Venue not set");
 });
 it("REC-home-drives-50 uses readable, scoped offer columns and employment outcomes",()=>{
  const code=job();
  for(const label of ["Candidate","Type","CTC (LPA)","Status","Reply by","Joining",
    "Letter of intent","Joined","Deferred","Did not join"])expect(code).toContain(label);
  expect(code).toContain("recruiterOfferStatusLabel(offer.status)");
  expect(code).toContain("offer.annualCtcInr/100000");
 });
 it("REC-home-drives-53 refreshes a stale recruiter drive after tab focus without hiding data errors",()=>{
  const component=read("src/components/hr/recruiter-drive-focus-refresh.tsx");
  expect(component).toContain('window.addEventListener("focus",refresh)');
  expect(component).toContain('document.addEventListener("visibilitychange",visible)');
  expect(component).toContain("router.refresh()");
  expect(component).toContain("Some drive information may be stale or unavailable.");
  expect(job()).toContain("<RecruiterDriveFocusRefresh />");
 });
 it("REC-calendar-messages-profile-48 keeps the original no-college recruiter address guidance",()=>{
  const home=read("src/app/(authenticated)/hr/home/page.tsx");
  const calendar=read("src/app/(authenticated)/hr/calendar/page.tsx");
  expect(home).toContain("Open this on your college&apos;s placement address");
  expect(calendar).toContain("Open this on your college&apos;s placement address");
 });
 it("REC-home-drives-41 preserves 1-5 self-only reviewer ratings and 1000-character note",()=>{
  const service=read("src/modules/placements/recruiter-private-rating-service.ts");
  const schema=read("src/db/schema/placement-recruiter-candidate-ratings.ts");
  const route=read("src/app/api/placements/recruiter/jobs/[jobId]/applicants/[applicationId]/private-rating/route.ts");
  const ui=read("src/components/hr/recruiter-private-rating-editor.tsx");
  expect(service).toContain("rating:z.number().int().min(1).max(5).nullable()");
  expect(service).toContain("note:z.string().trim().max(1000)");
  expect(service).toContain('eq(placementApplicationScreenings.status,"SHORTLISTED")');
  expect(service).toContain("ctx.user.id");
  expect(schema).toContain("prpr_recruiter_application_uq");
  expect(schema).toContain("prpr_note_ck");
  expect(route).toContain("isSameOriginRequest(request)");
  expect(route).toContain("private, no-store");
  expect(ui).toContain("Only you can read or change this rating and note.");
  expect(ui).toContain("Clear rating and note");
  expect(job()).toContain("<RecruiterPrivateRatingEditor");
  expect(read("docs/proposed-migrations/recruiter-private-candidate-ratings.sql"))
   .toContain("CREATE TABLE IF NOT EXISTS placement_recruiter_private_reviews");
 });
 it("REC-home-drives-38 discloses recruiter roll number only under explicit college relationship share defaults",()=>{
  const readService=read("src/modules/placements/hr-job-read-service.ts");
  const drawer=read("src/modules/placements/hr-applicant-drawer-model.ts");
  expect(readService).toContain("shareColumnDefaults");
  expect(readService).toContain('share?.columns?.includes("roll")');
  expect(readService).toContain("shareRoll?row.rollNumber:null");
  expect(readService).toContain('eq(placementCompanyRelationships.collegeId,workspace.college.id)');
  expect(readService).toContain('eq(placementCompanyRelationships.status,"ACTIVE")');
  expect(drawer).toContain("rollNumber:selected.rollNumber??null");
  expect(job()).toContain("Roll no.");
 });
 it("REC-home-drives-45 gives an honest empty state when the placement cell has not shared applicants",()=>{
  const code=job();
  expect(code).toContain("The placement cell has not shared the applicants yet");
  expect(code).toContain("No shared applicants match this stage.");
 });
 it("REC-calendar-messages-profile-23 never acknowledges all colleges when the bell shows one college",()=>{
  const service=read("src/modules/placements/hr-recruiter-bell-service.ts");
  expect(service).toContain('if(feed.status!=="READY")return {marked:0}');
  expect(service).toContain("ctx,feed.collegeId");
  expect(service).toContain("x.collegeId===feed.collegeId");
  expect(service).toContain("eq(inAppNotifications.userId,ctx.user.id)");
 });

});
