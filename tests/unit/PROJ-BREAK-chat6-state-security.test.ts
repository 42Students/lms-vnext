import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
import {allowedMentorTaskTransition,mentorTaskTransitionSchema} from "@/modules/projects/mentor-task-transition-model";
import {projectSubmissionAllowsNewDraft} from "@/modules/projects/submission-draft-policy";
import {mentorFinalDeliveryCanReview,mentorFinalDeliveryDecisionSchema} from "@/modules/projects/mentor-final-delivery-decision-model";
import {mentorTaskReviewTokenMatches} from "@/modules/projects/mentor-task-review-token-model";
import {transitionResourceUploadUi,initialResourceUploadUi} from "@/modules/projects/resource-file-upload-state";
import {isFutureProjectMeetingWindow} from "@/modules/projects/meeting-window-policy";
import {mayRemovePrimaryProjectMentor} from "@/modules/projects/primary-mentor-policy";
import {projectCompletionPercent} from "@/modules/projects/progress-percentage-policy";
import {restoredProjectStatus} from "@/modules/projects/instance-restore-model";
import {resourceFileUiAllowed,type ResourceFileUiScope} from "@/modules/projects/resource-file-permission-model";

const src=(path:string)=>readFileSync(path,"utf8");
const uuid="11111111-1111-4111-8111-111111111111";
describe("IIT Dharwad Projects breaker — state, access, integrity, deadlines and files",()=>{
 it("PROJ-BREAK-state-01 rejects forbidden task state jumps, self-transitions and unconfirmed clients",()=>{
  for(const before of ["TODO","IN_PROGRESS","BLOCKED"]){
   for(const after of ["DONE","IN_REVIEW","ARCHIVED","BOGUS",before])
    expect(allowedMentorTaskTransition(before,after)).toBe(false);
  }
  expect(allowedMentorTaskTransition("TODO","BLOCKED")).toBe(true);
  const base={status:"IN_PROGRESS",expectedUpdatedAt:"2026-10-18T13:00:00+05:30",confirmed:true};
  expect(mentorTaskTransitionSchema.safeParse({...base,status:"DONE"}).success).toBe(false);
  expect(mentorTaskTransitionSchema.safeParse({...base,confirmed:false}).success).toBe(false);
  expect(mentorTaskTransitionSchema.safeParse({...base,projectId:uuid}).success).toBe(false);
 });
 it("PROJ-BREAK-state-02 approved delivery is terminal and review cannot skip SUBMITTED",()=>{
  expect(projectSubmissionAllowsNewDraft("APPROVED")).toBe(false);
  for(const status of ["DRAFT","CHANGES_REQUESTED","REJECTED","LOCKED"])
   expect(mentorFinalDeliveryCanReview(status,"ACTIVE")).toBe(false);
  expect(mentorFinalDeliveryCanReview("SUBMITTED","ARCHIVED")).toBe(false);
  expect(mentorFinalDeliveryCanReview("SUBMITTED","ACTIVE")).toBe(true);
  expect(mentorFinalDeliveryDecisionSchema.safeParse({decision:"CHANGES_REQUESTED",
   expectedUpdatedAt:"2026-10-18T00:00:00+05:30",confirmed:true}).success).toBe(false);
 });
 it("PROJ-BREAK-race-01 stale review versions never compare by local clock or partial timestamp",()=>{
  const current=new Date("2026-10-18T23:59:59.321+05:30");
  expect(mentorTaskReviewTokenMatches(current,current.toISOString())).toBe(true);
  expect(mentorTaskReviewTokenMatches(current,"2026-10-18T18:29:59.320Z")).toBe(false);
  expect(mentorTaskReviewTokenMatches(current,"not-a-date")).toBe(false);
  const service=src("src/modules/projects/mentor-task-transition-service.ts");
  expect(service).toContain("date_trunc");
  expect(service).toContain("input.expectedUpdatedAt");
 });
 it("PROJ-BREAK-file-01 uploading cannot succeed from transfer progress alone",()=>{
  let state=initialResourceUploadUi;
  state=transitionResourceUploadUi(state,{type:"SELECT"});
  state=transitionResourceUploadUi(state,{type:"START"});
  state=transitionResourceUploadUi(state,{type:"PROGRESS",value:1000});
  expect(state.stage).toBe("UPLOADING");
  expect(state.progress).toBe(99);
  expect(transitionResourceUploadUi(state,{type:"VERIFIED"}).stage).toBe("UPLOADING");
  state=transitionResourceUploadUi(state,{type:"TRANSFER_COMPLETE"});
  expect(state.stage).toBe("VERIFYING");
  expect(transitionResourceUploadUi(state,{type:"VERIFIED"}).stage).toBe("SUCCEEDED");
  expect(transitionResourceUploadUi(state,{type:"FAIL",message:"PRIVATE CODE"})).toEqual({
    stage:"FAILED",progress:0,message:"Upload could not be completed. Retry or choose another file.",
  });
  const succeeded=transitionResourceUploadUi(state,{type:"VERIFIED"});
  expect(transitionResourceUploadUi(succeeded,{type:"FAIL",message:"PRIVATE CODE"})).toEqual(succeeded);
 });
 it("PROJ-BREAK-file-02 stale, cross-college and deactivated resource views cannot download",()=>{
  const good:ResourceFileUiScope={viewer:"MENTOR",projectAccessGranted:true,moduleEnabled:true,
   collegeMatches:true,projectStatus:"ACTIVE",resourceActive:true,storageReady:true,fileVerified:true};
  expect(resourceFileUiAllowed(good,"DOWNLOAD")).toBe(true);
  for(const patch of [{collegeMatches:false},{moduleEnabled:false},{projectAccessGranted:false},
    {resourceActive:false},{fileVerified:false},{viewer:"NONE" as const}])
   expect(resourceFileUiAllowed({...good,...patch},"DOWNLOAD")).toBe(false);
  expect(resourceFileUiAllowed({...good,projectStatus:"ARCHIVED"},"UPLOAD")).toBe(false);
  expect(resourceFileUiAllowed({...good,projectStatus:"COMPLETED"},"DELETE")).toBe(false);
  expect(resourceFileUiAllowed({...good,viewer:"LEARNER"},"UPLOAD")).toBe(false);
 });
 it("PROJ-BREAK-deadline-01 enforces instant boundary at IST 23:59:59",()=>{
  const now=Date.parse("2026-10-18T23:59:59+05:30");
  const before=new Date(now-1),start=new Date(now+1),end=new Date(now+3600000);
  expect(isFutureProjectMeetingWindow(start,end,now)).toBe(true);
  expect(isFutureProjectMeetingWindow(before,end,now)).toBe(false);
  expect(isFutureProjectMeetingWindow(new Date(now),end,now)).toBe(false);
  expect(isFutureProjectMeetingWindow(end,start,now)).toBe(false);
  expect(isFutureProjectMeetingWindow(new Date("invalid"),end,now)).toBe(false);
 });
 it("PROJ-BREAK-mentor-01 prevents primary mentor removal during active delivery",()=>{
  expect(mayRemovePrimaryProjectMentor("ACTIVE","MENTOR",true)).toBe(false);
  expect(mayRemovePrimaryProjectMentor("ACTIVE","MENTOR",false)).toBe(true);
  expect(mayRemovePrimaryProjectMentor("PLANNED","MENTOR",true)).toBe(true);
 });
 it("PROJ-BREAK-grading-01 retains legacy nearest-integer display rounding independently of terminal state",()=>{
  expect(projectCompletionPercent(999,1000)).toBe(100);
  expect(projectCompletionPercent(994,1000)).toBe(99);
  expect(projectCompletionPercent(1000,1000)).toBe(100);
  expect(projectCompletionPercent(-5,100)).toBe(0);
  expect(projectCompletionPercent(10,0)).toBe(null);
  expect(projectCompletionPercent(Number.NaN,10)).toBe(null);
 });
 it("PROJ-BREAK-recovery-01 historical status metadata cannot inject arbitrary restore state",()=>{
  for(const status of ["ARCHIVED","DELETED","SUPERADMIN",true,null,{}])
   expect(restoredProjectStatus(status)).toBe("PLANNED");
  for(const status of ["ACTIVE","COMPLETED"])
   expect(restoredProjectStatus(status)).toBe(status);
 });
 it("PROJ-BREAK-idor-01 service authorization requires persisted project and college membership",()=>{
  const code=src("src/modules/projects/access.ts");
  expect(code).toContain("loadProjectCollegeScope(project.collegeId)");
  expect(code).toContain('eq(collegeMemberships.userId,context.user.id)');
  expect(code).toContain('eq(collegeMemberships.status,"ACTIVE")');
  expect(code).toContain('eq(users.platformStatus,"ACTIVE")');
  expect(code).toContain("isNull(projectMembers.endedAt)");
  expect(code).toContain("resolveOptionalModuleAccess(context)");
 });
 it("PROJ-BREAK-grading-02 evaluation routes never expose unreleased rubric to learners or observers",()=>{
  const code=src("src/modules/projects/evaluation-service.ts");
  expect(code.match(/scope.access !== "ADMIN" && scope.access !== "MENTOR"/g)).toHaveLength(2);
  const api=src("src/app/api/projects/[projectId]/submissions/[submissionId]/evaluation/route.ts");
  expect(api).toContain("isSameOriginRequest(request)");
  expect(api).toContain("getCurrentRequestContext()");
 });
 it("PROJ-BREAK-database-01 unique evaluation and open-submission constraints prevent race duplicates",()=>{
  const schema=src("src/db/schema/projects.ts");
  for(const index of ["project_evaluations_submission_uq","project_submissions_open_project_uq",
    "project_submissions_project_version_uq","project_evaluation_items_evaluation_sequence_uq"])
   expect(schema).toContain(index);
  expect(schema).toContain("project_evaluations_score_ck");
  const service=src("src/modules/projects/evaluation-service.ts");
  expect(service).toContain("db.transaction(async (tx)");
  expect(service).toContain('.for("update")');
 });
 it("PROJ-BREAK-state-03 completed projects cannot edit, submit or review a final delivery",()=>{
  const code=src("src/modules/projects/submission-service.ts");
  const denied=(code.match(/project.status === "ARCHIVED" \|\| project.status === "COMPLETED"/g)??[]).length;
  expect(denied).toBe(4);
  for(const name of ["createProjectSubmissionDraft","updateProjectSubmissionDraft",
    "submitProjectSubmission","reviewProjectSubmission"]){
    const start=code.indexOf("export async function "+name+"(");
    expect(start,name).toBeGreaterThan(-1);
    const next=code.indexOf("export async function ",start+1);
    const body=code.slice(start,next===-1?undefined:next);
    expect(body,name).toContain('project.status === "COMPLETED"');
    expect(body,name).toContain('project.status === "ARCHIVED"');
    expect(body,name).toContain('.for("update")');
  }
 });

 it("PROJ-BREAK-file-04 stale upload completion cannot mutate archived project during verification",()=>{
  const code=src("src/modules/projects/project-resource-file-service.ts");
  const from=code.indexOf("export async function completeProjectFileUpload(");
  const until=code.indexOf("export async function listProjectFiles(",from);
  const complete=code.slice(from,until);
  expect(complete).toContain('if (row.status === "READY") return toProjectFileDto(row)');
  expect(complete).toContain("requireOpenProject(scope.project.status)");
  expect(complete).toContain("requireOpenProject(liveProject.status)");
  expect(complete).toContain('.for("share")');
  const committed=complete.slice(complete.indexOf("const updated = await getDb().transaction"));
  expect(committed.indexOf("requireOpenProject(liveProject.status)")).toBeLessThan(
    committed.indexOf(".update(projectResourceFiles)"));
  const expired=complete.slice(complete.indexOf('if (plan.kind === "WAIT")'),complete.indexOf("const updated = await getDb().transaction"));
  expect(expired).toContain('requireOpenProject(liveProject.status)');
  expect(expired).toContain('eq(projectResourceFiles.projectId,scope.project.id)');
  expect(complete).toContain('inArray(projectResourceFiles.status, ["UPLOADING", "VERIFYING"])');
 });

 it("PROJ-BREAK-file-05 resource edit and deletion recheck archived status under project row lock",()=>{
  const code=src("src/modules/projects/project-resource-file-service.ts");
  for(const name of ["updateProjectFileDetails","removeProjectFile"]){
    const start=code.indexOf("export async function "+name+"(");
    const end=code.indexOf("export async function ",start+1);
    const body=code.slice(start,end<0?undefined:end);
    expect(body,name).toContain("requireOpenProject(scope.project.status)");
    expect(body,name).toContain("requireOpenProject(liveProject.status)");
    expect(body,name).toContain('.for("share")');
    expect(body,name).toContain('eq(projectResourceFiles.projectId,scope.project.id)');
  }
 });

 it("PROJ-BREAK-resilience-02 storage cleanup outage cannot resurrect a soft-deleted file or mark scan failed",()=>{
  const code=src("src/modules/projects/project-resource-file-service.ts");
  const remove=code.slice(code.indexOf("export async function removeProjectFile("),
    code.indexOf("export async function issueProjectFileDownloadGrant("));
  expect(remove).toContain('status: "DELETED"');
  expect(remove).toContain("try { await removeStoredObject(row.objectKey); }");
  expect(remove).toContain("catch {");
  const complete=code.slice(code.indexOf("export async function completeProjectFileUpload("),
    code.indexOf("export async function listProjectFiles("));
  expect(complete).toContain("try { await removeStoredObject(row.objectKey); }");
  expect(complete).toContain("STORAGE_CONTENT_REJECTED");
 });

});
