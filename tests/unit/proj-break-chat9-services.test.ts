import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {join} from "node:path";
import {adminUnsubmittedQuerySchema} from "@/modules/projects/admin-unsubmitted-query-model";
const source=(path:string)=>readFileSync(join(process.cwd(),path),"utf8");
const moduleSource=(name:string)=>source("src/modules/projects/"+name+".ts");
const api=(route:string)=>source("src/app/api/projects/"+route+"/route.ts");

describe("IIT Dharwad Projects adversarial service and route contracts",()=>{
 it("PROJ-BREAK-idor-11 prevents guessed project UUIDs from bypassing college and membership scoping",()=>{
  const access=moduleSource("access");
  expect(access).toContain("loadProjectCollegeScope(project.collegeId)");
  expect(access).toContain('can(context, "projects.manage"');
  expect(access).toContain("membership.collegeId !== scope.collegeId");
  expect(access).toContain("isNull(projectMembers.endedAt)");
  expect(access).toContain('eq(users.platformStatus,"ACTIVE")');
 });
 it("PROJ-BREAK-idor-12 cannot attach a removed or academically inactive learner to a project",()=>{
  const page=moduleSource("instance-service");
  expect(page).toContain('eq(learnerProgramEnrollments.status,"ACTIVE")');
  expect(page).toContain('eq(sectionEnrollments.status,"ACTIVE")');
  expect(page).toContain('eq(collegeMemberships.status,"ACTIVE")');
  expect(page).toContain("new Set(members.map(row=>row.id)).size!==input.learnerMembershipIds.length");
 });
 it("PROJ-BREAK-idor-13 bulk class-team creation fails closed for cross-college roles and spoofed rosters",()=>{
  const page=moduleSource("class-team-workspace-service");
  expect(page).toContain("requireTeamCreationAuthority(context, input.collegeId)");
  expect(page).toContain("eq(departments.collegeId,scope.id)");
  expect(page).toContain('eq(learnerProgramEnrollments.status,"ACTIVE")');
  expect(page).toContain("verifyClassTeamPreview(input.teams,members.map");
  expect(page).toContain('isolationLevel:"serializable"');
 });
 it("PROJ-BREAK-races-04 admin status edits serialize stale tabs before changing any child rows",()=>{
  const page=moduleSource("college-project-summary-service");
  expect(page).toContain('for("update")');
  expect(page).toContain("row.updatedAt.getTime()!==Date.parse(input.expectedUpdatedAt)");
  expect(page).toContain("if(collegeProjectSummaryMatchesCurrent(row,input))return row");
  expect(page.indexOf("collegeProjectSummaryMatchesCurrent(row,input)")).toBeGreaterThan(page.indexOf('for("update")'));
  expect(page).toContain("PROJECT_SUBMISSION_CONFLICT");
  expect(page).toContain("recordActivityEventInTransaction(tx,context");
 });
 it("PROJ-BREAK-races-05 version publish serializes concurrent archives and reassigns atomically",()=>{
  const page=moduleSource("template-service");
  expect(page).toContain('for("update")');
  expect(page).toContain("getDb()");
  expect(page).toMatch(/await\s+tx\s*\.update\(\s*projectTemplateCollegeAssignments/);
  expect(page).toContain("eq(projectTemplates.currentVersion, input.expectedVersion)");
  expect(page).toContain("PROJECT_TEMPLATE_STALE_VERSION");
 });
 it("PROJ-BREAK-archive-01 archived projects never enter active override counts or result exports",()=>{
  const page=moduleSource("admin-readiness-overrides-service");
  expect(page).toContain('ne(projectInstances.status, "ARCHIVED")');
  const exportRoute=api("readiness-overrides/export");
  expect(exportRoute).toContain("listCollegeActiveReadinessOverrides");
  expect(exportRoute).toContain("projectReadinessOverrideCsvCell");
 });
 it("PROJ-BREAK-archive-02 archived project IDs cannot be selected for readiness releases",()=>{
  const page=moduleSource("college-readiness-releases-service");
  expect(page.match(/ne\(projectInstances.status,"ARCHIVED"\)/g)?.length).toBe(2);
  expect(page).toContain("eq(projectInstances.collegeId,college.id)");
  expect(page).toContain("requirePermission(context");
 });
 it("PROJ-BREAK-archive-03 archived workspaces cannot masquerade as unsubmitted active projects",()=>{
  const page=moduleSource("admin-unsubmitted-service");
  expect(page).toContain('ne(projectInstances.status,"ARCHIVED")');
  expect(page).toContain("notExists(");
  expect(page).toContain('q.pageSize');
  expect(page).toContain("requirePermission(context");
 });
 it("PROJ-BREAK-files-01 in-flight upload cannot finalize on a newly archived project",()=>{
  const page=moduleSource("project-resource-file-service");
  const start=page.indexOf("export async function completeProjectFileUpload");
  const end=page.indexOf("export async function listProjectFiles",start);
  const segment=page.slice(start,end);
  expect(segment).toContain("requireOpenProject(scope.project.status)");
  expect(segment).toContain('for("share")');
  expect(segment).toContain("requireOpenProject(liveProject.status)");
  expect(segment).toContain('row.status === "READY"');
 });
 it("PROJ-BREAK-files-02 metadata edit and file removal lock parent project so archive race cannot cross",()=>{
  const page=moduleSource("project-resource-file-service");
  for(const [start,end]of [["updateProjectFileDetails","removeProjectFile"],["removeProjectFile","issueProjectFileDownloadGrant"]]){
   const part=page.slice(page.indexOf("export async function "+start),page.indexOf("export async function "+end));
   expect(part).toContain('for("share")');
   expect(part).toContain("requireOpenProject(liveProject.status)");
   expect(part).toContain("recordStorageFileEvent(tx, context");
  }
 });
 it("PROJ-BREAK-files-03 download grant requires project read permission and rejects mentor-only leaked UUID",()=>{
  const page=moduleSource("project-resource-file-service");
  const part=page.slice(page.indexOf("export async function issueProjectFileDownloadGrant"));
  expect(part).toContain("requireProjectReadAccess(context, projectIdInput)");
  expect(part).toContain('linked.visibility!=="TEAM"');
  expect(part).toContain('row.status !== "READY"');
  expect(part).toContain("FILE_READ_TTL_SECONDS");
 });
 it("PROJ-BREAK-files-04 file quota and content verification are enforced server-side, not browser-only",()=>{
  const page=moduleSource("project-resource-file-service");
  expect(page).toContain('validateStorageDeclaration("project-resource", input)');
  expect(page).toContain("MAX_PROJECT_FILES_PER_PROJECT");
  expect(page).toContain("pg_advisory_xact_lock");
  expect(page).toContain("verifyUploadedObject");
  expect(page).toContain('plan.status === "QUARANTINED"');
 });
 it("PROJ-BREAK-grading-01 only an approved submission can receive one audited rubric evaluation",()=>{
  const page=moduleSource("evaluation-service");
  expect(page).toContain('submission.status !== "APPROVED"');
  expect(page).toContain("PROJECT_EVALUATION_INVALID_STATE");
  expect(page).toContain('for("update")');
  expect(page).toContain("recordActivityEventInTransaction");
  const schema=source("src/db/schema/projects.ts");
  expect(schema).toContain("project_evaluations_submission_uq");
  expect(schema).toContain("project_evaluations_score_ck");
  expect(schema).toContain("project_evaluation_items_score_ck");
 });
 it("PROJ-BREAK-notifications-01 recipient selection rejects cross-tenant or inactive memberships and dedupes",()=>{
  const page=moduleSource("project-notification-service");
  expect(page).toContain("eq(collegeMemberships.collegeId, notice.collegeId)");
  expect(page).toContain('eq(collegeMemberships.status, "ACTIVE")');
  expect(page).toContain('eq(users.platformStatus, "ACTIVE")');
  expect(page).toContain("new Set(rows.map(row => row.userId))");
  expect(page).toContain("id !== notice.exceptUserId");
 });
 it("PROJ-BREAK-exports-05 all admin override export cells share safe quoting and private cache policy",()=>{
  const route=api("readiness-overrides/export");
  expect(route).toContain("projectReadinessOverrideCsvCell");
  expect(route).toContain('cache-control": "private, no-store"');
  expect(route).toContain('content-type": "text/csv; charset=utf-8"');
 });
 it("PROJ-BREAK-restore-01 restore requires stale-token CAS, surviving mentor and immutable audit",()=>{
  const page=moduleSource("instance-restore-service");
  expect(page).toContain('project.status!=="ARCHIVED"');
  expect(page).toContain("project.updatedAt.getTime()!==Date.parse(input.expectedUpdatedAt)");
  expect(page).toContain("eq(collegeMemberships.collegeId,scope.collegeId)");
  expect(page).toContain("date_trunc('milliseconds'");
  expect(page).toContain("recordActivityEventInTransaction(tx,context");
 });
 it("PROJ-BREAK-routing-01 all sampled project write routes reject foreign origins before reading the body",()=>{
  const routes=["class-team-workspaces","templates/[templateId]/publish","[projectId]/readiness/override",
   "[projectId]/submissions/[submissionId]/evaluation","[projectId]/resource-files/[fileId]/download-grant"];
  for(const route of routes){
   const page=api(route);
   expect(page).toContain("isSameOriginRequest(request)");
   expect(page).toMatch(/status:\s*403/);
   // Some routes also export GET, which can read context before POST.
   // Check the mutation handler itself, never compare unrelated GET code.
   const mutation=page.slice(page.indexOf("export async function POST"));
   expect(mutation.indexOf("isSameOriginRequest(request)")).toBeGreaterThanOrEqual(0);
   expect(mutation.indexOf("isSameOriginRequest(request)")).toBeLessThan(mutation.indexOf("getCurrentRequestContext()"));
   expect(page).toContain("apiErrorResponse(error)");
  }
 });
 it("PROJ-BREAK-performance-01 admin pages bound list size and publish authoring has size caps",()=>{
  const page=moduleSource("admin-unsubmitted-service");
  // Size validation moved into a shared strict query model. Assert the
  // service parses that model *before* invoking any DB access, then exercise
  // the actual accepted and rejected limits.
  expect(page).toContain("adminUnsubmittedQuerySchema.parse(raw)");
  expect(page).toContain(".limit(q.pageSize)");
  expect(adminUnsubmittedQuerySchema.safeParse({page:1,pageSize:100}).success).toBe(true);
  expect(adminUnsubmittedQuerySchema.safeParse({page:1,pageSize:101}).success).toBe(false);
  const blueprint=moduleSource("validation");
  for(const bound of [".max(50)",".max(200)",".max(2000)"])expect(blueprint).toContain(bound);
 });
 it("PROJ-BREAK-ux-01 admin and college Project screens preserve explicit empty/denied UX, no raw crash",()=>{
  const projectPage=source("src/app/(authenticated)/admin/projects/page.tsx");
  const collegePage=source("src/app/(authenticated)/college/projects/page.tsx");
  expect(projectPage).toContain("<EmptyState");
  expect(collegePage).toContain("Select a college to continue.");
  expect(collegePage).toContain('role="alert"');
  expect(collegePage).toContain('href="/dashboard"');
  expect(projectPage).toContain("<PageHeader");
  expect(collegePage).toContain('title="Workspaces"');
 });
 it("PROJ-BREAK-resilience-01 object-store cleanup failure cannot reverse committed soft deletion or quarantine",()=>{
  const page=moduleSource("project-resource-file-service");
  const remove=page.slice(page.indexOf("export async function removeProjectFile"),page.indexOf("export async function issueProjectFileDownloadGrant"));
  expect(remove).toContain('"DELETED"');
  expect(remove).toContain("recordStorageFileEvent(tx, context");
  expect(remove).toContain("try { await removeStoredObject(row.objectKey); }");
  expect(remove).toContain("if (!updated.changed) return toProjectFileDto(updated.row)");
  expect(remove).toContain("return toProjectFileDto(updated.row)");
  expect(remove).toContain("ne(projectResourceFiles.status, \"DELETED\")");
  const complete=page.slice(page.indexOf("export async function completeProjectFileUpload"),page.indexOf("export async function listProjectFiles"));
  expect(complete).toContain('plan.status === "QUARANTINED"');
  expect(complete).toContain("catch { /* Unreadable DB state is authoritative");
 });

 it("PROJ-BREAK-races-07 concurrent cohort creates retry serializable conflicts with a bounded loop and fresh coverage checks",()=>{
  const page=moduleSource("class-team-workspace-service");
  expect(page).toContain("for (let attempt = 0; attempt < 3; attempt += 1)");
  expect(page).toContain('isolationLevel:"serializable"');
  expect(page).toContain("isRetryableProjectTransactionError(error)");
  expect(page).toContain("if(attempt < 2) continue");
  expect(page).toContain('throw new ProjectsServiceError("PROJECT_CLASS_ROSTER_STALE")');
  expect(page).toContain("const covered=input.cohortMode?");
  expect(page).toContain("dedupeKey:\"project:\"+project.id+\":created\"");
 });

});
