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
 it("UX-admin-college-admins-01 uses shared phone-safe cards and explicit empty copy",()=>{
   const page=read("src/app/(authenticated)/admin/colleges/[collegeId]/admins/page.tsx");
   expect(page).toContain("<DataTable");
   expect(page).toContain("No active College Admin or TPO accounts in this college.");
   expect(page).toContain("mobilePriority:");
   expect(page).not.toContain("<main");
   expect(page).not.toContain('min-w-[46rem]');
 });
 it("UX-admin-admin-sessions-01 uses shared phone-safe cards and explicit empty copy",()=>{
   const page=read("src/app/(authenticated)/admin/colleges/[collegeId]/admins/[userId]/page.tsx");
   expect(page).toContain("<DataTable");
   expect(page).toContain("No active sessions for this account.");
   expect(page).toContain("mobilePriority:");
   expect(page).not.toContain("<main");
   expect(page).not.toContain('min-w-[46rem]');
 });
 it("UX-admin-admin-history-01 uses shared phone-safe cards and explicit empty copy",()=>{
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
 it("UX-admin-academics-section-01 keeps scope-safe accessible route surface",()=>{
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
 it("UX-admin-batch-roster-01 supports mobile-safe navigation without changing legacy wording",()=>{
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
});
