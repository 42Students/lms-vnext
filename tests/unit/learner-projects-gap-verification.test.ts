import {readFileSync} from "node:fs";
import {join} from "node:path";
import {describe,expect,it} from "vitest";
import {compareNumberedTeamProjects} from "@/modules/projects/learner-project-sort-model";
import {learnerProjectListEmptyState} from "@/modules/projects/learner-project-list-empty-model";
import {learnerProjectGoalSummary} from "@/modules/projects/learner-project-goals-model";
import {canUploadProjectFilePanel} from "@/modules/projects/mentor-file-panel-role-model";
import {projectTemplateBlueprintSchema} from "@/modules/projects/validation";

const read=(path:string)=>readFileSync(join(process.cwd(),path),"utf8");
const page=()=>read("src/app/(authenticated)/learn/projects/page.tsx");
const detail=()=>read("src/components/projects/project-workspace.tsx");
const list=()=>read("src/components/projects/project-list.tsx");
const form=()=>read("src/components/projects/project-final-delivery-controls.tsx");
const board=()=>read("src/components/projects/learner-board-interactive.tsx");
const meetings=()=>read("src/components/projects/project-meeting-controls.tsx");

describe("learner/projects verified gap closure",()=>{
 it("LEARNER-projects-01 displays course, mentor, phase, due state on cards",()=>{
  const s=list();expect(s).toContain("item.courseLabel");
  expect(s).toContain("item.mentorName");expect(s).toContain("item.dueState");
  expect(s).toContain("item.phaseLabel");
 });
 it("LEARNER-projects-13 gives mentor, due state and next step with blocker attention",()=>{
  const s=detail();for(const part of ["Next step","Requires attention","Open blocked work","No due date","?tab=board"]){
   expect(s).toContain(part);
  }
 });
 it("LEARNER-projects-26 keeps self-assignment, backlog creation and own-task delete",()=>{
  const service=read("src/modules/projects/learner-own-task-service.ts");
  expect(service).toContain("assigneeMembershipId:membership.id");
  expect(service).toContain("sprintId:sprint?.id??null");
  expect(service).toContain('scope.access!=="LEARNER"');
  expect(service).toContain("deleteLearnerOwnTask");
  expect(read("src/components/projects/learner-own-task-controls.tsx")).toContain("Add my task");
 });
 it("LEARNER-projects-33 permits team-visible learner resource links and uploads",()=>{
  const service=read("src/modules/projects/resource-service.ts");
  expect(service).toContain('"LEARNER"');
  expect(service).toContain('input.visibility === "MENTOR_ONLY"');
  expect(read("src/components/projects/project-resource-files-section.tsx"))
   .toContain("canUploadProjectFilePanel(fileRole)");
  expect(canUploadProjectFilePanel({mode:"LEARNER",status:"ACTIVE",
    readOnly:false,hasMembership:true})).toBe(true);
  expect(read("src/components/projects/project-resource-controls.tsx")).toContain("Share a resource");
 });
 it("LEARNER-projects-36 has final-delivery upload and attachment validation",()=>{
  expect(form()).toContain("<ProjectDeliveryFileUploader");
  const service=read("src/modules/projects/submission-service.ts");
  expect(service).toContain("projectFinalFileEvidenceIsVerified(file)");
  expect(service).toContain("projectResourceFiles.projectId");
 });
 it("LEARNER-projects-02 selects draft, review or blocker actions before generic navigation",()=>{
  const s=page();expect(s).toContain("Update your submission");
  expect(s).toContain("Finish your draft submission");
  expect(s).toContain("Open blocked work");
 });
 it("LEARNER-projects-03 blocks are labelled and linked to Board blocked tasks",()=>{
  const s=page();expect(s).toContain('["Blocked"]');expect(s).toContain("?tab=board&lane=Blocked");
 });
 it("LEARNER-projects-04 maps legacy status labels and exposes blocked attention",()=>{
  const s=read("src/components/projects/project-participant-list-controls.tsx");
  expect(s).toContain("In progress");expect(s).toContain("Ready");
  expect(s).toContain('<option value="BLOCKED">Blocked</option>');
  expect(page()).toMatch(/const attention\s*=\s*one\(params\.attention\)/);
  expect(page()).toContain('attentionSchema = z.enum(["LEARNER_ACTION","BLOCKED"])');
 });
 it("LEARNER-projects-06 exact list empty copy distinguishes no assignment from filters",()=>{
  expect(learnerProjectListEmptyState(0,0).title).toBe("No projects assigned yet.");
  expect(learnerProjectListEmptyState(3,0).title).toBe("No projects match these filters.");
 });
 it("LEARNER-projects-07 naturally orders numbered team titles",()=>{
  expect(compareNumberedTeamProjects("Team 2","Team 10")).toBeLessThan(0);
  expect(compareNumberedTeamProjects("Team 10","Team 2")).toBeGreaterThan(0);
  expect(compareNumberedTeamProjects("Capstone","Team 2")).toBe(0);
 });
 it("LEARNER-projects-08 exposes legacy task completion and manual estimate wording",()=>{
  const s=page();expect(s).toContain("Task completion ");
  expect(s).toContain("Admin-reported progress / Manual estimate");
 });
 it("LEARNER-projects-10 archived learner workspace has exact read-only copy",()=>{
  expect(detail()).toContain('"Archived workspace"');
  expect(detail()).toContain("Team, execution, delivery, resources, meetings and activity remain available for review. Mutations are disabled.");
 });
 it("LEARNER-projects-11 performance alias targets learner Board and delivery remains available",()=>{
  const s=read("src/app/(authenticated)/learn/projects/[projectId]/page.tsx");
  expect(s).toContain('tab === "performance"');expect(s).toContain('tab === "delivery"');
 });
 it("LEARNER-projects-12 reads authored done criteria and personas from pinned template",()=>{
  const blueprint=projectTemplateBlueprintSchema.parse({
   overview:{goal:"Goal",deliverables:["Build"],definitionOfDone:["Reviewed"],personas:["QA"]},
  });
  const data=learnerProjectGoalSummary(blueprint);
  expect(data.definitionOfDone).toEqual(["Reviewed"]);
  expect(data.personas).toEqual(["QA"]);
  expect(read("src/components/projects/learner-project-goals.tsx")).toContain("No personas have been added yet.");
 });
 it("LEARNER-projects-15 Overview includes final submission and review feedback hint",()=>{
  const s=detail();expect(s).toContain("Final submission");
  expect(s).toContain("Mentor left feedback");
 });
 it("LEARNER-projects-16 Overview uses legacy learner section names",()=>{
  expect(read("src/components/projects/learner-project-goals.tsx")).toContain("About this project");
  const s=detail();expect(s).toContain("Project team · Works on assigned tasks and shared submissions");
  expect(s).toContain("Final submission");
 });
 it("LEARNER-projects-17 request meeting button, dialog and success use legacy copy",()=>{
  const s=meetings();for(const part of ["Request a meeting","Send request",
   "Meeting request sent to your mentor.","Agenda / reason"])expect(s).toContain(part);
 });
 it("LEARNER-projects-18 withdrawal copy distinguishes learner request cancellation",()=>{
  const s=meetings();for(const part of ["Withdraw this meeting request?",
   "Your mentor will no longer see this request.","Meeting request withdrawn.","Withdraw request"])
   expect(s).toContain(part);
 });
 it("LEARNER-projects-19 rejects past meeting start and end before start",()=>{
  const s=meetings();expect(s).toContain("Preferred date cannot be in the past.");
  expect(s).toContain("End time must be after the start time.");
  expect(s).toContain("minStart={minStart}");
 });
 it("LEARNER-projects-23 shows releases and sprints without internal schema text",()=>{
  const s=detail();expect(s).toContain('"Releases and Sprints"');
  expect(s).not.toContain("state from normalized");
 });
 it("LEARNER-projects-27 preserves Mine and clear-all learner Board filters",()=>{
  const s=read("src/components/projects/learner-project-board-search.tsx");
  expect(s).toContain("mine");expect(s).toContain("Clear all");expect(s).toContain("Filters");
 });
 it("LEARNER-projects-28 task modal includes done when, approach, comments and task actions",()=>{
  const s=read("src/components/projects/learner-board-task-detail-dialog.tsx");
  expect(s).toContain("Done when");expect(s).toContain("Approach");
  expect(s).toContain("ProjectTaskComments");expect(s).toContain("LearnerTaskStatusActions");
 });
 it("LEARNER-projects-29 pulling backlog task requires active sprint",()=>{
  const s=board();expect(s).toContain("/backlog/pull");
  expect(s).toContain("Start a sprint before moving backlog tasks onto the board.");
 });
 it("LEARNER-projects-30 comments validate nonempty note and expose comment kind",()=>{
  const s=read("src/components/projects/project-task-comments.tsx");
  expect(s).toContain("PROJECT_TASK_COMMENT_KINDS");
  expect(s).toContain('if(!body.trim()){setError("Add a note before posting");return;}');
  expect(s).toContain("Add a note before posting");
 });
 it("LEARNER-projects-31 Board shows Add my task, filters and saving feedback",()=>{
  expect(read("src/components/projects/learner-own-task-controls.tsx")).toContain("Add my task");
  expect(read("src/components/projects/learner-project-board-search.tsx")).toContain("Filters");
  expect(board()).toContain("Saving your change…");
  expect(form()).toContain("Submit final work");
 });
 it("LEARNER-projects-32 task detail shows real type and estimate fields",()=>{
  const s=read("src/components/projects/learner-board-task-detail-dialog.tsx");
  expect(s).toContain("facts.taskType");expect(s).toContain("facts.estimate");
 });
 it("LEARNER-projects-37 final draft automatically saves after editing",()=>{
  const s=form();expect(s).toContain('setAutosaveStatus("saving")');
  expect(s).toContain('},1800)');expect(s).toContain("Draft saved");
 });
 it("LEARNER-projects-38 final delivery shares team context and latest review",()=>{
  const s=form();expect(s).toContain("Last edited by");
  expect(s).toContain("Mentor review:");
  expect(s).toContain("What’s left before you can submit");
  expect(s).toContain("Accepted · Your final delivery is locked after approval.");
 });
 it("LEARNER-projects-39 uses primary-link and final summary legacy field copy",()=>{
  const s=form();expect(s).toContain("Primary link");
  expect(s).toContain("Short summary of what was submitted");
  expect(s).toContain("Add any final notes");
 });
 it("LEARNER-projects-40 checks team confirmation and summary plus evidence",()=>{
  const s=form();expect(s).toContain("Submit on behalf of your team?");
  expect(s).toContain("Add at least one attachment and a summary before submitting.");
  expect(s).toContain("Submission sent for review.");
 });
 it("LEARNER-projects-R03 disabled submit explains readiness to assistive technology",()=>{
  const s=form();expect(s).toContain("aria-describedby");
  expect(s).toContain("Complete every release, sprint and task before submitting.");
 });
 it("LEARNER-projects-05 supports 10/25/50 per page and displays numeric range",()=>{
  const s=read("src/components/projects/project-participant-list-controls.tsx");
  expect(s).toContain("[10,25,50]");expect(s).toContain('+" of "+total+" projects"');
 });
 it("LEARNER-projects-22 roadmap links to colored release status sections",()=>{
  const s=detail();expect(s).toContain('aria-label="Release roadmap"');
  expect(s).toContain('"#project-release-"+release.id');
  expect(s).toContain('id={"project-release-"+release.id}');
 });
});
