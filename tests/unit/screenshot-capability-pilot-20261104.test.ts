import {describe, expect, it} from "vitest";
import {readFileSync} from "node:fs";
import {learnerAssignmentListHref,learnerAssignmentListPage} from "@/modules/courses/learner-assignment-page-model";
import {TPO_AUDIT_ABOUT_CATEGORIES,tpoAuditAboutCategory} from "@/modules/placements/tpo-audit-model";
import {mentorMeetingListScopes} from "@/modules/projects/mentor-meeting-list-filter-model";
import {tpoNoticeFormErrorMessage} from "@/modules/announcements/tpo-notice-form-error-model";
import {tpoNoticeTextParts} from "@/modules/announcements/tpo-notice-safe-links";

const source=(path:string)=>readFileSync(path,"utf8");

/** Screenshot metadata only indicates visible affordances. These regressions
 * exercise pure behavior where possible; source checks are discovery guards,
 * NOT browser/API/tenant closure or pixel matching. Reference packages are
 * read-only on parity-baseline and intentionally not copied to main.
 */
describe("2026-11-04 screenshot capability-first pilot",()=>{
 it("learner-001/002: bounded pagination retains only an already-selected course",()=>{
  expect(learnerAssignmentListPage(undefined)).toBe(1);
  expect(learnerAssignmentListPage("2")).toBe(2);
  expect(learnerAssignmentListPage("10000")).toBe(10000);
  for(const invalid of ["10001","0","-1","2abc",["1"],"1&course=foreign"])
   expect(learnerAssignmentListPage(invalid)).toBeNull();
  expect(learnerAssignmentListHref(2,"scoped-course"))
   .toBe("/learn/allAssignments?course=scoped-course&page=2");
  expect(learnerAssignmentListHref(1,null)).toBe("/learn/allAssignments");
 });

 it("learner-001/002: failed list reads have an actual refresh action; denials remain errors",()=>{
  const page=source("src/app/(authenticated)/learn/allAssignments/page.tsx");
  expect(page).toContain("<CurrentPageRetry label=\"Retry loading assignments\"");
  expect(page).not.toContain('href="/learn/allAssignments?retry=1"');
  expect(page).toContain("error instanceof AuthorizationError || error instanceof CoursesServiceError");
  expect(page).toContain('route:"/learn/allAssignments"');
  expect(source("src/components/ui/current-page-retry.tsx")).toContain("router.refresh()");
 });

 it("learner-003/006: old numeric quiz links resolve only within authorized overview",()=>{
  const page=source("src/app/(authenticated)/learn/allQuizzes/page.tsx");
  expect(page).toContain("inArray(courseQuizzes.id,overview.quizzes.map(item=>item.id))");
  expect(page).toContain("linkedQuiz.attemptsUsed>0");
  expect(page).toContain('redirect("/teacher/allQuizzes")');
  const overview=source("src/components/courses/learner-assessment-overview.tsx");
  expect(overview).toContain("learnerAssessmentMatchesState");
  expect(overview).toContain("learnerAssessmentDrawerSelectionAllowed");
 });

 it("faculty-001: public /quiz is a learner attempt, not proof of missing faculty preview",()=>{
  const page=source("src/app/quiz/page.tsx");
  expect(page).toContain("<LearnerQuizAttempt");
  const boundary=source("src/app/quiz/error.tsx");
  expect(boundary).toContain("Back to quizzes");
  expect(boundary).toContain("Try Again");
  expect(source("src/components/courses/faculty-quiz-learner-preview.tsx").length).toBeGreaterThan(0);
 });

 it("faculty-002/004: assignment list offers create, edit, and submission review",()=>{
  const overview=source("src/components/courses/faculty-assessment-overview.tsx");
  expect(overview).toContain("FacultyAssessmentCreate");
  expect(overview).toContain("FacultyAssessmentEditor");
  expect(overview).toContain("View submissions");
  expect(overview).toContain("FacultyAssignmentReview");
 });

 it("mentor-001/003: meeting lifecycle and portfolio filters are reachable",()=>{
  const calendar=source("src/components/projects/mentor-meetings-calendar.tsx");
  for(const control of ["Open project","MentorMeetingRequestActions","MentorMeetingReschedule","MentorMeetingCancelInline","splitMentorMeetings"])
   expect(calendar).toContain(control);
  expect(mentorMeetingListScopes.map(row=>row.id))
   .toEqual(["ALL","COMING","ASKED","PAST","NOTES_MISSING"]);
  const projects=source("src/app/(authenticated)/mentor/projects/page.tsx");
  expect(projects).toContain("matchesMentorProjectAttention");
  expect(projects).toContain("mentorProjectListQuerySchema");
 });

 it("mentor-002: notifications query uses a personal inbox service",()=>{
  const page=source("src/app/(authenticated)/mentor/notifications/page.tsx");
  expect(page).toContain("getMentorPersonalInbox");
  expect(page).toContain("mentorInboxQuerySchema");
 });

 it("tpo-001/002: announcement create targets and POST stay protected",()=>{
  const page=source("src/app/(authenticated)/tpo/announcements/page.tsx");
  expect(page).toContain("<TpoNoticeComposerDialog");
  expect(page).toContain("<TpoNoticeLiveAudienceProvider");
  expect(page).toContain("Button (optional)");
  expect(page).toContain("From 42");
  expect(page).toContain('route:"/tpo/announcements"');
  expect(page).toContain('<CurrentPageRetry label="Retry loading announcements"');
  const route=source("src/app/api/placements/tpo/announcements/route.ts");
  expect(route).toMatch(/isSameOriginRequest\(request\)|from "@\/security\/route"/);
  expect(route).toContain("createTpoNotice");
 });

 it("tpo-001/002: notice links and error-code feedback remain safe",()=>{
  const parts=tpoNoticeTextParts("See https://example.org/apply, and http://unsafe.test now.");
  expect(parts.filter(p=>p.kind==="link").map(p=>p.value)).toEqual(["https://example.org/apply"]);
  expect(tpoNoticeFormErrorMessage("__proto__")).toBeNull();
  expect(tpoNoticeFormErrorMessage("TPO_NOTICE_NO_RECIPIENTS")).toContain("Nobody");
 });

 it("tpo-003/004: audit quick looks include old bulk/share categories and scope failures",()=>{
  const categories=TPO_AUDIT_ABOUT_CATEGORIES.map(r=>r.value);
  expect(categories).toContain("BULK");
  expect(categories).toContain("SHARE");
  expect(categories).toContain("RECRUITER_LEAD");
  expect(tpoAuditAboutCategory("BULK_UNDONE")).toBe("BULK");
  expect(tpoAuditAboutCategory("SHARE_VIEWED")).toBe("SHARE");
  const page=source("src/app/(authenticated)/tpo/audit/page.tsx");
  expect(page).toContain("getTpoAuditLog(context, parsed.data)");
  expect(page).toContain("TpoAuditStaleSnapshot");
  expect(page).toContain('route:"/tpo/audit"');
 });

 it("tpo-005/006: batch decisions and undo are real routes, not screenshot-only links",()=>{
  const page=source("src/app/(authenticated)/tpo/batches/page.tsx");
  expect(page).toContain("requireTpoBatchActor(context)");
  expect(page).toContain("TpoBatchUndoControl");
  const undo=source("src/components/tpo/tpo-batch-undo-control.tsx");
  expect(undo).toContain('method:"POST"');
  expect(undo).toContain("actionId");
  expect(undo).toContain("useGuardedAction");
 });

 it("admin-001/005: assignment actions and attendance month navigation exist",()=>{
  const assignments=source("src/components/courses/college-assessment-aggregate.tsx");
  expect(assignments).toContain("Export CSV (page)");
  expect(assignments).toContain("CollegeAssignmentActions");
  expect(assignments).toContain("SuperAdminAssignmentSubmissionsDialog");
  expect(source("src/components/courses/college-assignment-create.tsx")).toContain("Create Assignment");
  const attendance=source("src/components/attendance/admin-attendance-workspace.tsx");
  expect(attendance).toContain('aria-label="Previous month"');
  expect(attendance).toContain('aria-label="Next month"');
  expect(attendance).toContain("Select class");
  expect(attendance).toContain("shiftAttendanceMonth");
 });

 it("admin-175: old drive settings route maps to real guarded College settings",()=>{
  const page=source("src/app/(authenticated)/college/placements/jobs/[jobId]/settings/page.tsx");
  expect(page).toContain("getCollegeDriveOverview(context,jobId)");
  expect(page).toContain("CollegeLegacyDriveSettings");
  expect(page).toContain("CollegeDriveArchiveAction");
 });

 it("admin-250/275: legacy workspace detail and deleted aliases retain true outcomes",()=>{
  const section=source("src/app/(authenticated)/college/projects/workspaces/[workspaceId]/[section]/page.tsx");
  expect(section).toContain("legacyWorkspaceSummaryQuery");
  expect(section).toContain('encodeURIComponent(section)');
  expect(source("src/app/(authenticated)/college/projects/[projectId]/readiness/page.tsx").length).toBeGreaterThan(0);
  const deleted=source("src/app/(authenticated)/college/projects/workspaces/deleted/page.tsx");
  expect(deleted).toContain('redirect("/college/projects/deleted"');
  expect(deleted).toContain('["10","20","50","100"].includes(value)');
 });

 it("admin-325/350: TPO legacy new drive and numeric recruiter links remain scoped",()=>{
  const create=source("src/app/(authenticated)/tpo/drives/new/page.tsx");
  expect(create).toContain("legacyTpoNewDriveHref");
  const lead=source("src/app/(authenticated)/tpo/recruiters/[leadId]/page.tsx");
  expect(lead).toContain("requirePersistedTpoMembership");
  expect(lead).toContain("placementTpoLeads.legacyLeadId");
  expect(lead).toContain("context.membership.collegeId");
 });
});
