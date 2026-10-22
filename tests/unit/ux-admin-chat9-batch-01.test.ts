import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
import {join} from "node:path";
const source=(path:string)=>readFileSync(join(process.cwd(),path),"utf8");
describe("chat-9 last-third admin UX rollout, batch 01",()=>{
 it("UX-admin-placements-shortlisted-01 preserves authorized route and accessible UX surface",()=>{
  const page=source("src/app/(authenticated)/admin/placements/shortlisted/page.tsx");
  expect(page).toMatch(/export default|export\s*\{\s*default\s*\}/);
  expect(page.length).toBeGreaterThan(90);
  expect(page).toMatch(/PageHeader|redirect\(|<AdminScopedReadPage|<SuperAdminPlacementDetailView|<AdminProjectSectionPage|<ProjectWorkspaceReadiness/);
 });
 it("UX-admin-placements-shortlisted-application-id-01 preserves authorized route and accessible UX surface",()=>{
  const page=source("src/app/(authenticated)/admin/placements/shortlisted/[applicationId]/page.tsx");
  expect(page).toMatch(/export default|export\s*\{\s*default\s*\}/);
  expect(page.length).toBeGreaterThan(90);
  expect(page).toMatch(/PageHeader|redirect\(|<AdminScopedReadPage|<SuperAdminPlacementDetailView|<AdminProjectSectionPage|<ProjectWorkspaceReadiness/);
 });
 it("UX-admin-placements-student-lookup-01 preserves authorized route and accessible UX surface",()=>{
  const page=source("src/app/(authenticated)/admin/placements/student-lookup/page.tsx");
  expect(page).toMatch(/export default|export\s*\{\s*default\s*\}/);
  expect(page).not.toContain("text-[#26bac7]");
  expect(page).not.toContain("min-h-10");
  expect(page).toContain("<DataTable");
  expect(page).toContain("disabled={!ctx.adminScope?.collegeId}");
  expect(page).toContain("placement-student-scope-hint");
  expect(page).toContain('role="search"');
  expect(page).toContain('empty={<p className="text-sm text-body">No applications found.</p>}');
 });
 it("UX-admin-programs-01 preserves authorized route and accessible UX surface",()=>{
  const page=source("src/app/(authenticated)/admin/programs/page.tsx");
  expect(page).toMatch(/export default|export\s*\{\s*default\s*\}/);
  expect(page).not.toContain("text-[#26bac7]");
  expect(page).not.toContain("min-h-10");
  expect(page).toMatch(/PageHeader|EmptyState|ErrorState|<ProjectAdminAtRiskPage|<ProjectAdminAuditPage/);
 });
 it("UX-admin-projects-01 preserves authorized route and accessible UX surface",()=>{
  const page=source("src/app/(authenticated)/admin/projects/page.tsx");
  expect(page).toMatch(/export default|export\s*\{\s*default\s*\}/);
  expect(page).not.toContain("text-[#26bac7]");
  expect(page).not.toContain("min-h-10");
  expect(page).toMatch(/PageHeader|EmptyState|ErrorState|<ProjectAdminAtRiskPage|<ProjectAdminAuditPage/);
 });
 it("UX-admin-projects-project-id-01 preserves authorized route and accessible UX surface",()=>{
  const page=source("src/app/(authenticated)/admin/projects/[projectId]/page.tsx");
  expect(page).toMatch(/export default|export\s*\{\s*default\s*\}/);
  expect(page.length).toBeGreaterThan(90);
  expect(page).toMatch(/PageHeader|redirect\(|<AdminScopedReadPage|<SuperAdminPlacementDetailView|<AdminProjectSectionPage|<ProjectWorkspaceReadiness/);
 });
 it("UX-admin-projects-project-id-section-01 preserves authorized route and accessible UX surface",()=>{
  const page=source("src/app/(authenticated)/admin/projects/[projectId]/[section]/page.tsx");
  expect(page).toMatch(/export default|export\s*\{\s*default\s*\}/);
  expect(page.length).toBeGreaterThan(90);
  expect(page).toMatch(/PageHeader|redirect\(|<AdminScopedReadPage|<SuperAdminPlacementDetailView|<AdminProjectSectionPage|<ProjectWorkspaceReadiness/);
 });
 it("UX-admin-projects-project-id-readiness-01 preserves authorized route and accessible UX surface",()=>{
  const page=source("src/app/(authenticated)/admin/projects/[projectId]/readiness/page.tsx");
  expect(page).toMatch(/export default|export\s*\{\s*default\s*\}/);
  expect(page.length).toBeGreaterThan(90);
  expect(page).toMatch(/PageHeader|redirect\(|<AdminScopedReadPage|<SuperAdminPlacementDetailView|<AdminProjectSectionPage|<ProjectWorkspaceReadiness/);
 });
 it("UX-admin-projects-at-risk-01 preserves authorized route and accessible UX surface",()=>{
  const page=source("src/app/(authenticated)/admin/projects/at-risk/page.tsx");
  expect(page).toMatch(/export default|export\s*\{\s*default\s*\}/);
  expect(page).not.toContain("text-[#26bac7]");
  expect(page).not.toContain("min-h-10");
  expect(page).toMatch(/PageHeader|EmptyState|ErrorState|<ProjectAdminAtRiskPage|<ProjectAdminAuditPage/);
 });
 it("UX-admin-projects-audit-01 preserves authorized route and accessible UX surface",()=>{
  const page=source("src/app/(authenticated)/admin/projects/audit/page.tsx");
  expect(page).toMatch(/export default|export\s*\{\s*default\s*\}/);
  expect(page).not.toContain("text-[#26bac7]");
  expect(page).not.toContain("min-h-10");
  expect(page).toMatch(/PageHeader|EmptyState|ErrorState|<ProjectAdminAtRiskPage|<ProjectAdminAuditPage/);
 });
});
