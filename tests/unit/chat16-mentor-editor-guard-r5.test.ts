import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
const source=(path:string)=>readFileSync(path,"utf8");

describe("chat-16 mentor editor safeguards",()=>{
  it("MEN-projects-meetings-75 guards sprint details across edit and confirmation dialogs",()=>{
    const editor=source("src/components/projects/mentor-sprint-details-edit.tsx");
    expect(editor).toContain("useProjectEditorDiscardGuard(open||confirmOpen,changed,pending,discardDraft)");
    expect(editor).toContain("onOpenChange={next=>{if(next)setOpen(true);else guard.requestClose();}}");
    expect(editor).toContain("onOpenChange={next=>{if(!next)guard.requestClose();}}");
    expect(editor).toContain("onConfirm={guard.confirmDiscard}");
    expect(editor).toContain("You have unsaved project changes. Leave this page and discard them?");
  });
  it("MEN-projects-meetings-R09 preserves the project estimation unit on the sprint editor",()=>{
    const editor=source("src/components/projects/mentor-sprint-details-edit.tsx");
    const workspace=source("src/components/projects/project-workspace.tsx");
    expect(editor).toContain("estimationUnit?:string|null");
    expect(editor).toContain("Project estimation unit:");
    expect(workspace).toContain("estimationUnit={workspace.project.estimationUnit}");
  });
  it("MEN-projects-meetings-57 renders private file timestamps in IST beside status",()=>{
    const files=source("src/components/projects/project-resource-files-panel.tsx");
    expect(files).toContain("Last updated: <time dateTime={file.completedAt??file.createdAt}>");
    expect(files).toContain('timeZone:"Asia/Kolkata"');
    expect(files).toContain("{descriptor.label}");
    expect(files).toContain("{file.originalName}");
  });
  it("MEN-projects-meetings-58 MEN-projects-meetings-76 confirms permanent file deletion without window.confirm",()=>{
    const files=source("src/components/projects/project-resource-files-panel.tsx");
    expect(files).not.toContain("window.confirm(");
    expect(files).toContain("setDeleteTarget(file)");
    expect(files).toContain("This permanently removes the resource for everyone on the project.");
    expect(files).toContain("confirmLabel=\"Delete resource\"");
    expect(files).toContain("onConfirm={()=>{if(deleteTarget)void remove(deleteTarget);}}");
    expect(files).toContain("setDeleteTarget(null)");
  });
  it("MEN-projects-meetings-27 keeps learner meeting requests free of mentor-only facilitation fields",()=>{
    const meeting=source("src/components/projects/project-meeting-controls.tsx");
    const request=meeting.split("export function RequestProjectMeetingControl")[1]?.split("export function ScheduleProjectMeetingControl")[0];
    const scheduled=meeting.split("export function ScheduleProjectMeetingControl")[1];
    expect(request).toBeDefined();
    expect(request).not.toContain("facilitation[field]");
    expect(request).not.toContain("setFacilitation(");
    expect(scheduled).toContain("mentorMeetingFacilitationSchema.parse");
    expect(scheduled).toContain("followUpAt:followUpAt?toIso(followUpAt):null");
  });
  it("MEN-projects-meetings-75 intercepts in-app links until the mentor confirms draft discard",()=>{
    const guard=source("src/components/projects/project-editor-discard-guard.ts");
    expect(guard).toContain('document.addEventListener("click",onLinkClick,true)');
    expect(guard).toContain("event.preventDefault();event.stopPropagation()");
    expect(guard).toContain("destination.current=href");
    expect(guard).toContain("if(pending)return");
    expect(guard).toContain("leaveConfirmed.current=true");
    expect(guard).toContain("window.location.assign(navigateTo)");
    expect(guard).toContain('window.addEventListener("beforeunload",beforeUnload)');
  });
  it("MEN-projects-meetings-75 protects upload metadata and file edits on leave",()=>{
    const panel=source("src/components/projects/project-resource-files-panel.tsx");
    expect(panel).toContain("useProjectEditorDiscardGuard(true,dirty,busy,discardDraft)");
    expect(panel).toContain("selected||uploadTitle.trim()||uploadDescription.trim()||linkedResourceId");
    expect(panel).toContain('title="Discard resource changes?"');
    expect(panel).toContain("onClick={discardGuard.requestClose}");
    expect(panel).toContain("onConfirm={discardGuard.confirmDiscard}");
  });
});
