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
  expect(page).toContain("No semesters found. Create a program first, then add semesters.");
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
  expect(view).toContain('return <div className="min-w-0 space-y-5">');
  expect(view).not.toContain("<main");
  expect(view).not.toContain("min-h-10");
  expect(view).not.toContain("text-[#26bac7]");
  expect(view).toContain('focus-visible:outline-2');
  expect(view).toContain("← Back to directory");
 });
 it("UX-admin-placements-student-lookup-03 enforces the accessible interaction contract",()=>{
  const page=source("src/app/(authenticated)/admin/placements/student-lookup/page.tsx");
  expect(page).toContain("<DataTable");
  expect(page).toContain("disabled={!ctx.adminScope?.collegeId}");
  expect(page).toContain("No applications found.");
  expect(page).toContain('mobilePriority:"primary"');
  expect(page).toContain("<StatusBadge");
  expect(page).toContain('role="search"');
 });
 it("UX-admin-tenants-03 enforces the accessible interaction contract",()=>{
  const page=source("src/app/(authenticated)/admin/tenants/page.tsx");
  for(const slot of ["<Input","<Select","<Button","<Pagination"])expect(page).toContain(slot);
  expect(page).toContain('label="Tenant pages"');
  expect(page).toContain("No colleges in the current scope match these lifecycle filters.");
 });
 it("UX-admin-projects-templates-03 enforces the accessible interaction contract",()=>{
  const page=source("src/app/(authenticated)/admin/projects/templates/page.tsx");
  for(const slot of ["<Input","<Select","<Button","<Pagination"])expect(page).toContain(slot);
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
