import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {mentorOverviewEditSchema} from "@/modules/projects/mentor-overview-edit-model";
import {mentorTaskQuickActionLabel} from "@/modules/projects/mentor-task-quick-action-copy";
const read=(path:string)=>readFileSync(new URL("../../"+path,import.meta.url),"utf8");
const version="2099-01-01T10:00:00.000Z";
describe("chat-12 final sprint mentor projects",()=>{
 it("MEN-projects-meetings-20 exposes Edit details on the authorized mentor About tab",()=>{
  const workspace=read("src/components/projects/project-workspace.tsx");
  expect(workspace).toContain('mode==="MENTOR"&&!readOnly?<MentorProjectAboutEditor project={workspace.project}');
  expect(workspace).toContain('(mode==="ADMIN"||mode==="MENTOR")&&!readOnly?<WorkspaceBriefEditor');
  const editor=read("src/components/projects/mentor-project-about-editor.tsx");
  expect(editor).toContain("Edit details");
  expect(editor).toContain("Edit about this project");
 });
 it("MEN-projects-meetings-20 preserves authored deliverables behind the mentor mutation guard",()=>{
  const scope=read("src/modules/projects/workspace-brief-service.ts");
  expect(scope).toContain("requireProjectLifecycleMutationAccess(context,projectIdInput)");
  expect(scope).toContain("...original,...input.brief");
  expect(scope).toContain("authoredBrief:mergedBrief");
  expect(scope).toContain("PROJECT_SUBMISSION_CONFLICT");
 });
 it("MEN-projects-meetings-20 accepts bounded fields with an optimistic version",()=>{
  const body={summary:"Project objective",dueLabel:"December",blocker:null,nextAction:"Start board",expectedUpdatedAt:version};
  expect(mentorOverviewEditSchema.safeParse(body).success).toBe(true);
  expect(mentorOverviewEditSchema.safeParse({...body,blocker:"X".repeat(4001)}).success).toBe(false);
  expect(mentorOverviewEditSchema.safeParse({...body,expectedUpdatedAt:"stale"}).success).toBe(false);
  expect(mentorOverviewEditSchema.safeParse({...body,status:"COMPLETED"}).success).toBe(false);
 });
 it("MEN-projects-meetings-20 fails closed for unscoped actors and stale updates",()=>{
  const source=read("src/modules/projects/mentor-overview-edit-service.ts");
  expect(source).toContain("requireProjectLifecycleMutationAccess(context,projectId)");
  expect(source).toContain("eq(projectInstances.collegeId,scope.collegeId)");
  expect(source).toContain("current.updatedAt.getTime()!==Date.parse(input.expectedUpdatedAt)");
  expect(source).toContain('current.status==="ARCHIVED"||current.status==="COMPLETED"');
 });
 it("MEN-projects-meetings-20 records a transactional event and notifies the active learner team",()=>{
  const source=read("src/modules/projects/mentor-overview-edit-service.ts");
  expect(source).toContain("getDb().transaction(async tx=>");
  expect(source).toContain("recordActivityEventInTransaction(tx,context");
  expect(source).toContain("notifyActiveProjectMembers(tx,event.id");
 });
 it("MEN-projects-meetings-20 requires same-origin mutations",()=>{
  const route=read("src/app/api/projects/[projectId]/mentor-overview/route.ts");
  expect(route).toContain("isSameOriginRequest(request)");
  expect(route).toContain("updateMentorProjectOverview");
 });
 it("MEN-projects-meetings-48 uses the mentor's familiar quick-action wording",()=>{
  expect(mentorTaskQuickActionLabel("IN_PROGRESS")).toBe("Move to in progress");
  expect(mentorTaskQuickActionLabel("BLOCKED")).toBe("Flag as blocked");
  expect(mentorTaskQuickActionLabel("IN_REVIEW")).toBe("Move to review");
  expect(mentorTaskQuickActionLabel("DONE")).toBe("Mark complete");
 });
 it("MEN-projects-meetings-48 gives the exact success toast while preserving the confirmation and blocker reason",()=>{
  const code=read("src/components/projects/mentor-task-status-transition.tsx");
  expect(code).toContain('title:"Task updated."');
  expect(code).toContain('mentorTaskQuickActionLabel(selected)');
  expect(code).toContain("What's blocking this task?");
  expect(code).toContain("<ConfirmDialog");
 });
 it("MEN-projects-meetings-48 does not change successful task creation copy",()=>{
  expect(read("src/components/projects/mentor-task-create.tsx")).toContain('title:"Task added."');
 });
});
