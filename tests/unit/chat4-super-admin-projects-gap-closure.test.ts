import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {join} from "node:path";

/** Source-contract checks for earlier merged functionality and exact legacy copy.
 * Integration-level permissions, database transitions and parity still require
 * the orchestrator's PostgreSQL acceptance run; these tests do not fake it. */
const source=(path:string)=>readFileSync(join(process.cwd(),path),"utf8");

describe("chat-4 Super Admin Projects verified gap coverage",()=>{
 it("SA-placements-projects-51 accepted archive-and-restore design",()=>{
  const file=source("src/components/projects/project-archive-control.tsx");
  expect(file).toContain("Restore this workspace?");
  expect(file).toContain("Archive project?");
 });
 it("SA-placements-projects-52 retains the verified Projects behavior",()=>{
  const file=source("src/app/(authenticated)/admin/projects/page.tsx");
  expect(file).toContain("Project workspaces");
  expect(file).toContain("Live projects, each run by a mentor with a team of students.");
  expect(file).toContain("Bulk reassign mentor");
 });
 it("SA-placements-projects-54 retains the verified Projects behavior",()=>{
  const file=source("src/app/(authenticated)/admin/projects/page.tsx");
  expect(file).toContain("ProjectWorkspacePageExport");
 });
 it("SA-placements-projects-59 retains the verified Projects behavior",()=>{
  const file=source("src/components/projects/project-admin-at-risk-page.tsx");
  expect(file).toContain("Active blocker");
  expect(file).toContain("Pending review");
  expect(file).toContain("riskBucket=");
 });
 it("SA-placements-projects-60 retains the verified Projects behavior",()=>{
  const file=source("src/components/projects/project-admin-at-risk-page.tsx");
  expect(file).toContain("project.blockerReason");
  expect(file).toContain("Blocker");
  expect(file).toContain("Severity");
 });
 it("SA-placements-projects-61 retains the verified Projects behavior",()=>{
  const file=source("src/components/projects/project-admin-at-risk-page.tsx");
  expect(file).toContain("includeRiskSort");
  expect(file).toContain("riskReasons.map");
  expect(file).toContain("Inactive");
 });
 it("SA-placements-projects-62 retains the verified Projects behavior",()=>{
  const file=source("src/components/projects/project-admin-at-risk-page.tsx");
  expect(file).toContain("fromMentorId");
  expect(file).toContain("Review submission");
  expect(file).toContain("?from=at-risk");
 });
 it("SA-placements-projects-63 retains the verified Projects behavior",()=>{
  const file=source("src/components/projects/project-admin-at-risk-page.tsx");
  expect(file).toContain("ProjectAtRiskPageExport");
  expect(file).toContain("need attention (stalled, blocked, or waiting for review)");
 });
 it("SA-placements-projects-64 retains the verified Projects behavior",()=>{
  const file=source("src/components/projects/project-admin-readiness-page.tsx");
  expect(file).toContain("Active overrides");
  expect(file).toContain("Export overrides CSV");
  expect(file).toContain("No workspace currently has a manual override");
 });
 it("SA-placements-projects-69 retains the verified Projects behavior",()=>{
  const file=source("src/components/projects/project-admin-submissions-page.tsx");
  expect(file).toContain("NOT_SUBMITTED");
  expect(file).toContain("Pending review");
  expect(file).toContain("Needs student action");
  expect(file).toContain("Reviewed");
 });
 it("SA-placements-projects-70 retains the verified Projects behavior",()=>{
  const file=source("src/components/projects/project-admin-submissions-page.tsx");
  expect(file).toContain("UNDER_REVIEW");
  expect(file).toContain("LOCKED");
  expect(file).toContain("DRAFT_REVISING");
 });
 it("SA-placements-projects-73 retains the verified Projects behavior",()=>{
  const file=source("src/components/projects/project-admin-submissions-page.tsx");
  expect(file).toContain("Submissions dashboard");
  expect(file).toContain("Final project deliverables across all workspaces.");
 });
 it("SA-placements-projects-74 retains the verified Projects behavior",()=>{
  const file=source("src/components/projects/project-admin-audit-page.tsx");
  expect(file).toContain("label:\"Today\"");
  expect(file).toContain("label:\"7 days\"");
  expect(file).toContain("label:\"30 days\"");
  expect(file).toContain("name=\"action\"");
 });
 it("SA-placements-projects-76 retains the verified Projects behavior",()=>{
  const file=source("src/components/projects/project-admin-audit-page.tsx");
  expect(file).toContain("ProjectAuditPageExport");
 });
 it("SA-placements-projects-78 retains the verified Projects behavior",()=>{
  const file=source("src/app/(authenticated)/admin/projects/page.tsx");
  expect(file).toContain("No college selected");
  expect(file).toContain("Pick a college in the header to manage its project workspaces.");
 });
 it("SA-placements-projects-79 retains the verified Projects behavior",()=>{
  const file=source("src/app/(authenticated)/admin/projects/templates/page.tsx");
  expect(file).toContain("Project templates");
  expect(file).toContain("A single catalog every college draws from — college-admin can use these but not edit them.");
 });
 it("SA-placements-projects-80 retains the verified Projects behavior",()=>{
  const file=source("src/app/(authenticated)/admin/projects/templates/page.tsx");
  expect(file).toContain("SuperAdminTemplatePageExport");
  expect(file).toContain("SuperAdminTemplateArchiveControl");
  expect(file).toContain("Template title or slug");
 });
 it("SA-placements-projects-85 retains the verified Projects behavior",()=>{
  const file=source("src/components/projects/super-admin-template-resource-editor.tsx");
  expect(file).toContain("Add resource");
  expect(file).toContain("accessNotes");
  expect(file).toContain("Pinned");
  expect(file).toContain("required");
 });
 it("SA-placements-projects-90 retains the verified Projects behavior",()=>{
  const file=source("src/components/projects/workspace-brief-editor.tsx");
  expect(file).toContain("deliverables");
  expect(file).toContain("completionConditions");
  expect(file).toContain("personas");
  expect(file).toContain("expectedUpdatedAt");
 });
});
