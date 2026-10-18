import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
const read=(path:string)=>readFileSync(path,"utf8");

describe("UX /admin middle third route and shared archetype contracts",()=>{
 it("UX-admin-inbound-mail-01 preserves its scoped page and legacy UI surface",()=>{
  const page=read("src/app/(authenticated)/admin/inbound-mail/page.tsx");
  expect(page).toContain("title=\"Inbound mail\"");
  expect(page).toContain("InboundMailList");
 });
 it("UX-admin-lecture-halls-01 preserves its scoped page and legacy UI surface",()=>{
  const page=read("src/app/(authenticated)/admin/lecture-halls/page.tsx");
  expect(page).toContain("title=\"Lecture Halls\"");
  expect(page).toContain("LectureHallManager");
 });
 it("UX-admin-lecture-halls-hallId-01 preserves its scoped page and legacy UI surface",()=>{
  const page=read("src/app/(authenticated)/admin/lecture-halls/[hallId]/page.tsx");
  expect(page).toContain("Room availability");
  expect(page).toContain("Hall scheduled sessions");
 });
 it("UX-admin-lessons-01 preserves its scoped page and legacy UI surface",()=>{
  const page=read("src/app/(authenticated)/admin/lessons/page.tsx");
  expect(page).toContain("title=\"Lessons\"");
  expect(page).toContain("SuperAdminLessonBulkVisibility");
 });
 it("UX-admin-live-classes-01 preserves its scoped page and legacy UI surface",()=>{
  const page=read("src/app/(authenticated)/admin/live-classes/page.tsx");
  expect(page).toContain("SuperAdminContentDirectoryPage");
  expect(page).toContain("LIVE_CLASSES");
 });
 it("UX-admin-module-access-01 preserves its scoped page and legacy UI surface",()=>{
  const page=read("src/app/(authenticated)/admin/module-access/page.tsx");
  expect(page).toContain("title=\"Module Access\"");
  expect(page).toContain("No matching colleges");
 });
 it("UX-admin-organizations-01 preserves its scoped page and legacy UI surface",()=>{
  const page=read("src/app/(authenticated)/admin/organizations/page.tsx");
  expect(page).toContain("DataTable");
  expect(page).toContain("No organizations in this scope");
 });
 it("UX-admin-people-01 preserves its scoped page and legacy UI surface",()=>{
  const page=read("src/app/(authenticated)/admin/people/page.tsx");
  expect(page).toContain("DataTable");
  expect(page).toContain("PeoplePagination");
 });
 it("UX-admin-people-directory-01 preserves its scoped page and legacy UI surface",()=>{
  const page=read("src/app/(authenticated)/admin/people/directory/page.tsx");
  expect(page).toContain("title=\"People Directory\"");
  expect(page).toContain("No matching users");
 });
 it("UX-admin-people-directory-membershipId-01 preserves its scoped page and legacy UI surface",()=>{
  const page=read("src/app/(authenticated)/admin/people/directory/[membershipId]/page.tsx");
  expect(page).toContain("getSuperAdminMembershipDetail");
  expect(page).toContain("View audit trail");
 });
 it("UX-admin-people-directory-membershipId-audit-01 preserves its scoped page and legacy UI surface",()=>{
  const page=read("src/app/(authenticated)/admin/people/directory/[membershipId]/audit/page.tsx");
  expect(page).toContain("listSuperAdminPersonAudit");
  expect(page).toContain("No matching membership activity events have been recorded.");
 });
 it("UX-admin-people-unassigned-01 preserves its scoped page and legacy UI surface",()=>{
  const page=read("src/app/(authenticated)/admin/people/unassigned/page.tsx");
  expect(page).toContain("title=\"Users without college memberships\"");
  expect(page).toContain("No matching users");
 });
 it("UX-admin-placements-01 preserves its scoped page and legacy UI surface",()=>{
  const page=read("src/app/(authenticated)/admin/placements/page.tsx");
  expect(page).toContain("PlacementOperationsWorkspace");
  expect(page).toContain("title=\"Placement Drives\"");
 });
 it("UX-admin-placements-analytics-01 preserves its scoped page and legacy UI surface",()=>{
  const page=read("src/app/(authenticated)/admin/placements/analytics/page.tsx");
  expect(page).toContain("title=\"Placement Analytics\"");
  expect(page).toContain("Hiring Funnel");
 });
 it("UX-admin-placements-applications-01 preserves its scoped page and legacy UI surface",()=>{
  const page=read("src/app/(authenticated)/admin/placements/applications/page.tsx");
  expect(page).toContain("AdminScopedReadPage");
  expect(page).toContain("title=\"Applications\"");
 });
 it("UX-admin-placements-applications-applicationId-01 preserves its scoped page and legacy UI surface",()=>{
  const page=read("src/app/(authenticated)/admin/placements/applications/[applicationId]/page.tsx");
  expect(page).toContain("SuperAdminPlacementDetailView");
  expect(page).toContain("Status history");
 });
 it("UX-admin-placements-calendar-01 preserves its scoped page and legacy UI surface",()=>{
  const page=read("src/app/(authenticated)/admin/placements/calendar/page.tsx");
  expect(page).toContain("PlacementCalendarWorkspace");
  expect(page).toContain("Select a college scope");
 });
 it("UX-admin-placements-drives-01 preserves its scoped page and legacy UI surface",()=>{
  const page=read("src/app/(authenticated)/admin/placements/drives/page.tsx");
  expect(page).toContain("DataTable");
  expect(page).toContain("caption=\"All drives\"");
 });
 it("UX-admin-placements-hiring-01 preserves its scoped page and legacy UI surface",()=>{
  const page=read("src/app/(authenticated)/admin/placements/hiring/page.tsx");
  expect(page).toContain("AdminScopedReadPage");
  expect(page).toContain("title=\"Hiring Dashboard · Applications\"");
 });
 it("UX-admin-placements-interviews-01 preserves its scoped page and legacy UI surface",()=>{
  const page=read("src/app/(authenticated)/admin/placements/interviews/page.tsx");
  expect(page).toContain("AdminScopedReadPage");
  expect(page).toContain("title=\"Placement Interviews / Rounds\"");
 });
 it("UX-admin-placements-interviews-roundId-01 preserves its scoped page and legacy UI surface",()=>{
  const page=read("src/app/(authenticated)/admin/placements/interviews/[roundId]/page.tsx");
  expect(page).toContain("SuperAdminPlacementDetailView");
  expect(page).toContain("getSuperAdminInterviewDetail");
 });
 it("UX-admin-placements-job-settings-01 preserves its scoped page and legacy UI surface",()=>{
  const page=read("src/app/(authenticated)/admin/placements/job-settings/page.tsx");
  expect(page).toContain("AdminScopedReadPage");
  expect(page).toContain("title=\"Placement Job Settings\"");
 });
 it("UX-admin-placements-job-settings-jobId-01 preserves its scoped page and legacy UI surface",()=>{
  const page=read("src/app/(authenticated)/admin/placements/job-settings/[jobId]/page.tsx");
  expect(page).toContain("SuperAdminPlacementDetailView");
  expect(page).toContain("getSuperAdminJobSettingsDetail");
 });
 it("UX-admin-placements-jobs-jobId-01 preserves its scoped page and legacy UI surface",()=>{
  const page=read("src/app/(authenticated)/admin/placements/jobs/[jobId]/page.tsx");
  expect(page).toContain("PlacementDriveWorkspace");
  expect(page).toContain("SuperAdminDriveTabs");
 });
 it("UX-admin-placements-jobs-jobId-applications-01 preserves its scoped page and legacy UI surface",()=>{
  const page=read("src/app/(authenticated)/admin/placements/jobs/[jobId]/applications/page.tsx");
  expect(page).toContain("title={\"Applications · \"");
  expect(page).toContain("CollegeApplicationPipelineControls");
 });
 it("UX-admin-placements-jobs-jobId-schedule-01 preserves its scoped page and legacy UI surface",()=>{
  const page=read("src/app/(authenticated)/admin/placements/jobs/[jobId]/schedule/page.tsx");
  expect(page).toContain("DataTable");
  expect(page).toContain("caption=\"Persisted interview rounds\"");
 });
 it("UX-admin-placements-jobs-jobId-settings-01 preserves its scoped page and legacy UI surface",()=>{
  const page=read("src/app/(authenticated)/admin/placements/jobs/[jobId]/settings/page.tsx");
  expect(page).toContain("SuperAdminDriveTabs");
  expect(page).toContain("SuperAdminDriveDeadline");
 });
 it("UX-admin-placements-joining-01 preserves its scoped page and legacy UI surface",()=>{
  const page=read("src/app/(authenticated)/admin/placements/joining/page.tsx");
  expect(page).toContain("AdminScopedReadPage");
  expect(page).toContain("title=\"Joining Outcomes\"");
 });
 it("UX-admin-placements-joining-offerId-01 preserves its scoped page and legacy UI surface",()=>{
  const page=read("src/app/(authenticated)/admin/placements/joining/[offerId]/page.tsx");
  expect(page).toContain("SuperAdminPlacementDetailView");
  expect(page).toContain("getSuperAdminJoiningDetail");
 });
 it("UX-admin-placements-new-01 preserves its scoped page and legacy UI surface",()=>{
  const page=read("src/app/(authenticated)/admin/placements/new/page.tsx");
  expect(page).toContain("PlacementJobCreateWorkspace");
  expect(page).toContain("basePath=\"/admin/placements\"");
 });
 it("UX-admin-placements-offers-01 preserves its scoped page and legacy UI surface",()=>{
  const page=read("src/app/(authenticated)/admin/placements/offers/page.tsx");
  expect(page).toContain("AdminScopedReadPage");
  expect(page).toContain("title=\"Placement Offers\"");
 });
 it("UX-admin-placements-offers-offerId-01 preserves its scoped page and legacy UI surface",()=>{
  const page=read("src/app/(authenticated)/admin/placements/offers/[offerId]/page.tsx");
  expect(page).toContain("SuperAdminPlacementDetailView");
  expect(page).toContain("getSuperAdminOfferDetail");
 });
 it("UX-admin-placements-retention-01 preserves its scoped page and legacy UI surface",()=>{
  const page=read("src/app/(authenticated)/admin/placements/retention/page.tsx");
  expect(page).toContain("DataTable");
  expect(page).toContain("caption=\"Data retention report\"");
 });
 it("UX-admin-placements-screenings-01 preserves its scoped page and legacy UI surface",()=>{
  const page=read("src/app/(authenticated)/admin/placements/screenings/page.tsx");
  expect(page).toContain("AdminScopedReadPage");
  expect(page).toContain("title=\"Application Screening Queue\"");
 });
 it("UX-admin-placements-screenings-applicationId-01 preserves its scoped page and legacy UI surface",()=>{
  const page=read("src/app/(authenticated)/admin/placements/screenings/[applicationId]/page.tsx");
  expect(page).toContain("SuperAdminPlacementDetailView");
  expect(page).toContain("getSuperAdminScreeningDetail");
 });
 it("UX-admin-placements-seasons-01 preserves its scoped page and legacy UI surface",()=>{
  const page=read("src/app/(authenticated)/admin/placements/seasons/page.tsx");
  expect(page).toContain("AdminScopedReadPage");
  expect(page).toContain("title=\"Placement Seasons\"");
 });
 it("UX-admin-placements-seasons-seasonId-01 preserves its scoped page and legacy UI surface",()=>{
  const page=read("src/app/(authenticated)/admin/placements/seasons/[seasonId]/page.tsx");
  expect(page).toContain("SuperAdminPlacementDetailView");
  expect(page).toContain("getSuperAdminSeasonDetail");
 });
 it("UX-admin-placements-shared-02 keeps mobile directory states and no duplicate Source field",()=>{
  const page=read("src/components/admin/admin-scoped-read-page.tsx");
  expect(page).toContain("sm:grid-cols-2 lg:grid-cols-4");
  expect(page).toContain("No matching records");
  expect(page).toContain('name="channel"');
  expect(page.match(/<select name="source"/g)?.length).toBe(1);
  expect(page).toContain('role="status" aria-live="polite"');
 });
 it("UX-admin-placements-detail-02 delegates to a single shell main and 44px navigation",()=>{
  const page=read("src/components/admin/super-admin-placement-detail-view.tsx");
  expect(page).toContain('return <div className="min-w-0 space-y-5">');
  expect(page).not.toContain("<main");
  expect(page).toContain("min-h-11");
  expect(page).toContain("StatusBadge");
 });
 it("UX-admin-placements-tables-02 uses required legacy-scoped DataTable empty copy and phone columns",()=>{
  for(const path of [
   "src/app/(authenticated)/admin/placements/drives/page.tsx",
   "src/app/(authenticated)/admin/placements/jobs/[jobId]/schedule/page.tsx",
   "src/app/(authenticated)/admin/placements/retention/page.tsx",
  ]){
   const page=read(path);
   expect(page).toContain("<DataTable");
   expect(page).toContain("empty={<");
   expect(page).toContain('mobilePriority:"primary"');
   expect(page).not.toContain("min-w-[55rem]");
  }
 });
});
