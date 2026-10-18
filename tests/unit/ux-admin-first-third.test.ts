import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
const read=(p:string)=>readFileSync(p,"utf8");
describe("Super Admin UX first-third rollout",()=>{
 it("UX-admin-batches-01 responsive shared DataTable with explicit empty text and preserved controls",()=>{
   const page=read("src/app/(authenticated)/admin/batches/page.tsx");
   expect(page).toContain('<PageHeader eyebrow="Super Admin · Academic Setup" title="Batches"');
   expect(page).toContain('<DataTable<(typeof data.items)[number]>');
   expect(page).toContain('mobilePriority:"action"');
   expect(page).toContain('No matching batches on this page.');
   expect(page).toContain('min-w-0 w-full sm:min-w-');
   expect(page).not.toContain('min-w-[38rem]');
 });
 it("UX-admin-classes-01 responsive shared DataTable with explicit empty text and preserved controls",()=>{
   const page=read("src/app/(authenticated)/admin/classes/page.tsx");
   expect(page).toContain('<PageHeader eyebrow="Super Admin · Academic Setup" title="Classes"');
   expect(page).toContain('<DataTable<(typeof data.items)[number]>');
   expect(page).toContain('mobilePriority:"action"');
   expect(page).toContain('No matching classes on this page.');
   expect(page).toContain('min-w-0 w-full sm:min-w-');
   expect(page).not.toContain('min-w-[38rem]');
 });
 it("UX-admin-colleges-collegeId-admins-01 uses shared phone-safe cards and explicit empty copy",()=>{
   const page=read("src/app/(authenticated)/admin/colleges/[collegeId]/admins/page.tsx");
   expect(page).toContain("<DataTable");
   expect(page).toContain("No active College Admin or TPO accounts in this college.");
   expect(page).toContain("mobilePriority:");
   expect(page).not.toContain("<main");
   expect(page).not.toContain('min-w-[46rem]');
 });
 it("UX-admin-colleges-collegeId-admins-userId-01 uses shared phone-safe cards and explicit empty copy",()=>{
   const page=read("src/app/(authenticated)/admin/colleges/[collegeId]/admins/[userId]/page.tsx");
   expect(page).toContain("<DataTable");
   expect(page).toContain("No active sessions for this account.");
   expect(page).toContain("mobilePriority:");
   expect(page).not.toContain("<main");
   expect(page).not.toContain('min-w-[46rem]');
 });
 it("UX-admin-colleges-collegeId-admins-userId-history-01 uses shared phone-safe cards and explicit empty copy",()=>{
   const page=read("src/app/(authenticated)/admin/colleges/[collegeId]/admins/[userId]/history/page.tsx");
   expect(page).toContain("<DataTable");
   expect(page).toContain("No matching identity or platform history was recorded for this administrator in the current college.");
   expect(page).toContain("mobilePriority:");
   expect(page).not.toContain("<main");
   expect(page).not.toContain('min-w-[46rem]');
 });
 it("UX-admin-academics-01 keeps scope-safe accessible route surface",()=>{
   const page=read("src/app/(authenticated)/admin/academics/page.tsx");
   expect(page).not.toContain("<main");
   expect(page).not.toMatch(/min-h-10\b/);
   expect(page).not.toContain("text-primary-text");
   expect(page).toContain("min-w-0");
 });
 it("UX-admin-academics-sections-sectionId-01 keeps scope-safe accessible route surface",()=>{
   const page=read("src/app/(authenticated)/admin/academics/sections/[sectionId]/page.tsx");
   expect(page).not.toContain("<main");
   expect(page).not.toMatch(/min-h-10\b/);
   expect(page).not.toContain("text-primary-text");
   expect(page).toContain("min-w-0");
 });
 it("UX-admin-announcements-01 keeps scope-safe accessible route surface",()=>{
   const page=read("src/app/(authenticated)/admin/announcements/page.tsx");
   expect(page).not.toContain("<main");
   expect(page).not.toMatch(/min-h-10\b/);
   expect(page).not.toContain("text-primary-text");
   expect(page).toContain("min-w-0");
 });
 it("UX-admin-assignments-01 keeps scope-safe accessible route surface",()=>{
   const page=read("src/app/(authenticated)/admin/assignments/page.tsx");
   expect(page).not.toContain("<main");
   expect(page).not.toMatch(/min-h-10\b/);
   expect(page).not.toContain("text-primary-text");
   expect(page).toContain("min-w-0");
 });
 it("UX-admin-attendance-01 supports mobile-safe navigation without changing legacy wording",()=>{
  const page=read("src/app/(authenticated)/admin/attendance/page.tsx");
  expect(page).not.toContain("<main");
  expect(page).not.toContain("text-primary-text");
  expect(page).toContain("min-w-0");
  expect(page).not.toContain("min-h-10");
 });
 it("UX-admin-audit-01 supports mobile-safe navigation without changing legacy wording",()=>{
  const page=read("src/app/(authenticated)/admin/audit/page.tsx");
  expect(page).not.toContain("<main");
  expect(page).not.toContain("text-primary-text");
  expect(page).toContain("min-w-0");
  expect(page).not.toContain("min-h-10");
 });
 it("UX-admin-batch-promotion-01 supports mobile-safe navigation without changing legacy wording",()=>{
  const page=read("src/app/(authenticated)/admin/batch-promotion/page.tsx");
  expect(page).not.toContain("<main");
  expect(page).not.toContain("text-primary-text");
  expect(page).toContain("min-w-0");
  expect(page).not.toContain("min-h-10");
 });
 it("UX-admin-batches-batchId-students-01 supports mobile-safe navigation without changing legacy wording",()=>{
  const page=read("src/app/(authenticated)/admin/batches/[batchId]/students/page.tsx");
  expect(page).not.toContain("<main");
  expect(page).not.toContain("text-primary-text");
  expect(page).toContain("min-w-0");
  expect(page).toContain("<DataTable");
  expect(page).toContain("No classes exist for this batch.");
  expect(page).toContain("<Breadcrumbs");
 });
 it("UX-admin-colleges-01 preserves legacy routes with accessible layout",()=>{
   const page=read("src/app/(authenticated)/admin/colleges/page.tsx");
   expect(page).not.toContain("text-primary-text");
   expect(page).not.toContain("min-h-10");
   expect(page).not.toContain("<main");
   expect(page).toContain("min-w-0");
 });
 it("UX-admin-colleges-collegeId-01 preserves legacy routes with accessible layout",()=>{
   const page=read("src/app/(authenticated)/admin/colleges/[collegeId]/page.tsx");
   expect(page).not.toContain("text-primary-text");
   expect(page).not.toContain("min-h-10");
   expect(page).not.toContain("<main");
   expect(page).toContain("min-w-0");
 });
 it("UX-admin-colleges-collegeId-branding-01 preserves legacy routes with accessible layout",()=>{
   const page=read("src/app/(authenticated)/admin/colleges/[collegeId]/branding/page.tsx");
   expect(page).not.toContain("text-primary-text");
   expect(page).not.toContain("min-h-10");
   expect(page).not.toContain("<main");
   expect(page).toContain("min-w-0");
 });
 it("UX-admin-colleges-collegeId-readiness-01 preserves legacy routes with accessible layout",()=>{
   const page=read("src/app/(authenticated)/admin/colleges/[collegeId]/readiness/page.tsx");
   expect(page).not.toContain("text-primary-text");
   expect(page).not.toContain("min-h-10");
   expect(page).not.toContain("<main");
   expect(page).toContain("min-w-0");
 });
 it("UX-admin-colleges-collegeId-signin-01 preserves legacy routes with accessible layout",()=>{
   const page=read("src/app/(authenticated)/admin/colleges/[collegeId]/signin/page.tsx");
   expect(page).not.toContain("text-primary-text");
   expect(page).not.toContain("min-h-10");
   expect(page).not.toContain("<main");
   expect(page).toContain("min-w-0");
 });
 it("UX-admin-colleges-collegeId-subdomain-01 preserves legacy routes with accessible layout",()=>{
   const page=read("src/app/(authenticated)/admin/colleges/[collegeId]/subdomain/page.tsx");
   expect(page).not.toContain("text-primary-text");
   expect(page).not.toContain("min-h-10");
   expect(page).not.toContain("<main");
   expect(page).toContain("min-w-0");
 });
 it("UX-admin-colleges-collegeId-verification-01 preserves legacy routes with accessible layout",()=>{
   const page=read("src/app/(authenticated)/admin/colleges/[collegeId]/verification/page.tsx");
   expect(page).not.toContain("text-primary-text");
   expect(page).not.toContain("min-h-10");
   expect(page).not.toContain("<main");
   expect(page).toContain("min-w-0");
 });
 it("UX-admin-companies-01 preserves legacy routes with accessible layout",()=>{
   const page=read("src/app/(authenticated)/admin/companies/page.tsx");
   expect(page).not.toContain("text-primary-text");
   expect(page).not.toContain("min-h-10");
   expect(page).not.toContain("<main");
   expect(page).toContain("min-w-0");
 });
 it("UX-admin-companies-companyId-drives-01 retains guarded phone-safe UI",()=>{
   const page=read("src/app/(authenticated)/admin/companies/[companyId]/drives/page.tsx");
   expect(page).not.toContain("<main");
   expect(page).not.toContain("min-h-10");
   expect(page).not.toContain("text-primary-text");
   expect(page).toContain("min-w-0");
 });
 it("UX-admin-course-progress-01 retains guarded phone-safe UI",()=>{
   const page=read("src/app/(authenticated)/admin/course-progress/page.tsx");
   expect(page).not.toContain("<main");
   expect(page).not.toContain("min-h-10");
   expect(page).not.toContain("text-primary-text");
   expect(page).toContain("min-w-0");
 });
 it("UX-admin-courses-01 retains guarded phone-safe UI",()=>{
   const page=read("src/app/(authenticated)/admin/courses/page.tsx");
   expect(page).not.toContain("<main");
   expect(page).not.toContain("min-h-10");
   expect(page).not.toContain("text-primary-text");
   expect(page).toContain("min-w-0");
 });
 it("UX-admin-courses-offerings-offeringId-01 retains guarded phone-safe UI",()=>{
   const page=read("src/app/(authenticated)/admin/courses/offerings/[offeringId]/page.tsx");
   expect(page).not.toContain("<main");
   expect(page).not.toContain("min-h-10");
   expect(page).not.toContain("text-primary-text");
   expect(page).toContain("min-w-0");
 });
 it("UX-admin-departments-01 retains guarded phone-safe UI",()=>{
   const page=read("src/app/(authenticated)/admin/departments/page.tsx");
   expect(page).not.toContain("<main");
   expect(page).not.toContain("min-h-10");
   expect(page).not.toContain("text-primary-text");
   expect(page).toContain("min-w-0");
 });
 it("UX-admin-domains-01 retains guarded phone-safe UI",()=>{
   const page=read("src/app/(authenticated)/admin/domains/page.tsx");
   expect(page).not.toContain("<main");
   expect(page).not.toContain("min-h-10");
   expect(page).not.toContain("text-primary-text");
   expect(page).toContain("min-w-0");
 });
 it("UX-admin-electives-01 retains guarded phone-safe UI",()=>{
   const page=read("src/app/(authenticated)/admin/electives/page.tsx");
   expect(page).not.toContain("<main");
   expect(page).not.toContain("min-h-10");
   expect(page).not.toContain("text-primary-text");
   expect(page).toContain("min-w-0");
 });
 it("UX-admin-faculty-01 retains guarded phone-safe UI",()=>{
   const page=read("src/app/(authenticated)/admin/faculty/page.tsx");
   expect(page).not.toContain("<main");
   expect(page).not.toContain("min-h-10");
   expect(page).not.toContain("text-primary-text");
   expect(page).toContain("min-w-0");
 });
 it("UX-admin-faculty-assignment-01 keeps Super Admin access and responsive styling",()=>{
   const page=read("src/app/(authenticated)/admin/faculty-assignment/page.tsx");
   expect(page).not.toContain("<main");
   expect(page).not.toContain("text-primary-text");
   expect(page).not.toContain("min-h-10");
   expect(page).toContain("min-w-0");
 });
 it("UX-admin-features-01 keeps Super Admin access and responsive styling",()=>{
   const page=read("src/app/(authenticated)/admin/features/page.tsx");
   expect(page).not.toContain("<main");
   expect(page).not.toContain("text-primary-text");
   expect(page).not.toContain("min-h-10");
   expect(page).toContain("min-w-0");
 });
 it("UX-admin-features-collegeId-01 keeps Super Admin access and responsive styling",()=>{
   const page=read("src/app/(authenticated)/admin/features/[collegeId]/page.tsx");
   expect(page).not.toContain("<main");
   expect(page).not.toContain("text-primary-text");
   expect(page).not.toContain("min-h-10");
   expect(page).toContain("min-w-0");
 });
 it("UX-admin-features-collegeId-history-01 keeps Super Admin access and responsive styling",()=>{
   const page=read("src/app/(authenticated)/admin/features/[collegeId]/history/page.tsx");
   expect(page).not.toContain("<main");
   expect(page).not.toContain("text-primary-text");
   expect(page).not.toContain("min-h-10");
   expect(page).toContain("min-w-0");
 });
 it("UX-admin-features-collegeId-students-membershipId-01 keeps Super Admin access and responsive styling",()=>{
   const page=read("src/app/(authenticated)/admin/features/[collegeId]/students/[membershipId]/page.tsx");
   expect(page).not.toContain("<main");
   expect(page).not.toContain("text-primary-text");
   expect(page).not.toContain("min-h-10");
   expect(page).toContain("min-w-0");
 });
 it("UX-admin-features-collegeId-students-membershipId-history-01 keeps Super Admin access and responsive styling",()=>{
   const page=read("src/app/(authenticated)/admin/features/[collegeId]/students/[membershipId]/history/page.tsx");
   expect(page).not.toContain("<main");
   expect(page).not.toContain("text-primary-text");
   expect(page).not.toContain("min-h-10");
   expect(page).toContain("min-w-0");
 });
 it("UX-admin-features-collegeId-trace-01 keeps Super Admin access and responsive styling",()=>{
   const page=read("src/app/(authenticated)/admin/features/[collegeId]/trace/page.tsx");
   expect(page).not.toContain("<main");
   expect(page).not.toContain("text-primary-text");
   expect(page).not.toContain("min-h-10");
   expect(page).toContain("min-w-0");
 });
 it("UX-admin-hr-01 keeps Super Admin access and responsive styling",()=>{
   const page=read("src/app/(authenticated)/admin/hr/page.tsx");
   expect(page).not.toContain("<main");
   expect(page).not.toContain("text-primary-text");
   expect(page).not.toContain("min-h-10");
   expect(page).toContain("min-w-0");
 });
 it("UX-admin-colleges-02 renders one responsive college directory with labelled actions and pagination",()=>{
   const page=read("src/app/(authenticated)/admin/colleges/page.tsx");
   expect(page).toContain('<DataTable columns={columns} rows={visible}');
   expect(page).toContain('mobilePriority: "primary"');
   expect(page).toContain('mobilePriority: "action"');
   expect(page).toContain('<Pagination page={page} pageCount={pages} hrefForPage={href}');
   expect(page).not.toContain('lg:hidden');
   expect(page).not.toContain('lg:block');
   expect(page).toContain('empty={<EmptyState title={q ? "No colleges match your search" : "No active colleges in this scope"}');
 });
 it("UX-admin-batch-promotion-02 keeps Preview accessible on phone without a wide table",()=>{
   const page=read("src/app/(authenticated)/admin/batch-promotion/page.tsx");
   expect(page).toContain('<DataTable<(typeof visibleCohorts)[number]>');
   expect(page).toContain('mobilePriority:"action"');
   expect(page).toContain('No batches match the selected program and status.');
   expect(page).toContain('cohortId:batch.id');
   expect(page).not.toContain('min-w-[44rem]');
 });
 it("UX-admin-companies-companyId-drives-02 uses responsive history and an explicit empty state",()=>{
   const page=read("src/app/(authenticated)/admin/companies/[companyId]/drives/page.tsx");
   expect(page).toContain("<DataTable<");
   expect(page).toContain('mobilePriority:"action"');
   expect(page).toContain('empty={<EmptyState title="No drives recorded"');
   expect(page).not.toContain('min-w-[42rem]');
 });
 it("UX-admin-features-collegeId-trace-02 exposes learner actions on phones and keeps resolution level visible",()=>{
  const page=read("src/app/(authenticated)/admin/features/[collegeId]/trace/page.tsx");
  expect(page).toContain('<DataTable<(typeof learners)[number]>');
  expect(page).toContain('mobilePriority:"action"');
  expect(page).toContain('No matching learners');
  expect(page).toContain('overridesModule:query.overridesModule');
  const table=read("src/components/ui/data-table.tsx");
  const cue=read("src/components/ui/scroll-cue.tsx");
  expect(table).toContain("sm:first:sticky sm:first:left-0");
  expect(table).toContain('<ScrollCue axis="x"');
  expect(cue).toContain("tabIndex={edges.scrollable ? 0 : -1}");
  expect(page).toContain('mobilePriority:"action"');
 });
 it("UX-admin-features-02 mounts module editors once and retains accessible matrix controls",()=>{
  const page=read("src/app/(authenticated)/admin/features/page.tsx");
  expect(page).toContain('<DataTable<(typeof result.items)[number]>');
  expect(page).toContain('mobilePriority:"action"');
  expect(page).toContain('CollegeFeatureRuleEditor collegeId={college.id}');
  expect(page).toContain('No colleges on this page');
  expect(page).not.toContain('lg:hidden');
  expect(page).not.toContain('lg:block');
  expect(page).not.toContain('min-w-[50rem]');
 });
 it("UX-admin-features-collegeId-02 mounts one module matrix and one override directory across breakpoints",()=>{
  const page=read("src/app/(authenticated)/admin/features/[collegeId]/page.tsx");
  expect(page).toContain('<DataTable<(typeof OPTIONAL_MODULE_KEYS)[number]>');
  expect(page).toContain('<DataTable<(typeof result.descendants)[number]>');
  expect(page).toContain("No lower-level overrides");
  expect(page).toContain("The requested page is outside the available override range.");
  expect(page).not.toContain("lg:hidden");
  expect(page).not.toContain("min-w-[42rem]");
  expect(page).not.toContain("min-w-[38rem]");
 });
 it("UX-admin-colleges-04 has one empty state without duplicate alerts",()=>{
  const page=read("src/app/(authenticated)/admin/colleges/page.tsx");
  expect((page.match(/No active colleges in this scope/g)??[]).length).toBe(1);
  expect(page).toContain("DataTable columns={columns}");
 });
});
