import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
import {join} from "node:path";
const source=(file:string)=>readFileSync(join(process.cwd(),file),"utf8");
describe("chat-9 UX last-third substantive interactions",()=>{
 it("UX-admin-semesters-03 enforces the accessible interaction contract",()=>{
  const page=source("src/app/(authenticated)/admin/semesters/page.tsx");
  for(const slot of ["<DataTable","<Input","<Select","<Button","<Pagination"])expect(page).toContain(slot);
  expect(page).toContain('mobilePriority:"primary"');
  expect(page).toContain('mobilePriority:"action"');
  expect(page).toContain('title="No semesters found"');
  expect(page).toContain("No semesters match these filters. Create a program first, then add semesters.");
  expect(page).toContain('hrefForPage={page=>pageHref({...data.query,page})}');
  expect(page).not.toContain("<table");
 });
 it("UX-admin-settings-03 enforces the accessible interaction contract",()=>{
  const page=source("src/app/(authenticated)/admin/settings/page.tsx");
  for(const slot of ["<Input","<Select","<Button"])expect(page).toContain(slot);
  expect(page).toContain("No visible settings match the selected filters.");
  expect(page).toContain('role="status"');
 });
 it("UX-admin-placements-shortlisted-application-id-03 enforces the accessible interaction contract",()=>{
  const view=source("src/components/admin/super-admin-placement-detail-view.tsx");
  expect(view).toContain('return <div className="min-w-0 space-y-[var(--lms-space-4)] md:space-y-[var(--lms-space-6)]">');
  expect(view).not.toContain("<main");
  expect(view).not.toContain("min-h-10");
  expect(view).not.toContain("text-[#26bac7]");
  expect(view).toContain('focus-visible:outline-2');
  expect(view).toContain('<PageBackLink href={data.backHref} label="Back to directory"');
 });
 it("UX-admin-placements-student-lookup-03 enforces the accessible interaction contract",()=>{
  const page=source("src/app/(authenticated)/admin/placements/student-lookup/page.tsx");
  const search=source("src/components/placements/admin-placement-student-search.tsx");
  expect(page).toContain('<ul className="min-w-0 divide-y divide-border border-y border-border">');
  expect(search).toContain("disabled={!collegeId}");
  expect(page).toContain("No applications yet");
  expect(page).toContain("<StatusBadge");
  expect(search).toContain('role="search"');
 });
 it("UX-admin-tenants-03 enforces the accessible interaction contract",()=>{
  const landing=source("src/app/(authenticated)/admin/tenants/page.tsx");
  expect(landing).toContain('<TenantDirectory searchParams={Promise.resolve(raw)}');
  const page=source("src/app/(authenticated)/admin/tenants/directory/page.tsx");
  for(const slot of ["<Input","<Select","<Button","<Pagination"])expect(page).toContain(slot);
  expect(page).toContain('label="Tenant pages"');
  expect(page).toContain("No colleges in the current scope match these lifecycle filters.");
 });
 it("UX-admin-projects-templates-03 enforces the accessible interaction contract",()=>{
  const page=source("src/app/(authenticated)/admin/projects/templates/page.tsx");
  for(const slot of ["<Select","<Button","<Pagination"])expect(page).toContain(slot);
  // The labelled search field lives in the debounced client search, which renders the shared Input.
  expect(page).toContain("<SuperAdminTemplateAutoSearch");
  expect(source("src/components/projects/super-admin-template-auto-search.tsx")).toContain("<Input");
  expect(page).toContain("No global template metadata matches these filters.");
  expect(page).toContain('can(context,"project-template.manage")');
 });
 it("UX-admin-projects-templates-template-id-colleges-03 enforces the accessible interaction contract",()=>{
  const page=source("src/app/(authenticated)/admin/projects/templates/[templateId]/colleges/page.tsx");
  for(const slot of ["<Input","<Select","<Button","<Pagination"])expect(page).toContain(slot);
  expect(page).toContain('can(context,"project-template.assign"');
  expect(page).toContain('description="No active colleges match the filters in the current safety scope."');
 });
});
