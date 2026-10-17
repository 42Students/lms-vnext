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
 }); it("SA-placements-projects-53 preserves its implemented foundation while legacy parity remains open",()=>{
  const s=source("src/components/projects/project-admin-workspace-list.tsx");
  expect(s).toContain("view===\"table\"");
  expect(s).toContain("role=\"progressbar\"");
  expect(s).toContain("Members");
 });
 it("SA-placements-projects-55 preserves its implemented foundation while legacy parity remains open",()=>{
  const s=source("src/components/projects/project-admin-collection-controls.tsx");
  expect(s).toContain("{[10, 20, 25, 50, 100]");
  expect(s).toContain("name=\"pageSize\"");
  expect(s).toContain("query.q");
 });
 it("SA-placements-projects-58 preserves its implemented foundation while legacy parity remains open",()=>{
  const s=source("src/components/projects/project-admin-at-risk-page.tsx");
  expect(s).toContain("Reassign mentor");
  expect(s).toContain("fromMentorId");
 });
 it("SA-placements-projects-65 preserves its implemented foundation while legacy parity remains open",()=>{
  const s=source("src/components/projects/project-workspace-readiness.tsx");
  expect(s).toContain("Current readiness");
  expect(s).toContain("Submission status");
  expect(s).toContain("role=\"progressbar\"");
 });
 it("SA-placements-projects-66 preserves its implemented foundation while legacy parity remains open",()=>{
  const s=source("src/components/projects/project-admin-readiness-page.tsx");
  expect(s).toContain("Select workspace");
  expect(s).toContain("Releases");
  expect(s).toContain("Target date");
 });
 it("SA-placements-projects-71 preserves its implemented foundation while legacy parity remains open",()=>{
  const s=source("src/components/projects/project-admin-submissions-page.tsx");
  expect(s).toContain("Revisions");
  expect(s).toContain("Reviewed by");
 });
 it("SA-placements-projects-75 preserves its implemented foundation while legacy parity remains open",()=>{
  const s=source("src/components/projects/project-admin-audit-page.tsx");
  expect(s).toContain("People who made changes");
  expect(s).toContain("Destructive actions");
 });
 it("SA-placements-projects-81 preserves its implemented foundation while legacy parity remains open",()=>{
  const s=source("src/components/projects/super-admin-template-create-form.tsx");
  expect(s).toContain("Deliverables");
  expect(s).toContain("Definition of done");
  expect(s).toContain("Personas");
 });
 it("SA-placements-projects-82 preserves its implemented foundation while legacy parity remains open",()=>{
  const s=source("src/components/projects/super-admin-template-overview-editor.tsx");
  expect(s).toContain("Course label");
  expect(s).toContain("Phase");
  expect(s).toContain("Submission instructions");
 });
 it("SA-placements-projects-86 preserves its implemented foundation while legacy parity remains open",()=>{
  const s=source("src/components/projects/project-template-controls.tsx");
  expect(s).toContain("Duplicate");
  expect(s).toContain("templateId");
 });
 it("SA-placements-projects-88 preserves its implemented foundation while legacy parity remains open",()=>{
  const s=source("src/components/projects/super-admin-template-rollback-control.tsx");
  expect(s).toContain("Roll back");
  expect(s).toContain("expectedTemplateVersion");
 });
 it("SA-placements-projects-89 preserves its implemented foundation while legacy parity remains open",()=>{
  const s=source("src/components/projects/college-project-summary-editor-full.tsx");
  expect(s).toContain("Sprint length (weeks)");
  expect(s).toContain("Blocker");
  expect(s).toContain("Next action");
 });

 it("SA-placements-projects-55 uses the legacy workspaces search URL key, size 20 and page sizes",()=>{
  const page=source("src/app/(authenticated)/admin/projects/page.tsx");
  const controls=source("src/components/projects/project-admin-collection-controls.tsx");
  expect(page).toContain("one(params.search) ?? one(params.q)");
  expect(page).toContain("one(params.pageSize) ?? 20");
  expect(page).toContain("<ProjectAdminFilters query={query} legacyWorkspaces />");
  expect(controls).toContain('legacyWorkspaces ? "search" : "q"');
  expect(controls).toContain("!legacyWorkspaces || size !== 25");
  expect(controls).toContain('basePath === "/admin/projects" ? "search" : "q"');
 });
 it("SA-placements-projects-58 shows average-based mentor overload, not a fixed cap",async()=>{
  const {isProjectMentorOverloaded,projectMentorWorkloadAverage}=await import("@/modules/projects/mentor-overload-model");
  expect(projectMentorWorkloadAverage([2,4,8])).toBeCloseTo(14/3);
  expect(isProjectMentorOverloaded(8,[2,4,8])).toBe(true);
  expect(isProjectMentorOverloaded(7,[2,4,8])).toBe(false);
  expect(isProjectMentorOverloaded(8,[8,8,8])).toBe(false);
  expect(isProjectMentorOverloaded(0,[])).toBe(false);
  const page=source("src/components/projects/project-admin-reassign-mentor-page.tsx");
  expect(page).toContain("isProjectMentorOverloaded(row.activeWorkspaces, mentorCounts)");
  expect(page).toContain("Filter by current mentor");
  expect(page).toContain("Move multiple active workspaces to a new mentor at once.");
 });
 it("SA-placements-projects-67 confirms readiness safely and retains failed drafts",()=>{
  const form=source("src/components/projects/project-readiness-override-form.tsx");
  const page=source("src/components/projects/project-admin-readiness-page.tsx");
  expect(form).toContain("<ConfirmDialog");
  expect(form).toContain('confirmLabel="Apply override"');
  expect(form).toContain("await apiFetch(");
  expect(form).toContain("if (pendingRef.current) return");
  expect(form).toContain('if (nextState !== state) setNote("")');
  expect(form).toContain("Force Unlock/Block will have no effect here");
  expect(form).not.toContain("window.confirm");
  expect(page).toContain("one(searchParams.projectId) ?? one(searchParams.workspaceId)");
 });
 it("SA-placements-projects-68 keeps readiness within all ten workspace sections",()=>{
  const view=source("src/components/projects/project-workspace-readiness.tsx");
  const route=source("src/app/(authenticated)/admin/projects/[projectId]/readiness/page.tsx");
  for(const section of ["summary","overview","team","sprints","tasks","resources","meetings","readiness","delivery","audit"])
   expect(view).toContain('["'+section+'","');
  expect(view).toContain('aria-label="Workspace sections"');
  expect(view).toContain('aria-current={segment==="readiness"?"page":undefined}');
  expect(route).toContain("<ProjectWorkspaceReadiness");
 });
 it("SA-placements-projects-92 preserves origin, reason, breadcrumb and admin shortcut URLs",()=>{
  const route=source("src/app/(authenticated)/admin/projects/[projectId]/[section]/page.tsx");
  const page=source("src/components/projects/admin-project-section-page.tsx");
  const workspace=source("src/components/projects/project-workspace.tsx");
  expect(route).toContain("from={one(query.from)}");
  expect(route).toContain("reason={one(query.reason)}");
  expect(page).toContain('from === "at-risk" || from === "submissions"');
  expect(page).toContain("sectionQuerySuffix={sectionQuerySuffix}");
  expect(workspace).toContain('aria-label="Workspace breadcrumb"');
  expect(workspace).toContain("section + sectionQuerySuffix");
  expect(workspace).toContain("Opened from At-risk projects");
  expect(workspace).toContain("Manage override");
  expect(workspace).toContain("View full project audit");
 });


 it("SA-placements-projects-65 records the readiness override author",()=>{
  const service=source("src/modules/projects/readiness-override-service.ts");
  const display=source("src/components/projects/project-workspace-readiness.tsx");
  expect(service).toContain("overriddenBy:users.displayName");
  expect(service).toContain("leftJoin(users,eq(users.id,activityEvents.actorUserId))");
  expect(display).toContain("Overridden by {readiness.readinessOverride.overriddenBy}");
 });
 it("SA-placements-projects-66 protects scoped readiness links and shows 25-row picker",()=>{
  const picker=source("src/components/projects/admin-readiness-workspace-picker.tsx");
  const list=source("src/components/projects/project-admin-readiness-page.tsx");
  expect(picker).toContain("pageSize=25");
  expect(picker).toContain("Search workspace title or ID");
  expect(list).toContain("outsideScope=Boolean(chosenId&&!selected)");
  expect(list).toContain("This workspace belongs to a different college — switch colleges in the header and try again.");
  expect(list).toContain("Target date");
 });
 it("SA-placements-projects-71 offers guarded page CSV export and review evidence fields",()=>{
  const exportFile=source("src/components/projects/project-submissions-page-export.tsx");
  const page=source("src/components/projects/project-admin-submissions-page.tsx");
  expect(exportFile).toContain("project-submissions-page.csv");
  expect(exportFile).toContain('function csvField(');
  expect(exportFile).toContain("Pending (days)");
  expect(page).toContain("<ProjectSubmissionsPageExport");
  expect(page).toContain("Reviewed by");
  expect(page).toContain("Revisions");
  expect(page).toContain("Reassign mentor");
 });
 it("SA-placements-projects-75 retains audit filters and global log navigation",()=>{
  const page=source("src/components/projects/project-admin-audit-page.tsx");
  expect(page).toContain("People who made changes");
  expect(page).toContain("Destructive actions");
  expect(page).toContain("View activity log");
  expect(page).toContain("Refresh");
  expect(page).toContain("<ActivityCenter");
 });


 it("SA-placements-projects-56 keeps cohort creation preflight, skip logic and partial-failure outcome",()=>{
  const src=source("src/components/projects/class-team-workspace-creator.tsx");
  expect(src).toContain("cohort-preflight");
  expect(src).toContain("Before creating: one workspace per student");
  expect(src).toContain("Already covered learners are skipped.");
  expect(src).toContain("Latest cohort creation outcome");
  expect(src).toContain("No workspaces were created — the selected class may have no active learners.");
  expect(src).toContain("student(s) failed. Review or export the report below before retrying.");
  expect(src).toContain("Export outcome CSV");
 });
 it("SA-placements-projects-57 restores creator mode wording and split-team help",()=>{
  const src=source("src/components/projects/class-team-workspace-creator.tsx");
  const route=source("src/app/(authenticated)/admin/projects/workspaces/new/page.tsx");
  for(const label of ["One team","Split a class into teams","One workspace per student",
    "Pick a class and a team size, preview the teams, move anyone between teams"])
   expect(src).toContain(label);
  expect(route).toContain('title="Create project workspace"');
  expect(route).toContain("Every workspace starts from a template — pick one below.");
 });

});
