import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
import {join} from "node:path";
const source=(path:string)=>readFileSync(join(process.cwd(),path),"utf8");
describe("chat-9 last-third admin UX rollout, batch 03",()=>{
 it("UX-admin-projects-templates-template-id-versions-01 protects route accessibility and delegate",()=>{
  const page=source("src/app/(authenticated)/admin/projects/templates/[templateId]/versions/page.tsx");
  expect(page).toMatch(/export default|export\s*\{\s*default\s*\}/);
  expect(page.length).toBeGreaterThan(90);
  expect(page).toMatch(/PageHeader|SuperAdminTemplateSubviewPage|AdminScopedReadPage|SuperAdminContentDirectoryPage|redirect\(|export\s*\{\s*default\s*\}/);
 });
 it("UX-admin-projects-templates-template-id-versions-version-id-01 protects route accessibility and delegate",()=>{
  const page=source("src/app/(authenticated)/admin/projects/templates/[templateId]/versions/[versionId]/page.tsx");
  expect(page).toMatch(/export default|export\s*\{\s*default\s*\}/);
  expect(page).not.toContain("text-primary-text");
  expect(page).not.toContain("min-h-10");
  expect(page).toMatch(/PageHeader|SuperAdminTemplateSubviewPage|AdminScopedReadPage|SuperAdminContentDirectoryPage|redirect\(|export\s*\{\s*default\s*\}/);
 });
 it("UX-admin-projects-templates-new-01 protects route accessibility and delegate",()=>{
  const page=source("src/app/(authenticated)/admin/projects/templates/new/page.tsx");
  expect(page).toMatch(/export default|export\s*\{\s*default\s*\}/);
  expect(page).not.toContain("text-primary-text");
  expect(page).not.toContain("min-h-10");
  expect(page).toMatch(/PageHeader|SuperAdminTemplateSubviewPage|AdminScopedReadPage|SuperAdminContentDirectoryPage|redirect\(|export\s*\{\s*default\s*\}/);
 });
 it("UX-admin-projects-workspaces-new-01 protects route accessibility and delegate",()=>{
  const page=source("src/app/(authenticated)/admin/projects/workspaces/new/page.tsx");
  expect(page).toMatch(/export default|export\s*\{\s*default\s*\}/);
  expect(page).toContain("text-primary-text");
  expect(page).toContain("focus-visible:outline-2");
  expect(page).not.toContain("min-h-10");
  expect(page).toMatch(/PageHeader|SuperAdminTemplateSubviewPage|AdminScopedReadPage|SuperAdminContentDirectoryPage|redirect\(|export\s*\{\s*default\s*\}/);
 });
 it("UX-admin-quizzes-01 protects route accessibility and delegate",()=>{
  const page=source("src/app/(authenticated)/admin/quizzes/page.tsx");
  expect(page).toMatch(/export default|export\s*\{\s*default\s*\}/);
  expect(page).toContain("text-primary-text");
  expect(page).toContain("focus-visible:outline-2");
  expect(page).not.toContain("min-h-10");
  expect(page).toMatch(/PageHeader|SuperAdminTemplateSubviewPage|AdminScopedReadPage|SuperAdminContentDirectoryPage|redirect\(|export\s*\{\s*default\s*\}/);
 });
 it("UX-admin-recruiters-01 protects route accessibility and delegate",()=>{
  const page=source("src/app/(authenticated)/admin/recruiters/page.tsx");
  expect(page).toMatch(/export default|export\s*\{\s*default\s*\}/);
  expect(page.length).toBeGreaterThan(90);
  expect(page).toMatch(/PageHeader|SuperAdminTemplateSubviewPage|AdminScopedReadPage|SuperAdminContentDirectoryPage|redirect\(|export\s*\{\s*default\s*\}/);
 });
 it("UX-admin-resources-01 protects route accessibility and delegate",()=>{
  const page=source("src/app/(authenticated)/admin/resources/page.tsx");
  expect(page).toMatch(/export default|export\s*\{\s*default\s*\}/);
  expect(page.length).toBeGreaterThan(90);
  expect(page).toMatch(/PageHeader|SuperAdminTemplateSubviewPage|AdminScopedReadPage|SuperAdminContentDirectoryPage|redirect\(|export\s*\{\s*default\s*\}/);
 });
 it("UX-admin-semester-courses-01 protects route accessibility and delegate",()=>{
  const page=source("src/app/(authenticated)/admin/semester-courses/page.tsx");
  expect(page).toMatch(/export default|export\s*\{\s*default\s*\}/);
  expect(page).toContain("text-primary-text");
  expect(page).toContain("focus-visible:outline-2");
  expect(page).not.toContain("min-h-10");
  expect(page).toMatch(/PageHeader|SuperAdminTemplateSubviewPage|AdminScopedReadPage|SuperAdminContentDirectoryPage|redirect\(|export\s*\{\s*default\s*\}/);
 });
 it("UX-admin-semesters-01 protects route accessibility and delegate",()=>{
  const page=source("src/app/(authenticated)/admin/semesters/page.tsx");
  expect(page).toMatch(/export default|export\s*\{\s*default\s*\}/);
  expect(page).toContain("text-primary-text");
  expect(page).toContain("focus-visible:outline-2");
  expect(page).not.toContain("min-h-10");
  expect(page).toMatch(/PageHeader|SuperAdminTemplateSubviewPage|AdminScopedReadPage|SuperAdminContentDirectoryPage|redirect\(|export\s*\{\s*default\s*\}/);
 });
 it("UX-admin-settings-01 protects route accessibility and delegate",()=>{
  const page=source("src/app/(authenticated)/admin/settings/page.tsx");
  expect(page).toMatch(/export default|export\s*\{\s*default\s*\}/);
  expect(page).toContain("text-primary-text");
  expect(page).toContain("focus-visible:outline-2");
  expect(page).not.toContain("min-h-10");
  expect(page).toMatch(/PageHeader|SuperAdminTemplateSubviewPage|AdminScopedReadPage|SuperAdminContentDirectoryPage|redirect\(|export\s*\{\s*default\s*\}/);
 });
});
