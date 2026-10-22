import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
import {join} from "node:path";
const source=(path:string)=>readFileSync(join(process.cwd(),path),"utf8");
describe("chat-9 last-third admin UX rollout, batch 02",()=>{
 it("UX-admin-projects-readiness-01 preserves verified shared UX contract",()=>{
  const page=source("src/app/(authenticated)/admin/projects/readiness/page.tsx");
  expect(page).toMatch(/export default|export\s*\{\s*default\s*\}/);
  expect(page).not.toContain("text-[#26bac7]");
  expect(page).not.toContain("min-h-10");
  expect(page).toMatch(/PageHeader|SuperAdminTemplateSubviewPage|ProjectAdmin|redirect\(|<SuperAdminTemplateTabs/);
 });
 it("UX-admin-projects-reassign-mentor-01 preserves verified shared UX contract",()=>{
  const page=source("src/app/(authenticated)/admin/projects/reassign-mentor/page.tsx");
  expect(page).toMatch(/export default|export\s*\{\s*default\s*\}/);
  expect(page).not.toContain("text-[#26bac7]");
  expect(page).not.toContain("min-h-10");
  expect(page).toMatch(/PageHeader|SuperAdminTemplateSubviewPage|ProjectAdmin|redirect\(|<SuperAdminTemplateTabs/);
 });
 it("UX-admin-projects-submissions-01 preserves verified shared UX contract",()=>{
  const page=source("src/app/(authenticated)/admin/projects/submissions/page.tsx");
  expect(page).toMatch(/export default|export\s*\{\s*default\s*\}/);
  expect(page).not.toContain("text-[#26bac7]");
  expect(page).not.toContain("min-h-10");
  expect(page).toMatch(/PageHeader|SuperAdminTemplateSubviewPage|ProjectAdmin|redirect\(|<SuperAdminTemplateTabs/);
 });
 it("UX-admin-projects-templates-01 preserves verified shared UX contract",()=>{
  const page=source("src/app/(authenticated)/admin/projects/templates/page.tsx");
  expect(page).toMatch(/export default|export\s*\{\s*default\s*\}/);
  expect(page).not.toContain("text-[#26bac7]");
  expect(page).not.toContain("min-h-10");
  for(const component of ["<Input","<Select","<Button","<Pagination"])expect(page).toContain(component);
  expect(page).toMatch(/PageHeader|SuperAdminTemplateSubviewPage|ProjectAdmin|redirect\(|<SuperAdminTemplateTabs/);
 });
 it("UX-admin-projects-templates-template-id-01 preserves verified shared UX contract",()=>{
  const page=source("src/app/(authenticated)/admin/projects/templates/[templateId]/page.tsx");
  expect(page).toMatch(/export default|export\s*\{\s*default\s*\}/);
  expect(page).not.toContain("text-[#26bac7]");
  expect(page).not.toContain("min-h-10");
  expect(page).toMatch(/PageHeader|SuperAdminTemplateSubviewPage|ProjectAdmin|redirect\(|<SuperAdminTemplateTabs/);
 });
 it("UX-admin-projects-templates-template-id-colleges-01 preserves verified shared UX contract",()=>{
  const page=source("src/app/(authenticated)/admin/projects/templates/[templateId]/colleges/page.tsx");
  expect(page).toMatch(/export default|export\s*\{\s*default\s*\}/);
  expect(page).not.toContain("text-[#26bac7]");
  expect(page).not.toContain("min-h-10");
  for(const component of ["<Input","<Select","<Button","<Pagination"])expect(page).toContain(component);
  expect(page).toMatch(/PageHeader|SuperAdminTemplateSubviewPage|ProjectAdmin|redirect\(|<SuperAdminTemplateTabs/);
 });
 it("UX-admin-projects-templates-template-id-overview-01 preserves verified shared UX contract",()=>{
  const page=source("src/app/(authenticated)/admin/projects/templates/[templateId]/overview/page.tsx");
  expect(page).toMatch(/export default|export\s*\{\s*default\s*\}/);
  expect(page.length).toBeGreaterThan(90);
  expect(page).toMatch(/PageHeader|SuperAdminTemplateSubviewPage|ProjectAdmin|redirect\(|<SuperAdminTemplateTabs/);
 });
 it("UX-admin-projects-templates-template-id-resources-01 preserves verified shared UX contract",()=>{
  const page=source("src/app/(authenticated)/admin/projects/templates/[templateId]/resources/page.tsx");
  expect(page).toMatch(/export default|export\s*\{\s*default\s*\}/);
  expect(page.length).toBeGreaterThan(90);
  expect(page).toMatch(/PageHeader|SuperAdminTemplateSubviewPage|ProjectAdmin|redirect\(|<SuperAdminTemplateTabs/);
 });
 it("UX-admin-projects-templates-template-id-sprints-01 preserves verified shared UX contract",()=>{
  const page=source("src/app/(authenticated)/admin/projects/templates/[templateId]/sprints/page.tsx");
  expect(page).toMatch(/export default|export\s*\{\s*default\s*\}/);
  expect(page.length).toBeGreaterThan(90);
  expect(page).toMatch(/PageHeader|SuperAdminTemplateSubviewPage|ProjectAdmin|redirect\(|<SuperAdminTemplateTabs/);
 });
 it("UX-admin-projects-templates-template-id-tasks-01 preserves verified shared UX contract",()=>{
  const page=source("src/app/(authenticated)/admin/projects/templates/[templateId]/tasks/page.tsx");
  expect(page).toMatch(/export default|export\s*\{\s*default\s*\}/);
  expect(page.length).toBeGreaterThan(90);
  expect(page).toMatch(/PageHeader|SuperAdminTemplateSubviewPage|ProjectAdmin|redirect\(|<SuperAdminTemplateTabs/);
 });
});
