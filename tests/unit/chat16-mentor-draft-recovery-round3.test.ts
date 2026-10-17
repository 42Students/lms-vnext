import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";

const read=(path:string)=>readFileSync(path,"utf8");
const draftWarning="You have unsaved project changes. Leave this page and discard them?";

describe("chat-16 mentor editor draft recovery",()=>{
  it("MEN-projects-meetings-75 has exactly one sprint and meeting draft guard after upstream reconciliation",()=>{
    const sprint=read("src/components/projects/mentor-sprint-write.tsx");
    const sprintCreate=sprint.slice(0,sprint.indexOf("export function MentorSprintTransition("));
    expect(sprintCreate.split("const dirty=").length-1).toBe(1);
    expect(sprintCreate).not.toContain("resetForm()");
    expect(sprintCreate).toContain("guard.confirmDiscard");
    const task=read("src/components/projects/mentor-task-create.tsx");
    expect(task).not.toContain("resetForm()");
    expect(task).toContain("discardDraft();");
    const meeting=read("src/components/projects/project-meeting-controls.tsx");
    const schedule=meeting.slice(meeting.indexOf("export function ScheduleProjectMeetingControl("),
      meeting.indexOf("export function ProjectMeetingTransitionActions("));
    expect(schedule.split("const dirty=").length-1).toBe(1);
    expect(schedule).not.toContain("setConfirmDiscard(true)");
    expect(schedule).toContain("guard.requestClose()");
  });

  it("MEN-projects-meetings-72 delivers project brief update notices transactionally to active project members",()=>{
    const service=read("src/modules/projects/workspace-brief-service.ts");
    expect(service).toContain('import {notifyActiveProjectMembers} from "./project-notification-service"');
    expect(service).toContain("const updatedEvent=await recordActivityEventInTransaction(tx,context,");
    expect(service).toContain("await notifyActiveProjectMembers(tx,updatedEvent.id,");
    expect(service).toContain('roles:["MENTOR"]');
    expect(service).toContain('roles:["LEARNER"]');
    expect(service).toContain("exceptUserId:context.user.id");
    expect(service).toContain('title:"Project updated"');
  });

  it("MEN-projects-meetings-76 protects task transition errors from raw exception text",()=>{
    const task=read("src/components/projects/mentor-task-status-transition.tsx");
    expect(task).toContain("The task state could not be changed. Reload the latest status and retry.");
    expect(task).not.toContain("caught instanceof Error?caught.message");
  });

  it("MEN-projects-meetings-55 displays independent Files, Links, Other resource counts",()=>{
    const list=read("src/components/projects/project-resource-list.tsx");
    expect(list).toContain('row.resourceType==="FILE"');
    expect(list).toContain("const other=rows.length-files-links;");
    for(const label of ['["Files",files]','["Links",links]','["Other",other]']){
      expect(list).toContain(label);
    }
    expect(list).not.toContain('"Files/other"');
  });

  it("MEN-projects-meetings-75 requires confirmation before discarding task and sprint drafts",()=>{
    const shared=read("src/components/projects/project-editor-discard-guard.ts");
    expect(shared).toContain('window.addEventListener("beforeunload"');
    expect(shared).toContain('window.removeEventListener("beforeunload"');
    expect(shared).toContain("if(dirty)setDiscardOpen(true)");
    for(const file of [
      "src/components/projects/mentor-task-create.tsx",
      "src/components/projects/mentor-sprint-write.tsx",
    ]){
      const code=read(file);
      expect(code).toContain("useProjectEditorDiscardGuard(open,dirty,busy,discardDraft)");
      expect(code).toContain(draftWarning);
      expect(code).toContain("guard.requestClose()");
      expect(code).toContain("guard.confirmDiscard");
      expect(code).toContain("discardDraft();");
      expect(code).not.toContain("setOpen(false);resetForm()");
    }
  });

  it("MEN-projects-meetings-75 protects meeting edits and delivery review feedback",()=>{
    const meeting=read("src/components/projects/project-meeting-controls.tsx");
    const mentorEditor=meeting.slice(meeting.indexOf("export function ScheduleProjectMeetingControl("),
      meeting.indexOf("export function ProjectMeetingTransitionActions("));
    expect(mentorEditor).toContain(draftWarning);
    expect(mentorEditor).toContain("useProjectEditorDiscardGuard(open,dirty,pending,discardDraft)");
    expect(mentorEditor).toContain("guard.requestClose()");
    expect(mentorEditor).toContain('confirmLabel="Discard changes"');
    const delivery=read("src/components/projects/project-delivery-reopen-control.tsx");
    expect(delivery).toContain(draftWarning);
    expect(delivery).toContain("useProjectEditorDiscardGuard(open,Boolean(reason.trim()),pending,discardDraft)");
    expect(delivery).toContain("guard.requestClose()");
    expect(delivery).toContain('confirmLabel="Discard changes"');
  });

  it("MEN-projects-meetings-75 preserves meeting outcome notes and release drafts",()=>{
    const meeting=read("src/components/projects/project-meeting-controls.tsx");
    const actions=meeting.slice(meeting.indexOf("export function ProjectMeetingTransitionActions("));
    expect(actions).toContain(draftWarning);
    expect(actions).toContain("useProjectEditorDiscardGuard(open!==null,Boolean(note.trim()),pending,discardNote)");
    expect(actions).toContain("guard.requestClose()");
    expect(actions).toContain('confirmLabel="Discard changes"');
    const release=read("src/components/projects/mentor-release-editor.tsx");
    expect(release).toContain(draftWarning);
    expect(release).toContain('confirmLabel="Discard changes"');
    expect(release).toContain("window.addEventListener(\"beforeunload\"");
  });

  it("MEN-projects-meetings-76 confirms release deletion without native confirm and safely reports errors",()=>{
    const release=read("src/components/projects/mentor-release-editor.tsx");
    expect(release).not.toContain("window.confirm");
    expect(release).toContain("title=\"Delete this release?\"");
    expect(release).toContain("Could not save the release. Review its latest details and try again.");
    expect(release).toContain("Could not delete the release. Reload its current status and retry.");
    const meeting=read("src/components/projects/project-meeting-controls.tsx");
    const actions=meeting.slice(meeting.indexOf("export function ProjectMeetingTransitionActions("));
    expect(actions).toContain("Review the meeting status and try again.");
    expect(actions).not.toContain("caught instanceof Error");
  });

  it("MEN-projects-meetings-76 keeps task, sprint, meeting and delivery errors friendly",()=>{
    const files=[
      "src/components/projects/mentor-task-create.tsx",
      "src/components/projects/mentor-sprint-write.tsx",
      "src/components/projects/project-delivery-reopen-control.tsx",
      "src/components/projects/mentor-project-closeout-control.tsx",
    ];
    for(const file of files){
      const code=read(file);
      expect(code).not.toContain("error instanceof Error?error.message");
      expect(code).not.toContain("caught instanceof Error?caught.message");
      expect(code).not.toContain("e instanceof Error?e.message");
    }
    const full=read("src/components/projects/project-meeting-controls.tsx");
    const meeting=full.slice(full.indexOf("export function ScheduleProjectMeetingControl("),
      full.indexOf("export function ProjectMeetingTransitionActions("));
    expect(meeting).not.toContain("caught instanceof Error");
    expect(meeting).toContain("Could not schedule this meeting. Review its latest details and try again.");
  });
});
