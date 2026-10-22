import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
import {join} from "node:path";
const source=(path:string)=>readFileSync(join(process.cwd(),path),"utf8");
describe("chat-9 last-third admin UX rollout, batch 04",()=>{
 it("UX-admin-settings-auth-01 preserves shared UX and scoped route behavior",()=>{
  const page=source("src/app/(authenticated)/admin/settings/auth/page.tsx");
  expect(page).toMatch(/export default|export\s*\{\s*default\s*\}/);
  expect(page).not.toContain("text-[#");
  expect(page).not.toContain("min-h-10");
  expect(page).toMatch(/PageHeader|SuperAdminContentDirectoryPage|redirect\(|export\s*\{\s*default\s*\}/);
 });
 it("UX-admin-students-01 preserves shared UX and scoped route behavior",()=>{
  const page=source("src/app/(authenticated)/admin/students/page.tsx");
  expect(page).toMatch(/export default|export\s*\{\s*default\s*\}/);
  expect(page).not.toContain("text-[#");
  expect(page).not.toContain("min-h-10");
  expect(page).toContain('aria-labelledby="register-student-heading"');
  expect(page).toContain('aria-labelledby="bulk-register-students-heading"');
  expect(page).toMatch(/PageHeader|SuperAdminContentDirectoryPage|AdminScopedReadPage|redirect\(|export\s*\{\s*default\s*\}/);
 });
 it("UX-admin-tenants-01 preserves shared UX and scoped route behavior",()=>{
  const page=source("src/app/(authenticated)/admin/tenants/page.tsx");
  expect(page).toMatch(/export default|export\s*\{\s*default\s*\}/);
  expect(page).not.toContain("text-[#");
  expect(page).not.toContain("min-h-10");
  const directory=source("src/app/(authenticated)/admin/tenants/directory/page.tsx");
  for(const component of ["<Input","<Select","<Button","<Pagination"])expect(directory).toContain(component);
  expect(page).toContain("./directory/page");
  expect(page).toContain("./setup/page");
  expect(page).toContain("<TenantDirectory");
  expect(page).toContain("<SuperAdminTenantSetup");
  expect(page).toContain("can(context,\"admin-scope.select\")");
  expect(page).toContain('<nav aria-label="Tenant management related pages">');
 });
 it("UX-admin-tenants-create-01 preserves shared UX and scoped route behavior",()=>{
  const page=source("src/app/(authenticated)/admin/tenants/create/page.tsx");
  expect(page).toMatch(/export default|export\s*\{\s*default\s*\}/);
  expect(page).not.toContain("text-[#");
  expect(page).not.toContain("min-h-10");
  expect(page).toMatch(/PageHeader|SuperAdminContentDirectoryPage|redirect\(|export\s*\{\s*default\s*\}/);
 });
 it("UX-admin-tenants-setup-01 preserves shared UX and scoped route behavior",()=>{
  const page=source("src/app/(authenticated)/admin/tenants/setup/page.tsx");
  expect(page).toMatch(/export default|export\s*\{\s*default\s*\}/);
  expect(page).not.toContain("text-[#");
  expect(page).not.toContain("min-h-10");
  expect(page).toMatch(/PageHeader|SuperAdminContentDirectoryPage|redirect\(|export\s*\{\s*default\s*\}/);
 });
 it("UX-admin-verification-01 preserves shared UX and scoped route behavior",()=>{
  const page=source("src/app/(authenticated)/admin/verification/page.tsx");
  expect(page).toMatch(/export default|export\s*\{\s*default\s*\}/);
  expect(page).not.toContain("text-[#");
  expect(page).not.toContain("min-h-10");
  expect(page).toMatch(/PageHeader|SuperAdminContentDirectoryPage|redirect\(|export\s*\{\s*default\s*\}/);
 });
 it("UX-admin-videos-01 preserves shared UX and scoped route behavior",()=>{
  const page=source("src/app/(authenticated)/admin/videos/page.tsx");
  expect(page).toMatch(/export default|export\s*\{\s*default\s*\}/);
  expect(page.length).toBeGreaterThan(90);
  expect(page).toMatch(/PageHeader|SuperAdminContentDirectoryPage|redirect\(|export\s*\{\s*default\s*\}/);
 });
});
