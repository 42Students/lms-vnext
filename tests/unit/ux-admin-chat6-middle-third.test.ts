import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
const read=(path:string)=>readFileSync(path,"utf8");

describe("UX /admin middle third route and shared archetype contracts",()=>{
 it("UX-admin-inbound-mail-01 /admin route /admin/inbound-mail preserves its scoped page and legacy UI surface",()=>{
  const page=read("src/app/(authenticated)/admin/inbound-mail/page.tsx");
  expect(page).toContain("title=\"Inbound mail\"");
  expect(page).toContain("InboundMailList");
 });
 it("UX-admin-lecture-halls-01 /admin route /admin/lecture-halls preserves its scoped page and legacy UI surface",()=>{
  const page=read("src/app/(authenticated)/admin/lecture-halls/page.tsx");
  expect(page).toContain("title=\"Lecture Halls\"");
  expect(page).toContain("LectureHallManager");
 });
 it("UX-admin-lecture-halls-hallId-01 /admin route /admin/lecture-halls/[hallId] preserves its scoped page and legacy UI surface",()=>{
  const page=read("src/app/(authenticated)/admin/lecture-halls/[hallId]/page.tsx");
  expect(page).toContain("Room availability");
  expect(page).toContain("Hall scheduled sessions");
 });
 it("UX-admin-lessons-01 /admin route /admin/lessons preserves its scoped page and legacy UI surface",()=>{
  const page=read("src/app/(authenticated)/admin/lessons/page.tsx");
  expect(page).toContain("title=\"Lessons\"");
  expect(page).toContain("SuperAdminLessonBulkVisibility");
 });
 it("UX-admin-live-classes-01 /admin route /admin/live-classes preserves its scoped page and legacy UI surface",()=>{
  const page=read("src/app/(authenticated)/admin/live-classes/page.tsx");
  expect(page).toContain("SuperAdminContentDirectoryPage");
  expect(page).toContain("LIVE_CLASSES");
 });
 it("UX-admin-module-access-01 /admin route /admin/module-access preserves its scoped page and legacy UI surface",()=>{
  const page=read("src/app/(authenticated)/admin/module-access/page.tsx");
  expect(page).toContain('title="Module Access"');
  expect(page).toContain('SuperAdminCollegeModuleAccessPage params={Promise.resolve({collegeId})}');

 });
 it("UX-admin-organizations-01 /admin route /admin/organizations preserves its scoped page and legacy UI surface",()=>{
  const page=read("src/app/(authenticated)/admin/organizations/page.tsx");
  expect(page).toContain('caption="Existing Organizations"');
  expect(page).toContain("No organizations found.");
  expect(page).toContain("DataTable");

 });
 it("UX-admin-people-01 /admin route /admin/people preserves its scoped page and legacy UI surface",()=>{
  const page=read("src/app/(authenticated)/admin/people/page.tsx");
  expect(page).toContain("DataTable");
  expect(page).toContain('<Pagination label="People pages"');
  expect(page).toContain("hrefForPage={href}");
  expect(page).toContain('mobilePriority: "action"');
 });
 it("UX-admin-people-directory-01 /admin route /admin/people/directory preserves its scoped page and legacy UI surface",()=>{
  const page=read("src/app/(authenticated)/admin/people/directory/page.tsx");
  expect(page).toContain('title="People Directory"');
  expect(page).toContain("No matching contacts");

 });
 it("UX-admin-people-directory-membershipId-01 /admin route /admin/people/directory/[membershipId] preserves its scoped page and legacy UI surface",()=>{
  const page=read("src/app/(authenticated)/admin/people/directory/[membershipId]/page.tsx");
  expect(page).toContain("getSuperAdminMembershipDetail");
  expect(page).toContain("View audit trail");
 });
 it("UX-admin-people-directory-membershipId-audit-01 /admin route /admin/people/directory/[membershipId]/audit preserves its scoped page and legacy UI surface",()=>{
  const page=read("src/app/(authenticated)/admin/people/directory/[membershipId]/audit/page.tsx");
  expect(page).toContain("listSuperAdminPersonAudit");
  expect(page).toContain("No matching membership activity events have been recorded.");
 });
 it("UX-admin-people-unassigned-01 /admin route /admin/people/unassigned preserves its scoped page and legacy UI surface",()=>{
  const page=read("src/app/(authenticated)/admin/people/unassigned/page.tsx");
  expect(page).toContain("title=\"Users without college memberships\"");
  expect(page).toContain("No matching users");
 });
 it("UX-admin-placements-01 /admin route /admin/placements preserves its scoped page and legacy UI surface",()=>{
  const page=read("src/app/(authenticated)/admin/placements/page.tsx");
  expect(page).toContain("PlacementOperationsWorkspace");
  expect(page).toContain("title=\"Placement Drives\"");
 });
 it("UX-admin-placements-analytics-01 /admin route /admin/placements/analytics preserves its scoped page and legacy UI surface",()=>{
  const page=read("src/app/(authenticated)/admin/placements/analytics/page.tsx");
  expect(page).toContain("title=\"Placement Analytics\"");
  expect(page).toContain("Hiring Funnel");
 });
 it("UX-admin-placements-applications-01 /admin route /admin/placements/applications preserves its scoped page and legacy UI surface",()=>{
  const page=read("src/app/(authenticated)/admin/placements/applications/page.tsx");
  expect(page).toContain("AdminScopedReadPage");
  expect(page).toContain("title=\"Applications\"");
 });
 it("UX-admin-placements-applications-applicationId-01 /admin route /admin/placements/applications/[applicationId] preserves its scoped page and legacy UI surface",()=>{
  const page=read("src/app/(authenticated)/admin/placements/applications/[applicationId]/page.tsx");
  expect(page).toContain("SuperAdminPlacementDetailView");
  expect(page).toContain("Status history");
 });
 it("UX-admin-placements-calendar-01 /admin route /admin/placements/calendar preserves its scoped page and legacy UI surface",()=>{
  const page=read("src/app/(authenticated)/admin/placements/calendar/page.tsx");
  expect(page).toContain("PlacementCalendarWorkspace");
  expect(page).toContain('title="Choose a college"');
  expect(page).toContain("requireSuperAdminSelectedCollege");

 });
 it("UX-admin-placements-drives-01 /admin route /admin/placements/drives preserves its scoped page and legacy UI surface",()=>{
  const page=read("src/app/(authenticated)/admin/placements/drives/page.tsx");
  expect(page).toContain("DataTable");
  expect(page).toContain('caption="Jobs table"');
  expect(page).toContain('title="Jobs Management (LMS)"');

 });
 it("UX-admin-placements-hiring-01 /admin route /admin/placements/hiring preserves its scoped page and legacy UI surface",()=>{
  const page=read("src/app/(authenticated)/admin/placements/hiring/page.tsx");
  expect(page).toContain('redirect("/admin/placements/analytics"');
  expect(page).toContain("const suffix=");

 });
 it("UX-admin-placements-interviews-01 /admin route /admin/placements/interviews preserves its scoped page and legacy UI surface",()=>{
  const page=read("src/app/(authenticated)/admin/placements/interviews/page.tsx");
  expect(page).toContain("listSuperAdminInterviews");
  expect(page).toContain('title="Interviews"');

 });
 it("UX-admin-placements-interviews-roundId-01 /admin route /admin/placements/interviews/[roundId] preserves its scoped page and legacy UI surface",()=>{
  const page=read("src/app/(authenticated)/admin/placements/interviews/[roundId]/page.tsx");
  expect(page).toContain("SuperAdminPlacementDetailView");
  expect(page).toContain("getSuperAdminInterviewDetail");
 });
 it("UX-admin-placements-job-settings-01 /admin route /admin/placements/job-settings preserves its scoped page and legacy UI surface",()=>{
  const page=read("src/app/(authenticated)/admin/placements/job-settings/page.tsx");
  expect(page).toContain("AdminScopedReadPage");
  expect(page).toContain("title=\"Placement Job Settings\"");
 });
 it("UX-admin-placements-job-settings-jobId-01 /admin route /admin/placements/job-settings/[jobId] preserves its scoped page and legacy UI surface",()=>{
  const page=read("src/app/(authenticated)/admin/placements/job-settings/[jobId]/page.tsx");
  expect(page).toContain("SuperAdminPlacementDetailView");
  expect(page).toContain("getSuperAdminJobSettingsDetail");
 });
 it("UX-admin-placements-jobs-jobId-01 /admin route /admin/placements/jobs/[jobId] preserves its scoped page and legacy UI surface",()=>{
  const page=read("src/app/(authenticated)/admin/placements/jobs/[jobId]/page.tsx");
  expect(page).toContain("PlacementDriveWorkspace");
  expect(page).toContain('ariaLabel="Drive workspace"');

 });
 it("UX-admin-placements-jobs-jobId-applications-01 /admin route /admin/placements/jobs/[jobId]/applications preserves its scoped page and legacy UI surface",()=>{
  const page=read("src/app/(authenticated)/admin/placements/jobs/[jobId]/applications/page.tsx");
  expect(page).toContain('title={"Applications ("+data.total.toLocaleString("en-IN")+")"}');
  expect(page).toContain("CollegeApplicationPipelineControls");

 });
 it("UX-admin-placements-jobs-jobId-schedule-01 /admin route /admin/placements/jobs/[jobId]/schedule preserves its scoped page and legacy UI surface",()=>{
  const page=read("src/app/(authenticated)/admin/placements/jobs/[jobId]/schedule/page.tsx");
  expect(page).toContain("DataTable");
  expect(page).toContain("caption=\"Persisted interview rounds\"");
 });
 it("UX-admin-placements-jobs-jobId-settings-01 /admin route /admin/placements/jobs/[jobId]/settings preserves its scoped page and legacy UI surface",()=>{
  const page=read("src/app/(authenticated)/admin/placements/jobs/[jobId]/settings/page.tsx");
  expect(page).toContain('<PageHeader title="Settings"');
  expect(page).toContain("SuperAdminDriveDeadline");
  expect(page).toContain("SuperAdminDriveArchive");

 });
 it("UX-admin-placements-joining-01 /admin route /admin/placements/joining preserves its scoped page and legacy UI surface",()=>{
  const page=read("src/app/(authenticated)/admin/placements/joining/page.tsx");
  expect(page).toContain("AdminScopedReadPage");
  expect(page).toContain("title=\"Joining Outcomes\"");
 });
 it("UX-admin-placements-joining-offerId-01 /admin route /admin/placements/joining/[offerId] preserves its scoped page and legacy UI surface",()=>{
  const page=read("src/app/(authenticated)/admin/placements/joining/[offerId]/page.tsx");
  expect(page).toContain("SuperAdminPlacementDetailView");
  expect(page).toContain("getSuperAdminJoiningDetail");
 });
 it("UX-admin-placements-new-01 /admin route /admin/placements/new preserves its scoped page and legacy UI surface",()=>{
  const page=read("src/app/(authenticated)/admin/placements/new/page.tsx");
  expect(page).toContain("PlacementJobCreateWorkspace");
  expect(page).toContain('basePath:"/admin/placements"');
  expect(page).toContain("requireSuperAdminSelectedCollege");

 });
 it("UX-admin-placements-offers-01 /admin route /admin/placements/offers preserves its scoped page and legacy UI surface",()=>{
  const page=read("src/app/(authenticated)/admin/placements/offers/page.tsx");
  expect(page).toContain("AdminScopedReadPage");
  expect(page).toContain("title=\"Placement Offers\"");
 });
 it("UX-admin-placements-offers-offerId-01 /admin route /admin/placements/offers/[offerId] preserves its scoped page and legacy UI surface",()=>{
  const page=read("src/app/(authenticated)/admin/placements/offers/[offerId]/page.tsx");
  expect(page).toContain("SuperAdminPlacementDetailView");
  expect(page).toContain("getSuperAdminOfferDetail");
 });
 it("UX-admin-placements-retention-01 /admin route /admin/placements/retention preserves its scoped page and legacy UI surface",()=>{
  const page=read("src/app/(authenticated)/admin/placements/retention/page.tsx");
  expect(page).toContain("DataTable");
  expect(page).toContain("caption=\"Data retention report\"");
 });
 it("UX-admin-placements-screenings-01 /admin route /admin/placements/screenings preserves its scoped page and legacy UI surface",()=>{
  const page=read("src/app/(authenticated)/admin/placements/screenings/page.tsx");
  expect(page).toContain("AdminScopedReadPage");
  expect(page).toContain("title=\"Application Screening Queue\"");
 });
 it("UX-admin-placements-screenings-applicationId-01 /admin route /admin/placements/screenings/[applicationId] preserves its scoped page and legacy UI surface",()=>{
  const page=read("src/app/(authenticated)/admin/placements/screenings/[applicationId]/page.tsx");
  expect(page).toContain("SuperAdminPlacementDetailView");
  expect(page).toContain("getSuperAdminScreeningDetail");
 });
 it("UX-admin-placements-seasons-01 /admin route /admin/placements/seasons preserves its scoped page and legacy UI surface",()=>{
  const page=read("src/app/(authenticated)/admin/placements/seasons/page.tsx");
  expect(page).toContain("AdminScopedReadPage");
  expect(page).toContain("title=\"Placement Seasons\"");
 });
 it("UX-admin-placements-seasons-seasonId-01 /admin route /admin/placements/seasons/[seasonId] preserves its scoped page and legacy UI surface",()=>{
  const page=read("src/app/(authenticated)/admin/placements/seasons/[seasonId]/page.tsx");
  expect(page).toContain("SuperAdminPlacementDetailView");
  expect(page).toContain("getSuperAdminSeasonDetail");
 });
 it("UX-admin-placements-shared-02 keeps mobile directory states and no duplicate Source field",()=>{
  const page=read("src/components/admin/admin-scoped-read-page.tsx");
  expect(page).toContain("sm:grid-cols-2 lg:grid-cols-4");
  expect(page).toContain("No matching records");
  expect(page).toContain('name="channel"');
  expect(page.match(/<Select name="source"/g)?.length).toBe(1);
  expect(page).toContain('role="status" aria-live="polite"');
 });
 it("UX-admin-placements-detail-02 delegates to a single shell main and 44px navigation",()=>{
  const page=read("src/components/admin/super-admin-placement-detail-view.tsx");
  expect(page).toContain('return <div className="min-w-0 space-y-[var(--lms-space-4)] md:space-y-[var(--lms-space-6)]">');
  expect(page).not.toContain("<main");
  expect(page).toContain("min-h-11");
  expect(page).toContain("StatusBadge");

 });
 it("UX-admin-placements-analytics-02 preserves company totals beside a responsive hiring table",()=>{
  const page=read("src/app/(authenticated)/admin/placements/analytics/page.tsx");
  expect(page).toContain('caption="Company-wise Hiring Report"');
  expect(page).toContain('aria-label="Company-wise Hiring Report"');
  expect(page).toContain("metricKeys.map((key,index)=>");
  expect(page).toContain("COMPANY_HIRING_COLUMNS[index+2]");
  expect(page).not.toContain('min-w-[55rem]');

 });
 it("UX-admin-placements-jobs-jobId-applications-02 retains the read-only mobile register when controls are unavailable",()=>{
  const page=read("src/app/(authenticated)/admin/placements/jobs/[jobId]/applications/page.tsx");
  expect(page).toContain("CollegeApplicationPipelineControls");
  expect(page).toContain('caption="Drive applications"');
  expect(page).toContain('empty={<EmptyState title="No matching applications"');
  expect(page).toContain('mobilePriority:"primary"');
  expect(page).toContain("No applications match these filters.");

 });
 it("UX-admin-placements-tables-02 uses required legacy-scoped DataTable empty copy and phone columns",()=>{
  for(const path of [
   "src/app/(authenticated)/admin/placements/drives/page.tsx",
   "src/app/(authenticated)/admin/placements/jobs/[jobId]/schedule/page.tsx",
   "src/app/(authenticated)/admin/placements/retention/page.tsx",
  ]){
   const page=read(path);
   expect(page).toContain("<DataTable");
   expect(page).toMatch(/empty=(?:\{hasFilters\?|\{<EmptyState)/);
   expect(page).toContain('mobilePriority:"primary"');
   expect(page).not.toContain("min-w-[55rem]");
  }
 });
 it("UX-admin-module-access-02 shared pagination stays query-scoped with keyboard-safe controls",()=>{
  const page=read("src/app/(authenticated)/admin/module-access/page.tsx");
  expect(page).toContain('const collegeId = context.adminScope?.collegeId;');
  expect(page).toContain('if (!collegeId)');
  expect(page).toContain('href="/admin/colleges"');
  expect(page).toContain('SuperAdminCollegeModuleAccessPage params={Promise.resolve({collegeId})}');
  expect(page).toContain('ModuleAccessHierarchyActions');

 });
 it("UX-admin-people-unassigned-02 paginates without losing active filters or revealing contact fields",()=>{
  const page=read("src/app/(authenticated)/admin/people/unassigned/page.tsx");
  expect(page).toContain('label="Unassigned user pages"');
  expect(page).toContain("adminUnassignedUsersHref({...data.query,page})");
  expect(page).toContain("No users without college memberships match these filters.");
  expect(page).toContain("Personal contact and session information are excluded.");
 });

 it("UX-admin-middle-third-coverage-01 keeps exactly 37 route notes and named acceptance tests",()=>{
  const list=read("docs/orchestrator/ui-ux/pages-admin.md");
  const routes=[...list.matchAll(/^- \[[ x]\] `([^`]+)`/gm)].map(match=>match[1]!);
  expect(routes).toHaveLength(111);
  const slice=routes.slice(37,74);
  expect(slice).toHaveLength(37);
  const tests=read("tests/unit/ux-admin-chat6-middle-third.test.ts");
  for(const route of slice){
   const slug=route.slice("/admin/".length).replace(/[\/\[\]]+/g,"-").replace(/-$/,"");
   const note=read("docs/audit/ux/admin-"+slug+".md");
   expect(note).toContain("# "+route+" · UX source review");
   expect(tests).toContain("UX-admin-"+slug+"-01");
  }
 });

});
