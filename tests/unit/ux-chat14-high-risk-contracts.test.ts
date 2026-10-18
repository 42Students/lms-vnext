import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
const read=(path:string)=>readFileSync(path,"utf8");
describe("chat-14 mentor and HR UX critical page contracts",()=>{
 it("UX-mentor-projects-projectId-02 keeps shared tabs and closed-project mutation protections",()=>{
  const src=read("src/app/(authenticated)/mentor/projects/[projectId]/page.tsx");
  expect(src).toContain("<MentorProjectTabs");
  expect(src).toContain("activeSection={activeSection}");
  expect(src).toContain('workspace.project.status==="ARCHIVED"');
  expect(src).toContain("MentorProductBacklog");
  expect(src).toContain("min-w-0 max-w-full");
 });
 it("UX-mentor-calendar-02 retains accessible shared filter controls and real calendar data",()=>{
  const src=read("src/app/(authenticated)/mentor/calendar/page.tsx");
  expect(src).toContain("FilterBar");
  expect(src).toContain("<Input");
  expect(src).toContain("<Select");
  expect(src).toContain("MentorMeetingsCalendar");
  expect(src).toContain("PageHeader");
 });
 it("UX-hr-placements-jobs-jobId-02 distinguishes authorized applicant review, selection and offers",()=>{
  const src=read("src/app/(authenticated)/hr/placements/jobs/[jobId]/page.tsx");
  expect(src).toContain("<RecruiterApplicantReviewDrawer");
  expect(src).toContain("<RecruiterPrivateRatingEditor");
  expect(src).toContain("ThirdPartyLink");
  expect(src).toContain('caption="Placement-cell selection history"');
  expect(src).toContain('rows={selectionRows}');
  expect(src).toContain('caption="Offers for shared applicants at this college"');
  expect(src).toContain('mobilePriority: "primary"');
  const table=read("src/components/ui/data-table.tsx");
  const cue=read("src/components/ui/scroll-cue.tsx");
  expect(table).toContain('<ScrollCue axis="x"');
  expect(table).toContain('<caption className="sr-only">');
  expect(cue).toContain('tabIndex={edges.scrollable ? 0 : -1}');
  expect(cue).toContain("overflow-x-auto overscroll-x-contain");
 });
 it("UX-hr-conversations-threadId-02 retains the shared composer and safe failure state",()=>{
  const src=read("src/app/(authenticated)/hr/conversations/[threadId]/page.tsx");
  expect(src).toContain("RecruiterConversationReplyForm");
  expect(src).toContain("RecruiterConversationLiveRefresh");
  expect(src).toContain("ErrorState");
  expect(src).not.toContain("<main");
 });
 it("UX-hr-profile-02 preserves recruiter profile mutations and read-only college access",()=>{
  const src=read("src/app/(authenticated)/hr/profile/page.tsx");
  expect(src).toContain("RecruiterProfileDetailsEditor");
  expect(src).toContain("RecruiterProfileAccess");
  expect(src).toContain("<DataTable");
  expect(src).toContain('caption="Current college access"');
  expect(src).toContain('mobilePriority:"primary"');
  expect(src).toContain('hasActiveRecruiter(context)');
  expect(src).toContain("PageHeader");
 });
 it("UX-hr-company-reports-02 preserves phone cards and accessible desktop data reports",()=>{
  const src=read("src/app/(authenticated)/hr/company/reports/page.tsx");
  expect(src).toContain("<DataTable");
  expect(src).toContain('caption="Company Reports table"');
  expect(src).toContain('mobilePriority:"primary"');
  expect(src).toContain("recruiterCompanyReportsQuerySchema.safeParse");
  expect(src).toContain("EmptyState");
  expect(src).toContain("PageHeader");
 });
});
